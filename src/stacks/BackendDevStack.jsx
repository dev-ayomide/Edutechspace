// BackendCourse.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserIcon, StarIcon, CheckIcon } from '@heroicons/react/24/solid';
import { InfinityIcon, BarChart3, FileText, Video, Clock, BookOpen, PlayCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useModules } from '../utils/useModules';
import { useMultipleLessonCompletions } from '../utils/useLessonCompletion';
import ModuleAccordion from '../component/modules/ModuleAccordion';
import backendHeaderImg from '../assets/images/backendImage (1).jpg';
import videoimg1 from '../assets/images/backendImage (3).jpg';
import videoimg2 from '../assets/images/backendImage (2).jpg';
import videoimg3 from '../assets/images/backendImage.jpg';
import pdfimg1 from '../assets/images/backendImagge.jpg';
import pdfimg2 from '../assets/images/css-guide.png';
import BackendVideoPdfModal from '../component/dialog/BackendVideoPdfModal';

// The sections for scroll tracking
const sections = [
  { id: 'overview', title: '📘 Overview' },
  { id: 'benefits', title: '🚀 Key Benefits' },
  { id: 'learn', title: '🎓 What You Will Learn' },
  { id: 'requirements', title: '🧰 What You Will Need' },
  { id: 'modules', title: '📚 Course Modules' },
  { id: 'pdf', title: '📂 Additional Resources' },
  { id: 'recommendation', title: 'Course Recommendation' },
];

