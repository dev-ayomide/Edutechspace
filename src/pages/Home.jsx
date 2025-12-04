import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../component/Hero';
import {
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  GlobeAltIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';

const Home = () => {
  const stats = [
    { icon: UserGroupIcon, number: '10,000+', label: 'Active Students', color: 'text-blue-600' },
    { icon: AcademicCapIcon, number: '50+', label: 'Expert Instructors', color: 'text-green-600' },
    { icon: TrophyIcon, number: '25,000+', label: 'Certificates Issued', color: 'text-yellow-600' },
    { icon: GlobeAltIcon, number: '150+', label: 'Countries Reached', color: 'text-purple-600' },
  ];

  const features = [
    {
      icon: AcademicCapIcon,
      title: 'Expert Instructors',
      description: 'Learn from industry professionals with hands-on experience and real-world expertise.',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: BookOpenIcon,
      title: 'Comprehensive Courses',
      description: 'Covering all major tech fields from beginner to advanced levels with practical projects.',
      gradient: 'from-green-500 to-green-600',
    },
    {
      icon: CheckBadgeIcon,
      title: 'Globally Recognized Certificates',
      description: 'Earn industry-standard certificates that boost your career and validate your skills.',
      gradient: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: ClockIcon,
      title: 'Self-Paced Learning',
      description: 'Learn at your own pace with lifetime access to course materials and resources.',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      icon: SparklesIcon,
      title: 'Hands-On Projects',
      description: 'Build real-world projects and build a portfolio that showcases your skills.',
      gradient: 'from-pink-500 to-pink-600',
    },
    {
      icon: UserGroupIcon,
      title: 'Community Support',
      description: 'Join a vibrant community of learners and get support from peers and mentors.',
      gradient: 'from-indigo-500 to-indigo-600',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Developer',
      content: 'RUNTechSpace transformed my career! The courses are comprehensive and the instructors are amazing.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Data Scientist',
      content: 'Best investment I\'ve made. The practical projects helped me land my dream job.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Frontend Developer',
      content: 'The self-paced learning and community support made all the difference. Highly recommended!',
      rating: 5,
    },
  ];

  return (
    <div className="overflow-hidden">
      <Hero />
      
      {/* Stats Section */}
      <section className="bg-neutral-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 md:p-6 text-center border border-neutral-200"
                >
                  <Icon className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-xs md:text-sm text-neutral-600">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
              Why Choose RUNTechSpace?
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Learn practical skills from industry experts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
              What Students Say
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Real feedback from our community
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-neutral-200"
              >
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-neutral-700 mb-4 text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-neutral-900 text-sm">{testimonial.name}</div>
                  <div className="text-xs text-neutral-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-blue-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-neutral-300 mb-8 max-w-xl mx-auto">
              Join thousands of students learning and advancing their careers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#FFFFFF] text-neutral-900 font-semibold rounded-md hover:bg-[#06d9e8] transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/course"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-neutral-900 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
