import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { supabase } from '../utils/supabase';
import { AuthContext } from '../context/AuthProvider';
import { toast } from 'react-toastify';
import LoadingPage from '../pages/LoadingPage';

// Map route paths to course types
const routeToCourseType = {
  'frontend': 'Frontend Development',
  'backend': 'Backend Development',
  'cybersecurity': 'Cybersecurity',
  'datascience': 'Data Science',
  'uiux': 'UI/UX',
  'AI': 'Artificial Intelligence',
  'machine-learning': 'Machine Learning'
};

const getShuffledQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];
  return [...questions].sort(() => Math.random() - 0.5);
};

const ExamPage = () => {
  const { examType } = useParams(); // e.g., 'frontend', 'backend', etc.
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // Exam data from database
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Exam state
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState([]); // Track all answers for submission
  const [startTime, setStartTime] = useState(null);

  // Get course type from route parameter
  const courseType = routeToCourseType[examType] || examType;

  // Fetch exam and questions from database
  useEffect(() => {
    const fetchExam = async () => {
      if (!courseType) {
        setError('Invalid exam type');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch exam metadata - try by course_type first, then by exam_type
        let examData, examError;
        const examTypeMap = {
          'Frontend Development': 'frontend',
          'Backend Development': 'backend',
          'Cybersecurity': 'cybersecurity',
          'Data Science': 'datascience',
          'UI/UX': 'uiux',
          'Artificial Intelligence': 'ai',
          'Machine Learning': 'machinelearning'
        };
        const mappedExamType = examTypeMap[courseType] || examType;
        
        // Try fetching by course_type first
        const { data: dataByCourseType, error: errorByCourseType } = await supabase
          .from('exams')
          .select('*')
          .eq('course_type', courseType)
          .eq('is_active', true)
          .single();
        
        if (dataByCourseType && !errorByCourseType) {
          examData = dataByCourseType;
        } else {
          // Try by exam_type
          const { data: dataByExamType, error: errorByExamType } = await supabase
            .from('exams')
            .select('*')
            .eq('exam_type', mappedExamType)
            .eq('is_active', true)
            .single();
          examData = dataByExamType;
          examError = errorByExamType;
        }

        if (examError) {
          throw new Error(`Exam not found: ${examError.message}`);
        }

        if (!examData) {
          throw new Error(`No exam found for ${courseType}`);
        }

        setExam(examData);
        // Use time_limit if available, otherwise calculate from duration_minutes
        const timeLimit = examData.time_limit || (examData.duration_minutes * 60) || 900;
        setTimeLeft(timeLimit);

        // Fetch exam questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', examData.id)
          .order('order_index', { ascending: true });

        if (questionsError) {
          throw new Error(`Failed to fetch questions: ${questionsError.message}`);
        }

        if (!questionsData || questionsData.length === 0) {
          throw new Error(`No questions found for ${courseType} exam`);
        }

        // Transform questions to match component expectations
        const transformedQuestions = questionsData.map(q => ({
          id: q.id,
          question: q.question || q.question_text, // Use question if available, fallback to question_text
          options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : JSON.parse(q.options || '[]')),
          answer: q.correct_answer,
          points: q.points || 1
        }));

        // Shuffle questions
        const shuffled = getShuffledQuestions(transformedQuestions);
        setQuestions(shuffled);
        
      } catch (err) {
        console.error('Error fetching exam:', err);
        setError(err.message);
        toast.error(`Failed to load exam: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [courseType]);

  // Timer effect
  useEffect(() => {
    if (started && !showResult && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleExamComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [started, showResult, timeLeft]);

  const handleOptionClick = (option) => {
    if (showResult) return;
    
    setSelectedOption(option);
    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.answer;
    
    // Track answer
    setAnswers(prev => [...prev, {
      question_id: currentQuestion.id,
      question: currentQuestion.question,
      answer: option,
      correct_answer: currentQuestion.answer,
      is_correct: isCorrect
    }]);

    if (isCorrect) {
      setScore(prev => prev + (currentQuestion.points || 1));
    }
    
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        handleExamComplete();
      }
    }, 1000);
  };

  const handleExamComplete = async () => {
    setShowResult(true);
    const totalPoints = score;
    const totalQuestions = questions.length;
    const percentage = Math.round((totalPoints / totalQuestions) * 100);
    const passed = percentage >= (exam?.passing_score || 60);
    const timeTaken = exam?.time_limit - timeLeft;

        // Save exam results to database
    if (user && exam) {
      try {
        const { error: saveError } = await supabase
          .from('exam_results')
          .insert([{
            user_id: user.id,
            exam_id: exam.id,
            score: totalPoints,
            total_questions: totalQuestions,
            correct_answers: totalPoints, // Map score to correct_answers
            passed: passed,
            time_taken_minutes: Math.floor(timeTaken / 60), // Convert seconds to minutes
            answers: answers,
            submitted_at: new Date().toISOString()
          }]);

        if (saveError) {
          console.error('Error saving exam results:', saveError);
          toast.error('Failed to save exam results, but your score is recorded.');
        } else {
          toast.success('Exam results saved successfully!');
        }
      } catch (err) {
        console.error('Error saving exam results:', err);
        toast.error('Failed to save exam results, but your score is recorded.');
      }
    }
  };

  const handleStart = () => {
    setStarted(true);
    setStartTime(new Date().toISOString());
    setScore(0);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setAnswers([]);
  };

  const handleRetry = () => {
    const shuffled = getShuffledQuestions(questions);
    setQuestions(shuffled);
    setStarted(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowResult(false);
    const timeLimit = exam?.time_limit || (exam?.duration_minutes ? exam.duration_minutes * 60 : 900);
    setTimeLeft(timeLimit);
    setAnswers([]);
    setStartTime(null);
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-white text-red-600">
        <h1 className="text-3xl font-bold mb-4">Error Loading Exam</h1>
        <p className="text-lg mb-6">{error}</p>
        <button
          onClick={() => navigate('/certification-exam')}
          className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition"
        >
          Go Back to Exams
        </button>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-white text-gray-600">
        <h1 className="text-3xl font-bold mb-4">Exam Not Available</h1>
        <p className="text-lg mb-6">This exam is not available at the moment.</p>
        <button
          onClick={() => navigate('/certification-exam')}
          className="bg-blue-950 text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition"
        >
          Go Back to Exams
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-white text-blue-950 text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold">{exam.title}</h1>
        <p className="text-base sm:text-lg max-w-xl">{exam.instructions}</p>
        <ul className="text-left list-disc text-sm sm:text-base text-neutral-700 max-w-lg space-y-2">
          <li>Total time: {Math.floor(exam.time_limit / 60)} minutes</li>
          <li>Total questions: {questions.length}</li>
          <li>Multiple choice format</li>
          <li>Each correct answer gives you 1 point</li>
          <li>You need at least {exam.passing_score}% to pass</li>
        </ul>
        <button 
          onClick={handleStart} 
          className="bg-slate-900 text-white px-8 py-3 rounded-lg text-base sm:text-lg hover:bg-blue-950 transition"
        >
          Start Exam
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-white text-blue-950">
      {showResult ? (
        <div className="text-center space-y-4 max-w-2xl">
          <h2 className="text-4xl font-bold">
            {score >= (exam.passing_score * questions.length / 100) ? '🎉 Congratulations!' : 'Keep Practicing!'}
          </h2>
          <p className="text-xl">You scored {score} out of {questions.length}</p>
          <p className="text-lg">Percentage: {Math.round((score / questions.length) * 100)}%</p>
          <p className={`text-lg font-semibold ${Math.round((score / questions.length) * 100) >= exam.passing_score ? 'text-green-600' : 'text-red-600'}`}>
            {Math.round((score / questions.length) * 100) >= exam.passing_score ? '✅ Passed!' : '❌ Not Passed'}
          </p>
          {Math.round((score / questions.length) * 100) >= exam.passing_score ? (
            <a 
              href="https://wa.me/2348012345678" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition mt-4"
            >
              Join the Runtech Community
            </a>
          ) : (
            <p className="text-lg">Don't worry, you can try again soon!</p>
          )}
          <div className="flex gap-4 justify-center mt-6">
            <button 
              onClick={handleRetry} 
              className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-blue-950 transition"
            >
              Retry Quiz
            </button>
            <button
              onClick={() => navigate('/certification-exam')}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition"
            >
              Back to Exams
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-6">
          <div className="w-full bg-gray-200 h-3 rounded">
            <div
              className="h-full bg-blue-900 rounded transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-blue-950 font-semibold flex items-center justify-end gap-2">
            <ClockIcon className="w-5 h-5 text-blue-800" />
            <span>Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
          </div>
          <div className="text-sm text-gray-600">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <h2 className="text-2xl font-bold">{questions[currentIndex]?.question}</h2>
          <div className="space-y-4">
            {questions[currentIndex]?.options.map((option, idx) => {
              const isCorrect = selectedOption && option === questions[currentIndex].answer;
              const isIncorrect = selectedOption && option === selectedOption && option !== questions[currentIndex].answer;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  disabled={!!selectedOption}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-lg transition flex justify-between items-center ${
                    selectedOption
                      ? isCorrect
                        ? 'bg-green-100 border-green-500'
                        : isIncorrect
                        ? 'bg-red-100 border-red-500'
                        : 'border-gray-300'
                      : 'hover:bg-blue-100 border-gray-300 cursor-pointer'
                  } ${selectedOption ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {option}
                  {isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                  {isIncorrect && <XCircleIcon className="w-5 h-5 text-red-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
