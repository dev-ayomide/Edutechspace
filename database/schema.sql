-- ============================================
-- EDUTECHSPACE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COURSES TABLE
-- ============================================
-- Drop existing table if it exists (WARNING: This will delete existing data)
-- Comment out the DROP statement if you need to preserve existing course data
DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_slug TEXT UNIQUE,
  title TEXT NOT NULL,
  name TEXT,
  description TEXT,
  image_url TEXT,
  link TEXT,
  route TEXT,
  tags TEXT,
  duration TEXT,
  duration_weeks INTEGER,
  learning_outcomes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(course_slug);

-- ============================================
-- COURSE RESOURCES TABLE (Legacy - to be migrated)
-- ============================================
DROP TABLE IF EXISTS course_resources CASCADE;

CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_type TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('Video', 'PDF')),
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT,
  requirement TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_resources_course_type ON course_resources(course_type);
CREATE INDEX IF NOT EXISTS idx_course_resources_resource_type ON course_resources(resource_type);

-- ============================================
-- COURSES ENROLLED TABLE
-- ============================================
DROP TABLE IF EXISTS courses_enrolled CASCADE;

CREATE TABLE courses_enrolled (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_courses_enrolled_user_id ON courses_enrolled(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_enrolled_course_id ON courses_enrolled(course_id);

-- ============================================
-- MODULES TABLE
-- ============================================
DROP TABLE IF EXISTS modules CASCADE;

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order_index ON modules(course_id, order_index);

-- ============================================
-- LESSONS TABLE
-- ============================================
DROP TABLE IF EXISTS lessons CASCADE;

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('video', 'pdf', 'text', 'quiz')),
  content_url TEXT,
  content_text TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(lesson_type);

-- ============================================
-- LESSON COMPLETIONS TABLE
-- ============================================
DROP TABLE IF EXISTS lesson_completions CASCADE;

CREATE TABLE lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_lesson ON lesson_completions(user_id, lesson_id);

-- ============================================
-- MODULE COMPLETIONS TABLE
-- ============================================
DROP TABLE IF EXISTS module_completions CASCADE;

CREATE TABLE module_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_completions_user_id ON module_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON module_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_user_module ON module_completions(user_id, module_id);

-- ============================================
-- VIEWS FOR CONVENIENT DATA ACCESS
-- ============================================

-- View: Module Progress for Users
CREATE OR REPLACE VIEW module_progress AS
SELECT 
  m.id AS module_id,
  m.course_id,
  m.title AS module_title,
  COUNT(l.id) AS total_lessons,
  COUNT(lc.id) AS completed_lessons,
  CASE 
    WHEN COUNT(l.id) = 0 THEN 0
    ELSE (COUNT(lc.id)::FLOAT / COUNT(l.id)::FLOAT * 100)::INTEGER
  END AS progress_percentage,
  lc.user_id
FROM modules m
LEFT JOIN lessons l ON m.id = l.module_id AND l.is_published = TRUE
LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id
GROUP BY m.id, m.course_id, m.title, lc.user_id;

-- View: Course Progress for Users
CREATE OR REPLACE VIEW course_progress AS
SELECT 
  c.id AS course_id,
  c.title AS course_title,
  COUNT(DISTINCT m.id) AS total_modules,
  COUNT(DISTINCT l.id) AS total_lessons,
  COUNT(DISTINCT lc.id) AS completed_lessons,
  CASE 
    WHEN COUNT(DISTINCT l.id) = 0 THEN 0
    ELSE (COUNT(DISTINCT lc.id)::FLOAT / COUNT(DISTINCT l.id)::FLOAT * 100)::INTEGER
  END AS progress_percentage,
  lc.user_id
FROM courses c
LEFT JOIN modules m ON c.id = m.course_id AND m.is_published = TRUE
LEFT JOIN lessons l ON m.id = l.module_id AND l.is_published = TRUE
LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id
GROUP BY c.id, c.title, lc.user_id;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get next lesson for a user in a course
CREATE OR REPLACE FUNCTION get_next_lesson(p_user_id UUID, p_course_id UUID)
RETURNS TABLE (
  lesson_id UUID,
  lesson_title TEXT,
  module_id UUID,
  module_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    m.id,
    m.title
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = p_user_id
  WHERE m.course_id = p_course_id
    AND m.is_published = TRUE
    AND l.is_published = TRUE
    AND lc.id IS NULL
  ORDER BY m.order_index, l.order_index
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Update course progress based on lesson completions
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress INTEGER;
BEGIN
  -- Get course_id from the lesson
  SELECT m.course_id INTO v_course_id
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE l.id = NEW.lesson_id;
  
  -- Calculate progress
  SELECT 
    COUNT(DISTINCT l.id),
    COUNT(DISTINCT lc.id)
  INTO v_total_lessons, v_completed_lessons
  FROM modules m
  JOIN lessons l ON m.id = l.module_id
  LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = NEW.user_id
  WHERE m.course_id = v_course_id
    AND m.is_published = TRUE
    AND l.is_published = TRUE;
  
  IF v_total_lessons > 0 THEN
    v_progress := (v_completed_lessons::FLOAT / v_total_lessons::FLOAT * 100)::INTEGER;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Update courses_enrolled table
  UPDATE courses_enrolled
  SET 
    progress = v_progress,
    completed = (v_progress = 100),
    completed_at = CASE WHEN v_progress = 100 THEN NOW() ELSE NULL END
  WHERE user_id = NEW.user_id AND course_id = v_course_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update course progress when lesson is completed
CREATE TRIGGER trigger_update_course_progress
AFTER INSERT ON lesson_completions
FOR EACH ROW
EXECUTE FUNCTION update_course_progress();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on tables
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;

-- Modules: Everyone can view published modules
CREATE POLICY "Modules are viewable by everyone" ON modules
  FOR SELECT USING (is_published = TRUE);

-- Modules: Authenticated users can manage all modules (for admin)
CREATE POLICY "Authenticated users can manage modules" ON modules
  FOR ALL USING (auth.role() = 'authenticated');

-- Lessons: Everyone can view published lessons
CREATE POLICY "Lessons are viewable by everyone" ON lessons
  FOR SELECT USING (is_published = TRUE);

-- Lessons: Authenticated users can manage all lessons (for admin)
CREATE POLICY "Authenticated users can manage lessons" ON lessons
  FOR ALL USING (auth.role() = 'authenticated');

-- Lesson Completions: Users can view and insert their own completions
CREATE POLICY "Users can view their own lesson completions" ON lesson_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson completions" ON lesson_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Module Completions: Users can view and insert their own completions
CREATE POLICY "Users can view their own module completions" ON module_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module completions" ON module_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample course
-- INSERT INTO courses (course_slug, title, description, duration) 
-- VALUES ('frontend-dev', 'Frontend Development', 'Learn modern frontend development', '12 weeks');

-- Insert sample modules
-- INSERT INTO modules (course_id, title, description, order_index) 
-- VALUES 
--   ((SELECT id FROM courses WHERE course_slug = 'frontend-dev'), 'Introduction to HTML & CSS', 'Learn the basics of web development', 1),
--   ((SELECT id FROM courses WHERE course_slug = 'frontend-dev'), 'JavaScript Fundamentals', 'Master JavaScript programming', 2),
--   ((SELECT id FROM courses WHERE course_slug = 'frontend-dev'), 'React Framework', 'Build modern web applications with React', 3);

-- ============================================
-- END OF SCHEMA
-- ============================================
