-- ============================================
-- POPULATE COURSES TABLE
-- Quick script to add all Edutechspace courses
-- ============================================

-- Frontend Development
INSERT INTO courses (course_slug, title, name, description, duration, duration_weeks, route, tags)
VALUES (
  'frontend-dev',
  'Frontend Development',
  'Frontend Development',
  'Master modern frontend development with HTML, CSS, JavaScript, React, and more. Build responsive, interactive web applications.',
  '12 weeks',
  12,
  '/course/frontendcourse',
  'HTML, CSS, JavaScript, React, Web Development'
) ON CONFLICT (course_slug) DO UPDATE SET
  title = EXCLUDED.title,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  duration_weeks = EXCLUDED.duration_weeks,
  route = EXCLUDED.route,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- Backend Development
INSERT INTO courses (course_slug, title, name, description, duration, duration_weeks, route, tags)
VALUES (
  'backend-dev',
  'Backend Development',
  'Backend Development',
  'Learn server-side programming, databases, APIs, and authentication. Build robust backend systems.',
  '12 weeks',
  12,
  '/course/backendcourse',
  'Node.js, Python, APIs, Databases, Server'
) ON CONFLICT (course_slug) DO UPDATE SET
  title = EXCLUDED.title,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  duration_weeks = EXCLUDED.duration_weeks,
  route = EXCLUDED.route,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- Data Science
INSERT INTO courses (course_slug, title, name, description, duration, duration_weeks, route, tags)
VALUES (
  'data-science',
  'Data Science',
  'Data Science',
  'Explore data analysis, visualization, statistics, and data-driven decision making with Python.',
  '10 weeks',
  10,
  '/course/datasciencecourse',
  'Python, Data Analysis, Statistics, Pandas, Visualization'
) ON CONFLICT (course_slug) DO UPDATE SET
  title = EXCLUDED.title,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  duration_weeks = EXCLUDED.duration_weeks,
  route = EXCLUDED.route,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- Machine Learning
INSERT INTO courses (course_slug, title, name, description, duration, duration_weeks, route, tags)
VALUES (
  'machine-learning',
  'Machine Learning',
  'Machine Learning',
  'Build intelligent systems using supervised and unsupervised learning algorithms. Master ML fundamentals.',
  '14 weeks',
  14,
  '/course/mlcourse',
  'Machine Learning, AI, Python, Algorithms, Neural Networks'
) ON CONFLICT (course_slug) DO UPDATE SET
  title = EXCLUDED.title,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  duration_weeks = EXCLUDED.duration_weeks,
  route = EXCLUDED.route,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- Artificial Intelligence
INSERT INTO courses (course_slug, title, name, description, duration, duration_weeks, route, tags)
VALUES (
  'artificial-intelligence',
  'Artificial Intelligence',
  'Artificial Intelligence',
  'Dive deep into AI concepts, deep learning, natural language processing, and computer vision.',
  '16 weeks',
  16,
  '/course/aicourse',
  'AI, Deep Learning, NLP, Computer Vision, Neural Networks'
) ON CONFLICT (course_slug) DO UPDATE SET
  title = EXCLUDED.title,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  duration_weeks = EXCLUDED.duration_weeks,
  route = EXCLUDED.route,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- Cybersecurity
INSERT INTO courses (course_slug, title, name, description, duration, duration_weeks, route, tags)
VALUES (
  'cybersecurity',
  'Cybersecurity',
  'Cybersecurity',
  'Learn network security, ethical hacking, penetration testing, and how to protect systems from threats.',
  '12 weeks',
  12,
  '/course/cybersecuritycourse',
  'Security, Ethical Hacking, Network Security, Penetration Testing'
) ON CONFLICT (course_slug) DO UPDATE SET
  title = EXCLUDED.title,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  duration_weeks = EXCLUDED.duration_weeks,
  route = EXCLUDED.route,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- UI/UX Design
INSERT INTO courses (course_slug, title, name, description, duration, duration_weeks, route, tags)
VALUES (
  'ui-ux-design',
  'UI/UX Design',
  'UI/UX Design',
  'Master user interface and user experience design. Create beautiful, user-friendly digital products.',
  '10 weeks',
  10,
  '/course/uiuxcourse',
  'UI Design, UX Design, Figma, Prototyping, User Research'
) ON CONFLICT (course_slug) DO UPDATE SET
  title = EXCLUDED.title,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  duration_weeks = EXCLUDED.duration_weeks,
  route = EXCLUDED.route,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Uncomment to verify all courses were added:
-- SELECT course_slug, title, duration FROM courses ORDER BY title;
