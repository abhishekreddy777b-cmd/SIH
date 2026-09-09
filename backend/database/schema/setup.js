const db = require('../../config/database');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('trainee','trainer','admin')) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  phone TEXT,
  department TEXT,
  designation TEXT,
  location TEXT,
  bio TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainee_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  learning_hours REAL DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trainer_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  qualifications TEXT,
  experience_years INTEGER DEFAULT 0,
  students_trained INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS trainer_competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL,
  competency_id INTEGER NOT NULL,
  proficiency_level INTEGER DEFAULT 50,
  UNIQUE(trainer_id, competency_id),
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trainee_competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainee_id INTEGER NOT NULL,
  competency_id INTEGER NOT NULL,
  score REAL DEFAULT 0,
  level TEXT DEFAULT 'beginner',
  previous_score REAL DEFAULT 0,
  assessed_at DATETIME,
  UNIQUE(trainee_id, competency_id),
  FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail TEXT,
  trainer_id INTEGER,
  category TEXT,
  difficulty TEXT CHECK(difficulty IN ('beginner','intermediate','advanced')),
  duration_hours REAL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','pending','published','archived')),
  max_students INTEGER DEFAULT 100,
  enrolled_count INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_free INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS course_competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  competency_id INTEGER NOT NULL,
  UNIQUE(course_id, competency_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK(content_type IN ('video','document','reading','quiz','assignment','live_class')) DEFAULT 'reading',
  content_url TEXT,
  content_text TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  resources TEXT,
  FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  progress REAL DEFAULT 0,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  UNIQUE(user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_at DATETIME,
  notes TEXT,
  time_spent_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  course_id INTEGER,
  duration_minutes INTEGER DEFAULT 30,
  passing_score REAL DEFAULT 60,
  total_marks INTEGER DEFAULT 100,
  is_baseline INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'mcq',
  options TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  marks INTEGER DEFAULT 1,
  competency_id INTEGER,
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  assessment_id INTEGER NOT NULL,
  score REAL DEFAULT 0,
  total_marks INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0,
  passed INTEGER DEFAULT 0,
  time_taken_minutes INTEGER DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT DEFAULT 'in_progress',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  selected_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skill_gaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  competency_id INTEGER NOT NULL,
  current_score REAL DEFAULT 0,
  target_score REAL DEFAULT 80,
  gap REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  identified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  UNIQUE(user_id, competency_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  match_score REAL DEFAULT 0,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trainer_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  trainer_id INTEGER NOT NULL,
  match_score REAL DEFAULT 0,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS live_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER,
  trainer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at DATETIME,
  end_time DATETIME,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','live','completed','cancelled')),
  max_participants INTEGER DEFAULT 50,
  meeting_type TEXT DEFAULT 'virtual',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at DATETIME,
  left_at DATETIME,
  attendance_status TEXT DEFAULT 'absent',
  FOREIGN KEY (class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  created_by INTEGER,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS poll_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  selected_option INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(poll_id, user_id),
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  deadline DATETIME,
  max_score INTEGER DEFAULT 100,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  score INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  graded_at DATETIME,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER,
  trainer_id INTEGER,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER,
  course_id INTEGER,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  certificate_id TEXT UNIQUE NOT NULL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  trainer_name TEXT,
  course_title TEXT,
  trainee_name TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'system',
  read INTEGER DEFAULT 0,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  audience TEXT DEFAULT 'all',
  priority TEXT DEFAULT 'normal',
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_paths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  competency_id INTEGER,
  courses TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE SET NULL
);
`;

async function setup() {
  try {
    console.log('Setting up VELORA database schema...');
    await db.exec(schema);
    console.log('Database schema created successfully!');
  } catch (err) {
    console.error('Error creating database schema:', err);
  }
}

setup();
