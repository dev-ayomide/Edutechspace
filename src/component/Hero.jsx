import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import edu1 from '../assets/images/edu1.jpg';
import edu2 from '../assets/images/edu2.jpg';

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="flex flex-wrap">
        {/* Left Column */}
        <div className="w-full md:w-1/2 relative" style={{ minHeight: '85vh' }}>
          <img
            className="absolute top-0 left-0 w-full h-full object-cover"
            src={edu1}
            alt="Students learning"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
          
          <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10 md:p-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-bold mb-4 md:mb-6 leading-[1.1]">
              <span className="block">Learn.</span>
              <span className="relative inline-block mt-2">
                <span className="relative z-10">Grow.</span>
                <span
                  className="absolute bottom-1 left-0 h-2 w-full bg-[#08F1FF] opacity-80"
                  style={{ transform: 'skewX(-12deg)' }}
                ></span>
              </span>
              <span className="block mt-2">Build.</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-lg leading-relaxed">
              Start your tech journey with practical courses taught by industry experts. No fluff, just real skills.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                className="inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-semibold text-neutral-900 bg-[#08F1FF] hover:bg-[#06d9e8] rounded-md transition-colors"
                to="/course"
              >
                <span>Browse Courses</span>
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-semibold text-white border-2 border-white/40 hover:border-white/60 rounded-md transition-colors"
                to="/signup"
              >
                Get Started
              </Link>
            </div>
            
            {/* Simple Stats */}
            <div className="flex flex-wrap gap-6 md:gap-8 text-white/90">
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">10K+</div>
                <div className="text-sm">Students</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">50+</div>
                <div className="text-sm">Instructors</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">25K+</div>
                <div className="text-sm">Certificates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-1/2 relative" style={{ minHeight: '85vh' }}>
          <img
            className="absolute top-0 left-0 w-full h-full object-cover"
            src={edu2}
            alt="Tech education"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
          
          <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10 md:p-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 md:p-8 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-[#08F1FF] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M17.9176 11.7658L15.0151 10L17.9176 8.23417C18.2196 8.05332 18.4825 7.81416 18.691 7.53063C18.8995 7.24711 19.0495 6.92489 19.1322 6.58279C19.2149 6.24069 19.2286 5.88554 19.1726 5.53808C19.1166 5.19061 18.9919 4.85778 18.8059 4.559C18.6199 4.26022 18.3762 4.00148 18.0891 3.79786C17.8021 3.59425 17.4773 3.44984 17.1338 3.37306C16.7904 3.29628 16.435 3.28866 16.0886 3.35066C15.7421 3.41266 15.4115 3.54303 15.116 3.73417L12.501 5.40833V2.5C12.501 1.83696 12.2376 1.20107 11.7687 0.732233C11.2999 0.263392 10.664 0 10.001 0C9.33793 0 8.70205 0.263392 8.23321 0.732233C7.76437 1.20107 7.50098 1.83696 7.50098 2.5V5.49L4.88597 3.73417C4.28962 3.37698 3.57683 3.26834 2.90114 3.43164C2.22546 3.59495 1.64096 4.01713 1.27356 4.60725C0.906154 5.19736 0.785255 5.90818 0.936903 6.58658C1.08855 7.26498 1.50061 7.85666 2.08431 8.23417L4.98681 10L2.08431 11.7658C1.50061 12.1433 1.08855 12.735 0.936903 13.4134C0.785255 14.0918 0.906154 14.8026 1.27356 15.3927C1.64096 15.9829 2.22546 16.4051 2.90114 16.5684C3.57683 16.7317 4.28962 16.623 4.88597 16.2658L7.50098 14.5675V17.5C7.50098 18.163 7.76437 18.7989 8.23321 19.2678C8.70205 19.7366 9.33793 20 10.001 20C10.664 20 11.2999 19.7366 11.7687 19.2678C12.2376 18.7989 12.501 18.163 12.501 17.5V14.5167L15.116 16.2667C15.7123 16.6239 16.4251 16.7325 17.1008 16.5692C17.7765 16.4059 18.361 15.9837 18.7284 15.3936C19.0958 14.8035 19.2167 14.0927 19.065 13.4143C18.9134 12.7359 18.5013 12.1433 17.9176 11.7658Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl text-white font-bold mb-1">
                    RTS Certifications
                  </h3>
                  <p className="text-white/70 text-sm md:text-base">
                    Get certified and boost your career
                  </p>
                </div>
              </div>
              <Link 
                to="/certification-exam"
                className="inline-flex items-center gap-2 text-[#08F1FF] font-medium hover:text-[#06d9e8] transition-colors text-sm md:text-base"
              >
                <span>Learn more</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            
            <Link 
              className="inline-flex items-center gap-3 px-6 py-4 bg-[#08F1FF] hover:bg-[#06d9e8] text-neutral-900 font-semibold rounded-md transition-colors w-fit" 
              to="/signup"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="22"
                viewBox="0 0 24 27"
                fill="none"
              >
                <path
                  d="M22.5 10.9019C24.5 12.0566 24.5 14.9434 22.5 16.0981L5.24999 26.0574C3.24999 27.2121 0.749999 25.7687 0.749999 23.4593L0.75 3.5407C0.75 1.2313 3.25 -0.212069 5.25 0.942631L22.5 10.9019Z"
                  fill="currentColor"
                />
              </svg>
              <span>Register Now</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
