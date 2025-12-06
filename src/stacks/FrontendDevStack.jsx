import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserIcon, StarIcon, CheckIcon } from '@heroicons/react/24/solid';
import { InfinityIcon, BarChart3, BookOpen } from 'lucide-react';
import { useModules } from '../utils/useModules';
import { useCourse } from '../utils/useCourse';
import { useMultipleLessonCompletions } from '../utils/useLessonCompletion';
import ModuleAccordion from '../component/modules/ModuleAccordion';
import FrontendHeaderImg from '../assets/images/frontendHeaderImage2.jpg';

// The sections for scroll tracking
const sections = [
  { id: 'overview', title: '📘 Overview' },
  { id: 'benefits', title: '🚀 Key Benefits' },
  { id: 'learn', title: '🎓 What You Will Learn' },
  { id: 'requirements', title: '🧰 What You Will Need' },
  { id: 'modules', title: '📚 Course Modules' },
  { id: 'recommendation', title: 'Course Recommendation' },
];

const FrontendDevStack = () => {
  const navigate = useNavigate();
  const courseSlug = 'frontend-dev';
  const [activeSection, setActiveSection] = useState(null);
  const sizes = ['w-5 h-5', 'w-6 h-6', 'w-7 h-7', 'w-8 h-8'];

  // Fetch course details
  const { course, loading: courseLoading, error: courseError } = useCourse(courseSlug);

  // Fetch modules and lessons
  const { modules, loading: modulesLoading } = useModules(courseSlug);

  // Get all lesson IDs for completion tracking
  const allLessonIds = modules.flatMap(m => (m.lessons || []).map(l => l.id));
  const { completions } = useMultipleLessonCompletions(allLessonIds);

  const handleLessonClick = (lesson) => {
    navigate(`/course/${courseSlug}/lesson/${lesson.id}`);
  };

  // Scroll spy logic
  useEffect(() => {
    const handleScroll = () => {
      sections.forEach(({ id }) => {
        const sectionEl = document.getElementById(id);
        if (sectionEl) {
          const rect = sectionEl.getBoundingClientRect();
          if (rect.top < 200 && rect.bottom > 150) {
            setActiveSection(id);
          }
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Offset from top
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 text-neutral-600">
        <p className="text-xl mb-4">Failed to load course details.</p>
        <p className="text-sm">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen w-full">
      {/* Container for timeline (left) + content (right) */}
      <div className="mx-auto flex flex-col lg:flex-row">
        {/* Timeline Nav on the left (hidden on small screens) */}
        <aside className="hidden lg:block lg:w-1/5 sticky top-0 h-screen overflow-auto border-r border-gray-200 p-6">
          <nav className="space-y-4">
            {sections.map(({ id, title }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => handleNavClick(e, id)}
                className="group block relative pl-6 cursor-pointer"
              >
                {/* Vertical line */}
                <span className="absolute left-2 top-0 bottom-0 border-l-2 border-gray-300" />
                {/* Bullet */}
                <span
                  className={`
                    w-3 h-3 rounded-full absolute left-1 top-1.5 
                    ${activeSection === id
                      ? 'bg-blue-900'
                      : 'bg-gray-300 group-hover:bg-blue-600 transition-colors'
                    }
                  `}
                />
                <span
                  className={`ml-4 text-sm font-semibold ${activeSection === id
                    ? 'text-blue-900'
                    : 'text-gray-700 group-hover:text-blue-700'
                    }`}
                >
                  {title}
                </span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="lg:w-4/5 py-3 px-6 lg:px-12 space-y-16">
          {/* Header Section */}
          <div className="relative w-full h-[500px] overflow-hidden pb-32">
            <img
              src={course.header_image_url || FrontendHeaderImg}
              alt={course.title}
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 mt-[-135px]">
              <h1 className="text-6xl md:text-7xl md:font-extrabold font-bold text-slate-900 mb-2">
                {course.title}
              </h1>
              <p className="text-lg md:text-2xl text-slate-900 max-w-2xl">
                {course.description || "Craft beautiful interfaces."}
              </p>
            </div>
            {/* Horizontal Badge/Tag Section */}
            <div
              className="
                absolute 
                bottom-[120px] 
                left-1/2 
                transform 
                -translate-x-1/2 
                translate-y-1/2
                w-[90%]
                max-w-4xl
                bg-white 
                rounded-xl 
                shadow-lg 
                px-6 
                py-6 
                flex 
                flex-wrap 
                justify-between 
                gap-4
              "
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-md md:text-xl font-semibold text-blue-950">{course.difficulty_level || 'Beginner Level'}</p>
                  <BarChart3 className="w-5 h-5 text-blue-950" />
                </div>
                <p className="text-sm text-slate-600">Expected Proficiency</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-md md:text-xl font-semibold text-blue-950">{course.schedule_type || 'Flexible Schedule'}</p>
                  <InfinityIcon className="w-5 h-5 text-blue-950" />
                </div>
                <p className="text-sm text-slate-600">Self Paced</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-blue-950" />
                  ))}
                  <p className="text-md md:text-lg font-semibold text-blue-950">{course.rating || 4.2} Ratings</p>
                </div>
                <p className="text-sm text-slate-600">Over {course.reviews_count?.toLocaleString() || '4,000'} reviews</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {sizes.map((size, i) => (
                    <UserIcon key={i} className={`${size} text-blue-950`} />
                  ))}
                </div>
                <p className="text-md md:text-lg font-semibold text-blue-950">{course.students_applied_count?.toLocaleString() || 200} Students Applied</p>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="mb-12" id='overview'>
            <h2 className="text-3xl font-bold text-blue-950 mb-4">Course Overview</h2>
            <p className="text-xl text-neutral-800 leading-relaxed">
              {course.overview_full || course.description}
            </p>
          </div>

          {/* Key Benefits Section */}
          <div id="benefits">
            <h2 className="text-3xl font-bold text-blue-950 mb-4">Key Benefits</h2>
            <ul className="space-y-2 text-xl text-neutral-800 pl-6">
              {(course.key_benefits || []).map((benefit, idx) => (
                <li key={idx} className="flex items-center">
                  <CheckIcon className="w-6 h-6 text-slate-500 mr-2" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Learn Section */}
          <div id="learn">
            <h2 className="text-3xl font-bold text-blue-950 mb-4">What you will learn</h2>
            <ul className="space-y-2 text-xl text-neutral-800 pl-6">
              {(course.what_you_will_learn || []).map((learn, idx) => (
                <li key={idx} className="flex items-center">
                  <CheckIcon className="w-6 h-6 text-slate-500 mr-2" />
                  {learn}
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div id="requirements">
            <h2 className="text-3xl font-bold text-blue-950 mb-4">What You Will Need</h2>
            <ul className="list-disc pl-6 text-xl text-neutral-800 space-y-2">
              {(course.requirements || []).map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Course Modules Section */}
          <div id="modules" className="mb-16">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-blue-950 mb-2">Course Modules</h2>
              <p className="text-lg text-neutral-600">
                Structured learning path with interactive lessons and hands-on projects
              </p>
            </div>

            {modulesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <ModuleAccordion
                    key={module.id}
                    module={module}
                    moduleNumber={index + 1}
                    completedLessonIds={completions}
                    onLessonClick={handleLessonClick}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-8 text-center">
                <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 text-lg">
                  Course modules are being prepared. Check back soon!
                </p>
              </div>
            )}
          </div>

          {/* Course Recommendation */}
          <div id="recommendation" className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <StarIcon className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center bg-blue-500/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm border border-blue-400/30">
                  <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-sm font-semibold tracking-wide text-blue-100">Recommended Next Step</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">Advance Your Career with Backend Development</h3>
                <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                  Ready to go full stack? Our Backend Development specialization is recommended for you.
                  Master server-side technologies.
                </p>
                <Link
                  to="/stack/backend-dev"
                  className="inline-flex items-center px-8 py-3 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
                >
                  Explore Course
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-500/30 p-3 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl">Backend Development</h4>
                      <p className="text-blue-200">Full Stack Mastery</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "API Development",
                      "Database Management",
                      "Server Architecture",
                      "Security"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center text-blue-100">
                        <CheckIcon className="w-5 h-5 mr-3 text-green-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default FrontendDevStack;