const BackendCourse = () => {
  const navigate = useNavigate();
  const courseId = 'backend-dev';
  const [activeSection, setActiveSection] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [videoResources, setVideoResources] = useState([]);
  const [pdfResources, setPdfResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeResourceTab, setActiveResourceTab] = useState('pdf'); // 'pdf' or 'video'

  // Fetch modules and lessons
  const { modules, loading: modulesLoading } = useModules(courseId);
  
  // Get all lesson IDs for completion tracking
  const allLessonIds = modules.flatMap(m => (m.lessons || []).map(l => l.id));
  const { completions } = useMultipleLessonCompletions(allLessonIds);

  const handleLessonClick = (lesson) => {
    navigate(`/course/${courseId}/lesson/${lesson.id}`);
  };

  // Fetch resources from Supabase
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const courseType = "Backend Development";
        
        // Fetch videos
        const { data: videos, error: videoError } = await supabase
          .from('course_resources')
          .select('*')
          .eq('course_type', courseType)
          .eq('resource_type', 'Video')
          .order('created_at', { ascending: false });

        // Fetch PDFs
        const { data: pdfs, error: pdfError } = await supabase
          .from('course_resources')
          .select('*')
          .eq('course_type', courseType)
          .eq('resource_type', 'PDF')
          .order('created_at', { ascending: false });

        if (videoError) console.error('Error fetching videos:', videoError);
        if (pdfError) console.error('Error fetching PDFs:', pdfError);

        // Map resources with default images if no thumbnail
        const mappedVideos = (videos || []).map((video, idx) => ({
          ...video,
          image: video.thumbnail_url || [videoimg1, videoimg2, videoimg3, videoimg1][idx % 4] || videoimg1,
          duration: video.duration || 'N/A'
        }));

        const mappedPdfs = (pdfs || []).map((pdf, idx) => ({
          ...pdf,
          image: pdf.thumbnail_url || [pdfimg1, pdfimg2][idx % 2] || pdfimg1
        }));

        setVideoResources(mappedVideos);
        setPdfResources(mappedPdfs);
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

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

  const handleOpenModal = (type, index = 0) => {
    setModalType(type);
    setSelectedIndex(index);
    setShowModal(true);
  };

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
                    ${
                      activeSection === id
                        ? 'bg-blue-900'
                        : 'bg-gray-300 group-hover:bg-blue-600 transition-colors'
                    }
                  `}
                />
                <span
                  className={`ml-4 text-sm font-semibold ${
                    activeSection === id
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
              src={backendHeaderImg}
              alt="Backend Development Hero"
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 mt-[-135px]">
              <h1 className="text-6xl md:text-7xl md:font-extrabold font-bold text-slate-900 mb-2">
                Backend Development
              </h1>
              <p className="text-lg md:text-2xl text-slate-900 font-semibold max-w-2xl">
                Master the Art of Building Beautiful, Responsive Websites with HTML, CSS, and JavaScript.
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
                  <p className="text-md md:text-xl font-semibold text-blue-950">Beginner Level</p>
                  <BarChart3 className="w-6 h-6 text-blue-950" />
                </div>
                <p className="text-sm text-slate-600">Expected Proficiency</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-md md:text-xl font-semibold text-blue-950">Flexible Schedule</p>
                  <InfinityIcon className="w-6 h-6 text-blue-950" />
                </div>
                <p className="text-sm text-slate-600">Self Paced</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-blue-950" />
                  ))}
                  <p className="text-md md:text-lg font-semibold text-blue-950">4.2 Ratings</p>
                </div>
                <p className="text-sm text-slate-600">Over 4,000 reviews</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(i => (
                  <UserIcon key={i} className={`w-${i === 3 ? 8 : i + 4} h-${i === 3 ? 8 : i + 4} text-blue-950`} />
                ))}
                </div>
                <p className="text-md md:text-lg font-semibold text-blue-950">200 Students Applied</p>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="mb-12" id='overview'>
            <h2 className="text-3xl font-bold text-blue-950 mb-4">Course Overview</h2>
            <p className="text-xl text-neutral-800 leading-relaxed">
            This course covers everything you need to get started as a backend developer. From understanding how servers work,
            working with APIs, and databases, to deploying your own full backend services. Whether you're building RESTful APIs
            or securing user data, this course is your complete guide.
            </p>
          </div>

          {/* Key Benefits Section */}
          <div id="benefits">
            <h2 className="text-3xl font-bold text-blue-950 mb-4">Key Benefits</h2>
            <ul className="space-y-2 text-xl text-neutral-800 pl-6">
                {[
                "Hands-on backend project exposure",
                "Access to real-world API examples",
                "Self-paced and beginner-friendly",
                "Project-based learning approach for practical skills",
                "Free PDF + video resources for continuous learning",
                "Access to Runtech community for peer support"
                ].map((benefit, idx) => (
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
                {[
                "Fundamentals of backend development",
                "Node.js & Express.js",
                "Php & PhpAdmin",
                "Creating and consuming APIs",
                "Database integration (MongoDB, SQL)",
                "Error handling & logging",
                "Deployment & environment management"
                ].map((learn, idx) => (
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
              <li>Basic computer literacy</li>
              <li>Access to a computer with internet</li>
              <li>Basic knowledge of JavaScript</li>
              <li>Code editor (like VS Code)</li>
              <li>A desire to learn and build cool stuff</li>
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

          {/* Course Resources - Unified Section */}
          <div id="pdf" className="mb-16">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-blue-950 mb-2">Course Resources</h2>
              <p className="text-lg text-neutral-600">Access PDF guides and video tutorials to enhance your learning</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-8 border-b-2 border-neutral-200">
              <button
                onClick={() => setActiveResourceTab('pdf')}
                className={`flex items-center gap-3 px-6 py-4 font-semibold text-lg transition-all duration-300 relative ${
                  activeResourceTab === 'pdf'
                    ? 'text-blue-950'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <FileText className={`w-5 h-5 ${activeResourceTab === 'pdf' ? 'text-blue-950' : 'text-neutral-400'}`} />
                PDF Resources
                {pdfResources.length > 0 && (
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-sm ${
                    activeResourceTab === 'pdf' ? 'bg-blue-950 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {pdfResources.length}
                  </span>
                )}
                {activeResourceTab === 'pdf' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-950"></span>
                )}
              </button>
              <button
                onClick={() => setActiveResourceTab('video')}
                className={`flex items-center gap-3 px-6 py-4 font-semibold text-lg transition-all duration-300 relative ${
                  activeResourceTab === 'video'
                    ? 'text-blue-950'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Video className={`w-5 h-5 ${activeResourceTab === 'video' ? 'text-blue-950' : 'text-neutral-400'}`} />
                Video Resources
                {videoResources.length > 0 && (
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-sm ${
                    activeResourceTab === 'video' ? 'bg-blue-950 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {videoResources.length}
                  </span>
                )}
                {activeResourceTab === 'video' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-950"></span>
                )}
              </button>
            </div>

            {/* Resources Content */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-950 border-t-transparent"></div>
                <p className="mt-4 text-lg text-neutral-600">Loading resources...</p>
              </div>
            ) : activeResourceTab === 'pdf' ? (
              pdfResources.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-dashed border-neutral-300 rounded-2xl">
                  <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-neutral-700 mb-2">No PDF Resources Available</p>
                  <p className="text-lg text-neutral-500">Check back soon for study materials!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pdfResources.map((pdf, index) => (
                    <div
                      key={pdf.id}
                      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-200 hover:border-blue-950/30"
                    >
                      {pdf.image && (
                        <div className="relative overflow-hidden">
                          <img
                            src={pdf.image}
                            alt={pdf.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 right-4 bg-blue-950/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-xl font-bold text-neutral-900 group-hover:text-blue-950 transition-colors line-clamp-2 flex-1">
                            {pdf.title}
                          </h4>
                        </div>
                        <p className="text-neutral-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                          {pdf.description || 'Comprehensive study material to enhance your learning'}
                        </p>
                        <button
                          onClick={() => handleOpenModal('pdfresource', index)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all duration-300 group-hover:shadow-lg"
                        >
                          <BookOpen className="w-5 h-5" />
                          Study Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              videoResources.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-dashed border-neutral-300 rounded-2xl">
                  <Video className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-neutral-700 mb-2">No Video Resources Available</p>
                  <p className="text-lg text-neutral-500">Check back soon for video tutorials!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videoResources.map((video, index) => (
                    <div
                      key={video.id}
                      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-200 hover:border-blue-950/30"
                    >
                      {video.image && (
                        <div className="relative overflow-hidden">
                          <img
                            src={video.image}
                            alt={video.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                              <PlayCircle className="w-12 h-12 text-blue-950" />
                            </div>
                          </div>
                          <div className="absolute top-4 right-4 bg-blue-950/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                          {video.duration && video.duration !== 'N/A' && (
                            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <Clock className="w-4 h-4 text-white" />
                              <span className="text-white text-sm font-medium">{video.duration}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-xl font-bold text-neutral-900 group-hover:text-blue-950 transition-colors line-clamp-2 flex-1">
                            {video.title}
                          </h4>
                        </div>
                        <p className="text-neutral-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                          {video.description || 'Comprehensive video tutorial to enhance your learning'}
                        </p>
                        <button
                          onClick={() => handleOpenModal('video', index)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all duration-300 group-hover:shadow-lg"
                        >
                          <PlayCircle className="w-5 h-5" />
                          Watch Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Video Resources anchor for navigation */}
          <div id="videos" className="hidden"></div>

          {showModal && (
            <BackendVideoPdfModal type={modalType} index={selectedIndex} onClose={() => setShowModal(false)} />
          )}

          {/* Next Course Recommendation */}
          <div className="mb-16 mt-20" id='recommendation'>
            <h2 className="text-3xl font-bold text-blue-950 mb-4">Next Course Recommendation</h2>
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-2">CyberSecurity.</h3>
              <p className="text-lg text-neutral-700 mb-4">
                Continue your learning journey by exploring cybersecurity frameworks.
              </p>
              <Link
                to="/course/cybersecuritycourse"
                className="inline-block bg-blue-950 text-white px-6 py-3 rounded-lg text-lg hover:bg-slate-800 transition"
              >
                Explore Cyber Security Course
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BackendCourse;
