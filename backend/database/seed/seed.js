const fs = require('fs');
const path = require('path');

const dbFilePath = path.resolve(__dirname, '..', 'database', 'velora.sqlite');
if (fs.existsSync(dbFilePath)) {
  try {
    fs.unlinkSync(dbFilePath);
    console.log('Removed old SQLite file for fresh seed:', dbFilePath);
  } catch (e) {
    console.log('Could not unlink old sqlite file:', e.message);
  }
}

const db = require('../../config/database');
db.resetDB(); // Clear cached in-memory sql.js instance!

const bcrypt = require('bcryptjs');

const schema = `
DROP TABLE IF EXISTS learning_paths;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS poll_responses;
DROP TABLE IF EXISTS polls;
DROP TABLE IF EXISTS class_messages;
DROP TABLE IF EXISTS class_participants;
DROP TABLE IF EXISTS live_classes;
DROP TABLE IF EXISTS trainer_recommendations;
DROP TABLE IF EXISTS course_recommendations;
DROP TABLE IF EXISTS skill_gaps;
DROP TABLE IF EXISTS assessment_answers;
DROP TABLE IF EXISTS assessment_attempts;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS course_modules;
DROP TABLE IF EXISTS course_competencies;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS trainee_competencies;
DROP TABLE IF EXISTS trainer_competencies;
DROP TABLE IF EXISTS competencies;
DROP TABLE IF EXISTS trainer_profiles;
DROP TABLE IF EXISTS trainee_profiles;
DROP TABLE IF EXISTS users;

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

async function seed() {
  console.log('Starting seed process for VELORA Capacity Connect...');

  try {
    await db.exec(schema);
    console.log('Fresh schema initialized.');

    const passwordHash = await bcrypt.hash('Demo@123', 10);

    // 2. Insert Admin
    await db.run(`
      INSERT INTO users (email, password, role, first_name, last_name, department, designation, location, bio)
      VALUES (?, ?, 'admin', 'Vikram', 'Mehta', 'Administration', 'System Director', 'New Delhi', 'Chief Systems Administrator for MoES Capacity Connect Platform.')
    `, ['admin@velora.demo', passwordHash]);
    const adminUser = await db.get('SELECT id FROM users WHERE email = ?', ['admin@velora.demo']);
    const adminId = adminUser.id;

    // Insert Trainers
    const trainers = [
      { email: 'trainer@velora.demo', first_name: 'Dr. Rahul', last_name: 'Sharma', dept: 'Meteorology', desig: 'Senior Scientist', loc: 'New Delhi', qual: 'Ph.D. in Atmospheric Physics & Data Science', exp: 12, bio: 'Lead researcher in atmospheric modeling and Python data analysis.' },
      { email: 'trainer2@velora.demo', first_name: 'Dr. Priya', last_name: 'Patel', dept: 'Oceanography', desig: 'Lead AI Researcher', loc: 'Pune', qual: 'Ph.D. in Computer Vision & Deep Learning', exp: 9, bio: 'Specialist in applying Machine Learning to environmental datasets.' },
      { email: 'trainer3@velora.demo', first_name: 'Prof. Amit', last_name: 'Kumar', dept: 'Computer Science', desig: 'Principal Instructor', loc: 'Bengaluru', qual: 'M.Tech in Software Systems, IIT Bombay', exp: 15, bio: 'Expert instructor in Algorithms, Systems, and Cloud Architectures.' },
      { email: 'trainer4@velora.demo', first_name: 'Dr. Sneha', last_name: 'Reddy', dept: 'Cybersecurity & IT', desig: 'Head of Information Security', loc: 'Hyderabad', qual: 'Ph.D. in Distributed Systems & Security', exp: 11, bio: 'Cybersecurity practitioner and database security architect.' },
      { email: 'trainer5@velora.demo', first_name: 'Prof. Kavita', last_name: 'Nair', dept: 'Capacity Development', desig: 'Director of Education', loc: 'Chennai', qual: 'M.A. Organizational Communication & HR', exp: 14, bio: 'Specialized in executive communication, leadership, and pedagogy.' }
    ];

    const trainerIds = [];
    for (const t of trainers) {
      await db.run(`
        INSERT INTO users (email, password, role, first_name, last_name, department, designation, location, bio)
        VALUES (?, ?, 'trainer', ?, ?, ?, ?, ?, ?)
      `, [t.email, passwordHash, t.first_name, t.last_name, t.dept, t.desig, t.loc, t.bio]);

      const u = await db.get('SELECT id FROM users WHERE email = ?', [t.email]);
      const tId = u.id;
      trainerIds.push(tId);

      await db.run(`
        INSERT INTO trainer_profiles (user_id, qualifications, experience_years, students_trained, average_rating, total_reviews)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [tId, t.qual, t.exp, Math.floor(Math.random() * 200) + 150, 4.8, 42]);
    }

    // Insert Trainees
    const trainees = [
      { email: 'trainee@velora.demo', first_name: 'Arjun', last_name: 'Singh', dept: 'Hydrology', desig: 'Scientific Assistant', loc: 'Dehradun', hours: 48.5, streak: 12 },
      { email: 'trainee2@velora.demo', first_name: 'Ananya', last_name: 'Deshmukh', dept: 'Meteorology', desig: 'Junior Research Fellow', loc: 'Pune', hours: 32.0, streak: 5 },
      { email: 'trainee3@velora.demo', first_name: 'Rohan', last_name: 'Verma', dept: 'Oceanography', desig: 'Project Assistant', loc: 'Goa', hours: 64.2, streak: 19 },
      { email: 'trainee4@velora.demo', first_name: 'Meera', last_name: 'Iyer', dept: 'Data Management', desig: 'Data Analyst Trainee', loc: 'Chennai', hours: 22.0, streak: 3 },
      { email: 'trainee5@velora.demo', first_name: 'Siddharth', last_name: 'Joshi', dept: 'Seismology', desig: 'Field Scientist', loc: 'Shillong', hours: 15.5, streak: 1 },
      { email: 'trainee6@velora.demo', first_name: 'Pooja', last_name: 'Bhatia', dept: 'Hydrology', desig: 'Scientific Assistant', loc: 'Delhi', hours: 55.0, streak: 8 },
      { email: 'trainee7@velora.demo', first_name: 'Vikash', last_name: 'Yadav', dept: 'IT Infrastructure', desig: 'Systems Trainee', loc: 'Kolkata', hours: 10.0, streak: 2 },
      { email: 'trainee8@velora.demo', first_name: 'Divya', last_name: 'Menon', dept: 'Climate Modeling', desig: 'Research Associate', loc: 'Thiruvananthapuram', hours: 78.4, streak: 25 },
      { email: 'trainee9@velora.demo', first_name: 'Karan', last_name: 'Malhotra', dept: 'Meteorology', desig: 'Meteorologist Technical', loc: 'Jaipur', hours: 41.0, streak: 7 },
      { email: 'trainee10@velora.demo', first_name: 'Nisha', last_name: 'Gupta', dept: 'Capacity Building', desig: 'Coordination Officer', loc: 'Lucknow', hours: 18.2, streak: 4 }
    ];

    const traineeIds = [];
    for (const tr of trainees) {
      await db.run(`
        INSERT INTO users (email, password, role, first_name, last_name, department, designation, location)
        VALUES (?, ?, 'trainee', ?, ?, ?, ?, ?)
      `, [tr.email, passwordHash, tr.first_name, tr.last_name, tr.dept, tr.desig, tr.loc]);

      const u = await db.get('SELECT id FROM users WHERE email = ?', [tr.email]);
      const trId = u.id;
      traineeIds.push(trId);

      await db.run(`
        INSERT INTO trainee_profiles (user_id, learning_hours, current_streak, longest_streak, last_activity_date)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [trId, tr.hours, tr.streak, tr.streak + 5]);
    }

    console.log(`Created 1 Admin, ${trainerIds.length} Trainers, ${traineeIds.length} Trainees.`);

    // 3. Insert Competencies
    const competencyData = [
      { name: 'Python Programming', category: 'Programming', description: 'Core Python syntax, libraries, functional and object-oriented programming paradigms.', icon: 'Code' },
      { name: 'Data Analysis & Visualization', category: 'Data Science', description: 'Data processing with Pandas, NumPy, and charting with Matplotlib/Seaborn.', icon: 'BarChart' },
      { name: 'Data Structures & Algorithms', category: 'Computer Science', description: 'Arrays, Stacks, Queues, Trees, Graphs, Sorting, and Algorithm Complexity.', icon: 'Cpu' },
      { name: 'SQL & Relational Databases', category: 'Databases', description: 'Relational database design, SQL querying, joins, indexing, and normalization.', icon: 'Database' },
      { name: 'Machine Learning Fundamentals', category: 'AI & ML', description: 'Supervised/unsupervised learning, classification, regression, model evaluation.', icon: 'Brain' },
      { name: 'Deep Learning & Neural Networks', category: 'AI & ML', description: 'CNNs, RNNs, PyTorch, TensorFlow, and deep learning architectures.', icon: 'Zap' },
      { name: 'Cloud Computing Essentials', category: 'Technology', description: 'Cloud infrastructure, AWS/Azure services, containerization with Docker.', icon: 'Cloud' },
      { name: 'Cybersecurity Fundamentals', category: 'Security', description: 'Network security, authentication, encryption, threat analysis, and security hygiene.', icon: 'Shield' },
      { name: 'Professional Communication', category: 'Professional', description: 'Technical documentation, scientific reporting, presentation skills, and teamwork.', icon: 'MessageSquare' },
      { name: 'Statistical Methods & Modeling', category: 'Mathematics', description: 'Probability, hypothesis testing, regression analysis, time series analysis.', icon: 'Calculator' }
    ];

    const competencyIds = [];
    for (const c of competencyData) {
      await db.run(`
        INSERT INTO competencies (name, category, description, icon)
        VALUES (?, ?, ?, ?)
      `, [c.name, c.category, c.description, c.icon]);

      const comp = await db.get('SELECT id FROM competencies WHERE name = ?', [c.name]);
      competencyIds.push(comp.id);
    }

    console.log(`Created ${competencyIds.length} Competencies.`);

    // 4. Map Trainer Competencies
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 96)`, [trainerIds[0], competencyIds[0]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 92)`, [trainerIds[0], competencyIds[1]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 88)`, [trainerIds[0], competencyIds[4]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 90)`, [trainerIds[0], competencyIds[9]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 95)`, [trainerIds[1], competencyIds[4]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 94)`, [trainerIds[1], competencyIds[5]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 90)`, [trainerIds[1], competencyIds[0]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 91)`, [trainerIds[1], competencyIds[9]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 98)`, [trainerIds[2], competencyIds[2]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 89)`, [trainerIds[2], competencyIds[0]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 93)`, [trainerIds[2], competencyIds[6]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 96)`, [trainerIds[3], competencyIds[3]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 97)`, [trainerIds[3], competencyIds[7]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 87)`, [trainerIds[3], competencyIds[6]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 98)`, [trainerIds[4], competencyIds[8]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 85)`, [trainerIds[4], competencyIds[1]]);

    // 5. Map Trainee Competencies for Arjun Singh (Trainee 1)
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 78.0, 'intermediate', 65.0, datetime('now', '-10 days'))`, [traineeIds[0], competencyIds[0]]);
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 72.0, 'intermediate', 58.0, datetime('now', '-15 days'))`, [traineeIds[0], competencyIds[1]]);
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 48.0, 'developing', 45.0, datetime('now', '-5 days'))`, [traineeIds[0], competencyIds[2]]);   // Data Structures (GAP!)
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 52.0, 'developing', 50.0, datetime('now', '-7 days'))`, [traineeIds[0], competencyIds[3]]);   // SQL (GAP!)
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 65.0, 'intermediate', 60.0, datetime('now', '-12 days'))`, [traineeIds[0], competencyIds[4]]);
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 85.0, 'advanced', 80.0, datetime('now', '-20 days'))`, [traineeIds[0], competencyIds[8]]);

    for (let i = 1; i < traineeIds.length; i++) {
      for (let j = 0; j < 4; j++) {
        const compId = competencyIds[j];
        const score = Math.floor(Math.random() * 50) + 40;
        const level = score > 75 ? 'advanced' : score > 60 ? 'intermediate' : score > 40 ? 'developing' : 'beginner';
        await db.run(`
          INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at)
          VALUES (?, ?, ?, ?, ?, datetime('now', '-3 days'))
        `, [traineeIds[i], compId, score, level, score - 5]);
      }
    }

    // 6. Skill Gaps for Arjun Singh
    await db.run(`
      INSERT INTO skill_gaps (user_id, competency_id, current_score, target_score, gap, status, identified_at)
      VALUES (?, ?, 48.0, 80.0, 32.0, 'active', datetime('now', '-5 days'))
    `, [traineeIds[0], competencyIds[2]]);

    await db.run(`
      INSERT INTO skill_gaps (user_id, competency_id, current_score, target_score, gap, status, identified_at)
      VALUES (?, ?, 52.0, 80.0, 28.0, 'active', datetime('now', '-7 days'))
    `, [traineeIds[0], competencyIds[3]]);

    // 7. Insert Courses
    const coursesData = [
      {
        title: 'Python for Data Analysis & Scientific Computing',
        short_description: 'Master Python libraries like Pandas, NumPy, and Matplotlib for processing environmental and meteorological data.',
        description: 'Comprehensive course designed for scientists, engineers, and analysts at MoES and IMD. Learn to ingest, clean, manipulate, and visualize large-scale scientific datasets using Python.',
        trainer_id: trainerIds[0],
        category: 'Data Science',
        difficulty: 'intermediate',
        duration_hours: 24,
        status: 'published',
        max_students: 150,
        enrolled_count: 84,
        average_rating: 4.9,
        total_reviews: 42,
        is_free: 1,
        competencies: [competencyIds[0], competencyIds[1]]
      },
      {
        title: 'Data Structures & Algorithms in Practice',
        short_description: 'Master core computer science fundamentals: Stacks, Queues, Trees, Hash Tables, and algorithm optimization.',
        description: 'Essential computer science module for building high-performance data pipelines and backend processing software. Focuses on spatial data indexing, search algorithms, and computational efficiency.',
        trainer_id: trainerIds[2],
        category: 'Computer Science',
        difficulty: 'beginner',
        duration_hours: 30,
        status: 'published',
        max_students: 200,
        enrolled_count: 112,
        average_rating: 4.8,
        total_reviews: 58,
        is_free: 1,
        competencies: [competencyIds[2], competencyIds[0]]
      },
      {
        title: 'Machine Learning Fundamentals for Scientists',
        short_description: 'Build predictive models with Scikit-Learn, regression, decision trees, and ensemble methods.',
        description: 'Practical introduction to applied Machine Learning. Learn how to formulate predictive tasks, train models, validate accuracy, and deploy classification and regression systems on real datasets.',
        trainer_id: trainerIds[1],
        category: 'AI & ML',
        difficulty: 'intermediate',
        duration_hours: 36,
        status: 'published',
        max_students: 100,
        enrolled_count: 76,
        average_rating: 4.9,
        total_reviews: 35,
        is_free: 1,
        competencies: [competencyIds[4], competencyIds[0], competencyIds[9]]
      },
      {
        title: 'Advanced SQL & Database Design',
        short_description: 'Master relational queries, complex joins, indexing, transaction isolation, and schema optimization.',
        description: 'Enterprise database architecture course tailored for data managers. Master SQL syntax, performance tuning, spatial queries, and robust database administration principles.',
        trainer_id: trainerIds[3],
        category: 'Databases',
        difficulty: 'advanced',
        duration_hours: 20,
        status: 'published',
        max_students: 80,
        enrolled_count: 54,
        average_rating: 4.7,
        total_reviews: 29,
        is_free: 1,
        competencies: [competencyIds[3]]
      },
      {
        title: 'Deep Learning & Neural Networks',
        short_description: 'Implement Convolutional Neural Networks (CNN) and Recurrent Networks (RNN) using PyTorch.',
        description: 'Advanced course covering neural network architectures, backpropagation, image classification, satellite imagery analysis, and time-series forecasting with LSTM networks.',
        trainer_id: trainerIds[1],
        category: 'AI & ML',
        difficulty: 'advanced',
        duration_hours: 40,
        status: 'published',
        max_students: 60,
        enrolled_count: 45,
        average_rating: 4.9,
        total_reviews: 21,
        is_free: 1,
        competencies: [competencyIds[5], competencyIds[4]]
      },
      {
        title: 'Statistical Methods for Data Science',
        short_description: 'Probability distributions, hypothesis testing, ANOVA, confidence intervals, and time-series.',
        description: 'Comprehensive statistical modeling curriculum covering descriptive and inferential statistics required for rigorous scientific experimentation and data reporting.',
        trainer_id: trainerIds[0],
        category: 'Mathematics',
        difficulty: 'intermediate',
        duration_hours: 22,
        status: 'published',
        max_students: 120,
        enrolled_count: 63,
        average_rating: 4.6,
        total_reviews: 18,
        is_free: 1,
        competencies: [competencyIds[9], competencyIds[1]]
      },
      {
        title: 'Cloud Computing Essentials & Docker',
        short_description: 'Deploy microservices, manage Docker containers, and leverage cloud infrastructure for scale.',
        description: 'Learn modern cloud operations: virtualization, containerization, Kubernetes basics, cloud storage solutions, and deployment strategies for scientific web applications.',
        trainer_id: trainerIds[2],
        category: 'Technology',
        difficulty: 'beginner',
        duration_hours: 18,
        status: 'published',
        max_students: 150,
        enrolled_count: 95,
        average_rating: 4.8,
        total_reviews: 44,
        is_free: 1,
        competencies: [competencyIds[6]]
      },
      {
        title: 'Cybersecurity Fundamentals & Network Defense',
        short_description: 'Protect organizational assets, secure APIs, implement access control, and conduct security audits.',
        description: 'Essential cybersecurity guidelines for modern government agencies and scientific platforms. Covers threat modeling, encryption, IAM, and defensive web security.',
        trainer_id: trainerIds[3],
        category: 'Security',
        difficulty: 'intermediate',
        duration_hours: 25,
        status: 'published',
        max_students: 90,
        enrolled_count: 48,
        average_rating: 4.7,
        total_reviews: 22,
        is_free: 1,
        competencies: [competencyIds[7]]
      },
      {
        title: 'Professional Technical Communication & Leadership',
        short_description: 'Effective scientific writing, stakeholder presentations, technical documentation, and team management.',
        description: 'Empower scientific staff to present complex findings clearly, write high-impact technical documentation, and collaborate effectively across inter-departmental initiatives.',
        trainer_id: trainerIds[4],
        category: 'Professional',
        difficulty: 'beginner',
        duration_hours: 15,
        status: 'published',
        max_students: 200,
        enrolled_count: 140,
        average_rating: 4.9,
        total_reviews: 65,
        is_free: 1,
        competencies: [competencyIds[8]]
      },
      {
        title: 'Web Development with JavaScript & React',
        short_description: 'Build modern responsive web applications, interactive dashboards, and REST API integrations.',
        description: 'Hands-on frontend engineering course focusing on single-page applications, UI design systems, state management, and modern JavaScript features.',
        trainer_id: trainerIds[4],
        category: 'Programming',
        difficulty: 'beginner',
        duration_hours: 28,
        status: 'published',
        max_students: 120,
        enrolled_count: 88,
        average_rating: 4.8,
        total_reviews: 39,
        is_free: 1,
        competencies: [competencyIds[8], competencyIds[0]]
      }
    ];

    const courseIds = [];
    for (const c of coursesData) {
      await db.run(`
        INSERT INTO courses (title, short_description, description, trainer_id, category, difficulty, duration_hours, status, max_students, enrolled_count, average_rating, total_reviews, is_free)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.title, c.short_description, c.description, c.trainer_id, c.category, c.difficulty, c.duration_hours, c.status, c.max_students, c.enrolled_count, c.average_rating, c.total_reviews, c.is_free]);

      const crs = await db.get('SELECT id FROM courses WHERE title = ?', [c.title]);
      const cId = crs.id;
      courseIds.push(cId);

      for (const compId of c.competencies) {
        await db.run(`INSERT INTO course_competencies (course_id, competency_id) VALUES (?, ?)`, [cId, compId]);
      }
    }

    console.log(`Created ${courseIds.length} Courses with competencies.`);

    // 8. Modules & Lessons for Course 1 & Course 2
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 1: Python Fundamentals & Data Structures', 'Basic syntax, lists, tuples, dictionaries, and memory model.', 1, 120)`, [courseIds[0]]);
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 2: Data Manipulation with Pandas & NumPy', 'N-dimensional arrays, Series, DataFrames, indexing, and aggregations.', 2, 180)`, [courseIds[0]]);
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 3: Data Visualization & Reporting', 'Matplotlib plots, Seaborn statistical charts, and exporting figures.', 3, 150)`, [courseIds[0]]);

    const m1 = await db.get('SELECT id FROM course_modules WHERE course_id = ? AND order_index = 1', [courseIds[0]]);
    const m2 = await db.get('SELECT id FROM course_modules WHERE course_id = ? AND order_index = 2', [courseIds[0]]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'Introduction to Python & Scientific Computing Environment', 'Overview of Anaconda, Jupyter Notebooks, and virtual environments.', 'reading', 'Python is the premier language for scientific computing. In this module, we set up Python 3.11 with Conda environments and inspect core language structures.', 30, 1)
    `, [m1.id]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_url, content_text, duration_minutes, order_index)
      VALUES (?, 'Python Data Structures: Lists, Tuples, Sets, & Dictionaries', 'In-depth exploration of built-in collections and time complexity.', 'video', 'https://www.youtube.com/embed/rfscVS0vtbw', 'Mastering built-in Python collection types is fundamental for processing structured data records.', 45, 2)
    `, [m1.id]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'Functions, Modules, and Exception Handling', 'Writing clean modular code with type hints and defensive error handling.', 'reading', 'Functions encapsulate logic. Defensive programming using try/except blocks prevents batch scripts from crashing on corrupted atmospheric readings.', 45, 3)
    `, [m1.id]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'NumPy Fundamentals & Fast Matrix Operations', 'Vectorized math operations and multi-dimensional grid slicing.', 'reading', 'NumPy arrays provide memory-efficient storage and fast C-optimized math operations for gridded satellite data.', 60, 1)
    `, [m2.id]);

    const l1 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Introduction to Python%']);
    const l2 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Python Data Structures%']);
    const l3 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Functions, Modules%']);
    const l4 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%NumPy Fundamentals%']);

    console.log('Fetched lessons:', { l1, l2, l3, l4 });

    // Course 2 modules & lessons
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 1: Linear Data Structures', 'Arrays, Linked Lists, Stacks, and Queues.', 1, 150)`, [courseIds[1]]);
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 2: Trees & Graphs', 'Binary search trees, Heaps, BFS, DFS, and Dijkstra algorithm.', 2, 210)`, [courseIds[1]]);

    const c2m1 = await db.get('SELECT id FROM course_modules WHERE course_id = ? AND order_index = 1', [courseIds[1]]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'Stacks and Queues: Concepts and Applications', 'Understanding LIFO vs FIFO principles and memory allocation.', 'reading', 'A Queue follows First-In First-Out (FIFO) processing, essential for task scheduling and message queues. A Stack follows Last-In First-Out (LIFO).', 45, 1)
    `, [c2m1.id]);

    const c2l1 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Stacks and Queues%']);

    // 9. Enrollments & Progress for Arjun Singh (Trainee 1)
    await db.run(`
      INSERT INTO enrollments (user_id, course_id, status, progress, enrolled_at)
      VALUES (?, ?, 'active', 72.0, datetime('now', '-20 days'))
    `, [traineeIds[0], courseIds[0]]);

    await db.run(`
      INSERT INTO enrollments (user_id, course_id, status, progress, enrolled_at)
      VALUES (?, ?, 'active', 45.0, datetime('now', '-10 days'))
    `, [traineeIds[0], courseIds[1]]);

    await db.run(`
      INSERT INTO enrollments (user_id, course_id, status, progress, enrolled_at, completed_at)
      VALUES (?, ?, 'completed', 100.0, datetime('now', '-30 days'), datetime('now', '-5 days'))
    `, [traineeIds[0], courseIds[9]]);

    // Lesson Progress for Arjun Singh
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-18 days'), 'Mastered Python built-in data types.', 35)`, [traineeIds[0], l1.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-15 days'), 'Tuples are immutable; lists are mutable.', 50)`, [traineeIds[0], l2.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-10 days'), 'Try/except blocks are critical for batch pipelines.', 45)`, [traineeIds[0], l3.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-8 days'), 'NumPy broadcasting rules are useful for matrix math.', 65)`, [traineeIds[0], l4.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-4 days'), 'Queue follows FIFO structure!', 45)`, [traineeIds[0], c2l1.id]);

    // 10. Assessments & Questions
    await db.run(`
      INSERT INTO assessments (title, description, course_id, duration_minutes, passing_score, total_marks, is_baseline, status, created_by)
      VALUES ('MoES Baseline Competency Evaluation 2026', 'Comprehensive diagnostic baseline assessment covering programming, data analysis, computer science, and databases.', NULL, 45, 60, 100, 1, 'published', ?)
    `, [adminId]);

    await db.run(`
      INSERT INTO assessments (title, description, course_id, duration_minutes, passing_score, total_marks, is_baseline, status, created_by)
      VALUES ('Data Structures & Algorithms Knowledge Check', 'Evaluate your knowledge of Stacks, Queues, Trees, and Algorithmic Complexity.', ?, 30, 60, 20, 0, 'published', ?)
    `, [courseIds[1], trainerIds[2]]);

    const aBase = await db.get('SELECT id FROM assessments WHERE is_baseline = 1');
    const aDS = await db.get('SELECT id FROM assessments WHERE course_id = ?', [courseIds[1]]);

    const questionsList = [
      {
        assessment_id: aBase.id,
        question_text: 'Which data structure operates strictly on a First-In, First-Out (FIFO) basis?',
        options: JSON.stringify(['Stack', 'Queue', 'Tree', 'Graph']),
        correct_answer: 'Queue',
        marks: 5,
        competency_id: competencyIds[2],
        explanation: 'A Queue processes items in the exact order they arrive (FIFO), whereas a Stack processes items in Last-In First-Out (LIFO) order.'
      },
      {
        assessment_id: aBase.id,
        question_text: 'In Python, which of the following data structures is IMMUTABLE?',
        options: JSON.stringify(['List', 'Dictionary', 'Tuple', 'Set']),
        correct_answer: 'Tuple',
        marks: 5,
        competency_id: competencyIds[0],
        explanation: 'Tuples cannot be modified after creation, making them immutable.'
      },
      {
        assessment_id: aBase.id,
        question_text: 'Which SQL clause is used to combine rows from two or more tables based on a related column between them?',
        options: JSON.stringify(['GROUP BY', 'JOIN', 'ORDER BY', 'HAVING']),
        correct_answer: 'JOIN',
        marks: 5,
        competency_id: competencyIds[3],
        explanation: 'SQL JOIN clauses (INNER, LEFT, RIGHT, FULL) are used to query data across multiple tables using foreign key relationships.'
      },
      {
        assessment_id: aBase.id,
        question_text: 'What is the worst-case time complexity of searching for an element in an unsorted array of size N?',
        options: JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N^2)']),
        correct_answer: 'O(N)',
        marks: 5,
        competency_id: competencyIds[2],
        explanation: 'In an unsorted array, you may need to inspect all N elements in the worst case (Linear Search O(N)).'
      },
      {
        assessment_id: aBase.id,
        question_text: 'In Supervised Machine Learning, what type of problem involves predicting a continuous numerical target value?',
        options: JSON.stringify(['Classification', 'Clustering', 'Regression', 'Dimensionality Reduction']),
        correct_answer: 'Regression',
        marks: 5,
        competency_id: competencyIds[4],
        explanation: 'Regression predicts continuous quantities (e.g., rainfall in mm), while classification predicts discrete class labels.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'Which data structure is best suited for implementing a function call stack or undo operation?',
        options: JSON.stringify(['Queue', 'Stack', 'Array', 'Binary Tree']),
        correct_answer: 'Stack',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'Stacks use Last-In First-Out (LIFO) order, matching the natural semantics of nested function calls and undo buffers.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'What is the average time complexity for searching an element in a balanced Binary Search Tree (BST)?',
        options: JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N log N)']),
        correct_answer: 'O(log N)',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'A balanced BST halves the search space at each comparison node, leading to O(log N) search time.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'Which algorithm traversal strategy visits all direct neighbors of a graph node before moving deeper?',
        options: JSON.stringify(['Depth-First Search (DFS)', 'Breadth-First Search (BFS)', 'Pre-order Traversal', 'Post-order Traversal']),
        correct_answer: 'Breadth-First Search (BFS)',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'BFS uses a Queue to explore graph nodes level-by-level (level order).'
      },
      {
        assessment_id: aDS.id,
        question_text: 'What happens when an item is pushed onto a Stack that has exceeded its maximum allocated memory space?',
        options: JSON.stringify(['Stack Underflow', 'Stack Overflow', 'Memory Leak', 'Null Pointer Exception']),
        correct_answer: 'Stack Overflow',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'Stack Overflow occurs when call stack space or array allocation limits are exceeded.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'In a Priority Queue, which element is dequeued first?',
        options: JSON.stringify(['The element inserted earliest', 'The element inserted latest', 'The element with the highest priority score', 'A random element']),
        correct_answer: 'The element with the highest priority score',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'Priority Queues order elements by priority score rather than insertion sequence.'
      }
    ];

    for (let idx = 0; idx < questionsList.length; idx++) {
      const q = questionsList[idx];
      await db.run(`
        INSERT INTO questions (assessment_id, question_text, question_type, options, correct_answer, marks, competency_id, explanation, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [q.assessment_id, q.question_text, q.question_type || 'mcq', q.options, q.correct_answer, q.marks, q.competency_id, q.explanation, idx + 1]);
    }

    // 11. Recommendations for Arjun Singh
    await db.run(`
      INSERT INTO course_recommendations (user_id, course_id, match_score, reason)
      VALUES (?, ?, 96.0, 'Identified skill gap in Data Structures (48% score). Enrolling in this course directly targets your primary growth area.')
    `, [traineeIds[0], courseIds[1]]);

    await db.run(`
      INSERT INTO course_recommendations (user_id, course_id, match_score, reason)
      VALUES (?, ?, 91.0, 'Identified skill gap in SQL & Relational Databases (52% score). Recommended for data management proficiency.')
    `, [traineeIds[0], courseIds[3]]);

    await db.run(`
      INSERT INTO trainer_recommendations (user_id, trainer_id, match_score, reason)
      VALUES (?, ?, 95.0, 'Prof. Amit Kumar holds 98% proficiency in Data Structures & Algorithms, matching your top skill gap.')
    `, [traineeIds[0], trainerIds[2]]);

    await db.run(`
      INSERT INTO trainer_recommendations (user_id, trainer_id, match_score, reason)
      VALUES (?, ?, 92.0, 'Dr. Sneha Reddy holds 96% proficiency in Relational Databases and SQL architecture.')
    `, [traineeIds[0], trainerIds[3]]);

    // 12. Live Classes
    await db.run(`
      INSERT INTO live_classes (course_id, trainer_id, title, description, scheduled_at, end_time, status, max_participants, meeting_type)
      VALUES (?, ?, 'Advanced Python Data Structures & Memory Models', 'Live practical session detailing list memory buffers, set hash tables, and custom queue classes.', datetime('now', '-30 minutes'), datetime('now', '+60 minutes'), 'live', 50, 'virtual')
    `, [courseIds[0], trainerIds[0]]);

    await db.run(`
      INSERT INTO live_classes (course_id, trainer_id, title, description, scheduled_at, end_time, status, max_participants, meeting_type)
      VALUES (?, ?, 'Data Structures Masterclass: Trees & Graph Traversal', 'Interactive workshop on BFS/DFS graph search algorithms with live coding.', datetime('now', '+1 day'), datetime('now', '+1 day', '+90 minutes'), 'scheduled', 100, 'virtual')
    `, [courseIds[1], trainerIds[2]]);

    const classLive = await db.get('SELECT id FROM live_classes WHERE status = "live"');

    await db.run(`INSERT INTO class_messages (class_id, user_id, message) VALUES (?, ?, 'Welcome everyone to today live session on Python memory structures!')`, [classLive.id, trainerIds[0]]);
    await db.run(`INSERT INTO class_messages (class_id, user_id, message) VALUES (?, ?, 'Good morning Dr. Sharma! Excited to learn about queue performance.')`, [classLive.id, traineeIds[0]]);
    await db.run(`INSERT INTO class_messages (class_id, user_id, message) VALUES (?, ?, 'Will we cover priority queues today?')`, [classLive.id, traineeIds[1]]);

    await db.run(`
      INSERT INTO polls (class_id, question, options, created_by, status)
      VALUES (?, 'Which data structure operates strictly on a FIFO principle?', '["Stack","Queue","Tree","Graph"]', ?, 'active')
    `, [classLive.id, trainerIds[0]]);

    const poll1 = await db.get('SELECT id FROM polls WHERE class_id = ?', [classLive.id]);

    await db.run(`INSERT INTO poll_responses (poll_id, user_id, selected_option) VALUES (?, ?, 1)`, [poll1.id, traineeIds[0]]);
    await db.run(`INSERT INTO poll_responses (poll_id, user_id, selected_option) VALUES (?, ?, 1)`, [poll1.id, traineeIds[1]]);
    await db.run(`INSERT INTO poll_responses (poll_id, user_id, selected_option) VALUES (?, ?, 0)`, [poll1.id, traineeIds[2]]);

    // 13. Assignments & Submissions
    await db.run(`
      INSERT INTO assignments (course_id, title, description, instructions, deadline, max_score, created_by)
      VALUES (?, 'Assignment 1: Build a Custom Queue & Stack Module in Python', 'Implement a double-ended queue class supporting push, pop, peek, and length methods.', 'Submit a single .py file containing your class definition and unit test cases.', datetime('now', '+5 days'), 100, ?)
    `, [courseIds[1], trainerIds[2]]);

    const assign1 = await db.get('SELECT id FROM assignments WHERE course_id = ?', [courseIds[1]]);

    await db.run(`
      INSERT INTO submissions (assignment_id, user_id, submission_text, score, feedback, status, submitted_at, graded_at)
      VALUES (?, ?, 'class Queue:\n  def __init__(self):\n    self.items = []\n  def enqueue(self, item):\n    self.items.append(item)\n  def dequeue(self):\n    return self.items.pop(0)', 95, 'Excellent submission Arjun! Clean FIFO implementation.', 'graded', datetime('now', '-2 days'), datetime('now', '-1 day'))
    `, [assign1.id, traineeIds[0]]);

    // 14. Certificate for Arjun Singh
    const certId = 'VELORA-2026-98421';
    await db.run(`
      INSERT INTO certificates (user_id, course_id, certificate_id, trainer_name, course_title, trainee_name, issued_at)
      VALUES (?, ?, ?, 'Prof. Kavita Nair', 'Web Development with JavaScript & React', 'Arjun Singh', datetime('now', '-5 days'))
    `, [traineeIds[0], courseIds[9], certId]);

    // 15. Notifications for Arjun Singh
    const notifs = [
      { title: 'New Recommendation Available', desc: 'Based on your recent assessment, "Data Structures & Algorithms in Practice" was recommended for you.', type: 'recommendation', link: '/recommendations' },
      { title: 'Live Class Started!', desc: 'Dr. Rahul Sharma has started "Advanced Python Data Structures". Click to join now.', type: 'class', link: '/live-class/' + classLive.id },
      { title: 'Certificate Issued! 🎓', desc: 'Congratulations! Your certificate for Web Development is now available.', type: 'certificate', link: '/certificates' },
      { title: 'Skill Gap Identified', desc: 'Your Data Structures score is currently 48%. Target level is 80%.', type: 'system', link: '/skill-gaps' },
      { title: 'Assignment Graded', desc: 'Your submission for Assignment 1 scored 95/100.', type: 'course', link: '/my-learning' }
    ];

    for (const n of notifs) {
      await db.run(`
        INSERT INTO notifications (user_id, title, description, type, read, link)
        VALUES (?, ?, ?, ?, 0, ?)
      `, [traineeIds[0], n.title, n.desc, n.type, n.link]);
    }

    // 16. Announcements
    await db.run(`
      INSERT INTO announcements (title, description, audience, priority, created_by)
      VALUES ('Welcome to VELORA Capacity Connect Portal', 'Official launch of the Ministry of Earth Sciences (MoES) and India Meteorological Department digital capacity building platform.', 'all', 'high', ?)
    `, [adminId]);

    await db.run(`
      INSERT INTO announcements (title, description, audience, priority, created_by)
      VALUES ('Annual Competency Assessment Drive 2026', 'All technical staff and scientific trainees are requested to complete their baseline competency assessment by the end of the month.', 'trainees', 'normal', ?)
    `, [adminId]);

    // 17. Messages
    await db.run(`
      INSERT INTO messages (sender_id, receiver_id, content, read)
      VALUES (?, ?, 'Hello Dr. Sharma! I had a quick question regarding memory allocation in Python lists vs tuples.', 1)
    `, [traineeIds[0], trainerIds[0]]);

    await db.run(`
      INSERT INTO messages (sender_id, receiver_id, content, read)
      VALUES (?, ?, 'Hi Arjun! Python tuples have a fixed memory allocation and smaller overhead compared to dynamic lists.', 1)
    `, [trainerIds[0], traineeIds[0]]);

    // 18. Notes
    await db.run(`
      INSERT INTO notes (user_id, lesson_id, course_id, content)
      VALUES (?, ?, ?, 'Remember: Queue follows FIFO (First-In First-Out) structure. Essential for processing scientific sensor data buffers.')
    `, [traineeIds[0], c2l1.id, courseIds[1]]);

    // 19. Bookmarks
    await db.run(`INSERT INTO bookmarks (user_id, item_type, item_id) VALUES (?, 'course', ?)`, [traineeIds[0], courseIds[0]]);
    await db.run(`INSERT INTO bookmarks (user_id, item_type, item_id) VALUES (?, 'course', ?)`, [traineeIds[0], courseIds[1]]);

    console.log('\n====================================================');
    console.log('✅ VELORA DATABASE SEEDED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('DEMO ACCOUNTS READY FOR JUDGES:');
    console.log('1. Trainee: trainee@velora.demo / Demo@123');
    console.log('2. Trainer: trainer@velora.demo / Demo@123');
    console.log('3. Admin:   admin@velora.demo   / Demo@123');
    console.log('====================================================\n');

  } catch (err) {
    console.error('Error during seed execution:', err);
  }
}

seed();
