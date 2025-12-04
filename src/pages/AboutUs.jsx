import React from 'react';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  TrophyIcon, 
  SparklesIcon,
  LightBulbIcon,
  GlobeAltIcon,
  HeartIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';

const AboutUs = () => {
  const stats = [
    { icon: UserGroupIcon, number: '10,000+', label: 'Active Students' },
    { icon: AcademicCapIcon, number: '50+', label: 'Expert Instructors' },
    { icon: TrophyIcon, number: '25,000+', label: 'Certificates Issued' },
    { icon: GlobeAltIcon, number: '150+', label: 'Countries Reached' },
  ];

  const values = [
    {
      icon: LightBulbIcon,
      title: 'Innovation',
      description: 'We stay ahead of the curve with cutting-edge technology and teaching methods.',
    },
    {
      icon: HeartIcon,
      title: 'Student-Centric',
      description: 'Your success is our priority. We provide personalized learning experiences.',
    },
    {
      icon: CheckBadgeIcon,
      title: 'Excellence',
      description: 'We maintain the highest standards in curriculum design and instruction.',
    },
    {
      icon: SparklesIcon,
      title: 'Accessibility',
      description: 'Quality education should be accessible to everyone, everywhere.',
    },
  ];

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Learning Officer',
      bio: 'Ph.D. in Computer Science with 15+ years of experience in educational technology.',
      image: 'https://i.pravatar.cc/300?img=12',
    },
    {
      name: 'Michael Chen',
      role: 'Head of Curriculum',
      bio: 'Former tech lead at Fortune 500 companies, passionate about knowledge sharing.',
      image: 'https://i.pravatar.cc/300?img=33',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Student Success Director',
      bio: 'Dedicated to helping students achieve their career goals through quality education.',
      image: 'https://i.pravatar.cc/300?img=47',
    },
    {
      name: 'David Kim',
      role: 'Technology Innovation Lead',
      bio: 'Full-stack developer and educator, building the future of online learning.',
      image: 'https://i.pravatar.cc/300?img=51',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-950 to-slate-900 text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">About RUNTechSpace</h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Empowering the next generation of tech professionals through comprehensive, 
            industry-aligned education and globally recognized certifications.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Mission</h2>
              <p className="text-neutral-600 leading-relaxed">
                To democratize technology education by providing accessible, high-quality courses 
                that prepare learners for real-world challenges. We believe everyone deserves the 
                opportunity to build a successful career in tech, regardless of their background 
                or location.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Vision</h2>
              <p className="text-neutral-600 leading-relaxed">
                To become the world's most trusted platform for technology education, where millions 
                of learners gain the skills they need to transform their careers and contribute to 
                the global tech ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-neutral-900 text-center mb-12">
            Our Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-950 p-4 rounded-full">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-neutral-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-neutral-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4 bg-neutral-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-neutral-900 text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-950 p-3 rounded-full">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-neutral-900 text-center mb-4">
            Meet Our Leadership Team
          </h2>
          <p className="text-neutral-600 text-center mb-12 max-w-2xl mx-auto">
            Our experienced team of educators and industry professionals are dedicated 
            to your success.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-neutral-50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-blue-950 font-semibold mb-3">
                    {member.role}
                  </p>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-neutral-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-neutral-900 text-center mb-12">
            Why Choose RUNTechSpace?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                Industry-Aligned Curriculum
              </h3>
              <p className="text-neutral-600">
                Our courses are designed in collaboration with industry experts to ensure 
                you learn the most relevant and in-demand skills.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                Flexible Learning
              </h3>
              <p className="text-neutral-600">
                Learn at your own pace, on your own schedule. Access courses anytime, 
                anywhere, and on any device.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                Career Support
              </h3>
              <p className="text-neutral-600">
                Beyond courses, we provide career guidance, interview preparation, and 
                networking opportunities to help you land your dream job.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-blue-950 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who are transforming their careers with RUNTechSpace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-white text-blue-950 px-8 py-3 rounded-lg font-semibold hover:bg-neutral-100 transition"
            >
              Get Started Today
            </a>
            <a
              href="/course"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-950 transition"
            >
              Browse Courses
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;

