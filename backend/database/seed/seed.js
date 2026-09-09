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
      { email: 'trainer@velora.demo', first_name: 'Dr. Rahul', last_name: 'Sharma', dept: 'Materials Physics', desig: 'Senior Scientist', loc: 'New Delhi', qual: 'Ph.D. in Crystallography & X-Ray Physics', exp: 12, bio: 'Lead researcher in X-Ray diffraction, phase analysis, and materials characterization.' },
      { email: 'trainer2@velora.demo', first_name: 'Dr. Priya', last_name: 'Patel', dept: 'Electron Microscopy', desig: 'Lead Microscopy Researcher', loc: 'Pune', qual: 'Ph.D. in High-Resolution TEM & Surface Characterization', exp: 9, bio: 'Specialist in HR-TEM imaging, focused ion beam milling, and nanomaterial analysis.' },
      { email: 'trainer3@velora.demo', first_name: 'Prof. Amit', last_name: 'Kumar', dept: 'Physical Metallurgy', desig: 'Principal Instructor', loc: 'Bengaluru', qual: 'M.Tech in Metallurgical Engineering, IIT Bombay', exp: 15, bio: 'Expert instructor in mechanical testing, dislocation dynamics, and electron diffraction.' },
      { email: 'trainer4@velora.demo', first_name: 'Dr. Sneha', last_name: 'Reddy', dept: 'Analytical Chemistry', desig: 'Head of Spectroscopy & Lab Safety', loc: 'Hyderabad', qual: 'Ph.D. in Spectroscopy & Hazardous Materials Protocol', exp: 11, bio: 'Analytical chemist specializing in thermal analysis (DSC/TGA) and laboratory safety.' },
      { email: 'trainer5@velora.demo', first_name: 'Prof. Kavita', last_name: 'Nair', dept: 'Capacity Building', desig: 'Director of Scientific Publishing', loc: 'Chennai', qual: 'Ph.D. Scientific Communication & Research Methods', exp: 14, bio: 'Specialized in technical reporting, research documentation, and scientific ethics.' }
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
      { email: 'trainee@velora.demo', first_name: 'Arjun', last_name: 'Singh', dept: 'Materials Testing Lab', desig: 'Scientific Assistant', loc: 'Dehradun', hours: 48.5, streak: 12 },
      { email: 'trainee2@velora.demo', first_name: 'Ananya', last_name: 'Deshmukh', dept: 'Microstructural Analysis', desig: 'Junior Research Fellow', loc: 'Pune', hours: 32.0, streak: 5 },
      { email: 'trainee3@velora.demo', first_name: 'Rohan', last_name: 'Verma', dept: 'Crystallography Lab', desig: 'Project Assistant', loc: 'Goa', hours: 64.2, streak: 19 },
      { email: 'trainee4@velora.demo', first_name: 'Meera', last_name: 'Iyer', dept: 'Thermal Analysis', desig: 'Laboratory Trainee', loc: 'Chennai', hours: 22.0, streak: 3 },
      { email: 'trainee5@velora.demo', first_name: 'Siddharth', last_name: 'Joshi', dept: 'Metallography', desig: 'Field Scientist', loc: 'Shillong', hours: 15.5, streak: 1 },
      { email: 'trainee6@velora.demo', first_name: 'Pooja', last_name: 'Bhatia', dept: 'Spectroscopy', desig: 'Scientific Assistant', loc: 'Delhi', hours: 55.0, streak: 8 },
      { email: 'trainee7@velora.demo', first_name: 'Vikash', last_name: 'Yadav', dept: 'Lab Instrumentation', desig: 'Systems Trainee', loc: 'Kolkata', hours: 10.0, streak: 2 },
      { email: 'trainee8@velora.demo', first_name: 'Divya', last_name: 'Menon', dept: 'Nanomaterials Division', desig: 'Research Associate', loc: 'Thiruvananthapuram', hours: 78.4, streak: 25 },
      { email: 'trainee9@velora.demo', first_name: 'Karan', last_name: 'Malhotra', dept: 'Materials Physics', desig: 'Technical Specialist', loc: 'Jaipur', hours: 41.0, streak: 7 },
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

    // 3. Insert Competencies (Materials Science Domain Blueprint)
    const competencyData = [
      { name: 'X-Ray Diffraction (XRD) Characterization', category: 'Materials Characterization', description: 'Phase identification, crystallite size calculation, lattice parameters, and Rietveld refinement using XRD patterns.', icon: 'Layers' },
      { name: 'Scanning Electron Microscopy (SEM) & EDS', category: 'Microscopy & Microanalysis', description: 'Surface morphology imaging, electron beam interaction, secondary/backscattered electrons, and elemental microanalysis via EDS.', icon: 'Search' },
      { name: 'Transmission Electron Microscopy (TEM)', category: 'High-Resolution Imaging', description: 'Atomic-scale imaging, selected area electron diffraction (SAED), bright-field/dark-field imaging, and defect analysis.', icon: 'Zap' },
      { name: 'Thermal Analysis (DSC / TGA / DTA)', category: 'Thermal Characterization', description: 'Differential Scanning Calorimetry, Thermogravimetric Analysis, phase transformations, glass transition, and thermal kinetics.', icon: 'Activity' },
      { name: 'Mechanical Testing & Metallography', category: 'Physical Metallurgy', description: 'Tensile testing, hardness testing (Vickers/Rockwell), impact testing, microstructural preparation, and grain size analysis.', icon: 'Shield' },
      { name: 'Spectroscopy & Surface Analysis', category: 'Analytical Chemistry', description: 'XPS, FTIR, UV-Vis spectroscopy, oxidation state identification, chemical bonding, and optical bandgap determination.', icon: 'BarChart' },
      { name: 'Laboratory Safety & Hazard Protocol', category: 'Laboratory Safety', description: 'Chemical safety, high-voltage beam operation, cryogenic liquid handling, hazardous waste disposal, and safety compliance.', icon: 'Shield' },
      { name: 'Scientific Data Reporting & Standards', category: 'Scientific Publishing', description: 'Technical documentation, scientific data archiving, lab notebook standards, publication preparation, and peer review.', icon: 'MessageSquare' },
      { name: 'Crystallography & Crystal Physics', category: 'Solid State Physics', description: 'Bravais lattices, Miller indices, crystal symmetry groups, point defects, and X-ray scattering fundamentals.', icon: 'Cpu' },
      { name: 'Materials Synthesis & Processing Tech', category: 'Process Engineering', description: 'Sol-gel synthesis, chemical vapor deposition (CVD), powder metallurgy, calcination, and sintering optimization.', icon: 'Database' }
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
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 92)`, [trainerIds[0], competencyIds[8]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 88)`, [trainerIds[0], competencyIds[5]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 90)`, [trainerIds[0], competencyIds[9]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 98)`, [trainerIds[1], competencyIds[2]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 95)`, [trainerIds[1], competencyIds[1]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 90)`, [trainerIds[1], competencyIds[0]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 98)`, [trainerIds[2], competencyIds[2]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 94)`, [trainerIds[2], competencyIds[4]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 91)`, [trainerIds[2], competencyIds[8]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 96)`, [trainerIds[3], competencyIds[3]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 97)`, [trainerIds[3], competencyIds[6]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 89)`, [trainerIds[3], competencyIds[5]]);

    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 98)`, [trainerIds[4], competencyIds[7]]);
    await db.run(`INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 92)`, [trainerIds[4], competencyIds[9]]);

    // 5. Map Trainee Competencies for Arjun Singh (Trainee 1)
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 78.0, 'intermediate', 65.0, datetime('now', '-10 days'))`, [traineeIds[0], competencyIds[0]]); // XRD
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 72.0, 'intermediate', 58.0, datetime('now', '-15 days'))`, [traineeIds[0], competencyIds[1]]); // SEM
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 48.0, 'developing', 45.0, datetime('now', '-5 days'))`, [traineeIds[0], competencyIds[2]]);   // TEM (GAP!)
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 52.0, 'developing', 50.0, datetime('now', '-7 days'))`, [traineeIds[0], competencyIds[3]]);   // Thermal (GAP!)
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 65.0, 'intermediate', 60.0, datetime('now', '-12 days'))`, [traineeIds[0], competencyIds[4]]); // Mechanical
    await db.run(`INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at) VALUES (?, ?, 85.0, 'advanced', 80.0, datetime('now', '-20 days'))`, [traineeIds[0], competencyIds[7]]);     // Scientific Reporting

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
    `, [traineeIds[0], competencyIds[2]]); // TEM

    await db.run(`
      INSERT INTO skill_gaps (user_id, competency_id, current_score, target_score, gap, status, identified_at)
      VALUES (?, ?, 52.0, 80.0, 28.0, 'active', datetime('now', '-7 days'))
    `, [traineeIds[0], competencyIds[3]]); // Thermal

    // 7. Insert Courses
    const coursesData = [
      {
        title: 'X-Ray Diffraction (XRD) Principles & Rietveld Refinement',
        short_description: 'Master powder XRD, phase identification, lattice parameter determination, and peak profile fitting for materials analysis.',
        description: 'Comprehensive course for materials scientists and laboratory technical staff. Learn X-ray physics, diffractometer alignment, Bragg law calculations, PDF database search-match, and quantitative phase analysis.',
        trainer_id: trainerIds[0],
        category: 'Materials Characterization',
        difficulty: 'intermediate',
        duration_hours: 24,
        status: 'published',
        max_students: 150,
        enrolled_count: 84,
        average_rating: 4.9,
        total_reviews: 42,
        is_free: 1,
        competencies: [competencyIds[0], competencyIds[8]]
      },
      {
        title: 'Transmission Electron Microscopy (TEM) & Microstructure Analysis',
        short_description: 'Master electron optics, bright-field/dark-field imaging, SAED pattern indexing, and nanoscale defect analysis.',
        description: 'Advanced characterization module focusing on TEM beam alignment, electron transparency preparation, crystal defect imaging (dislocations, stacking faults), and selected area electron diffraction.',
        trainer_id: trainerIds[2],
        category: 'High-Resolution Imaging',
        difficulty: 'beginner',
        duration_hours: 30,
        status: 'published',
        max_students: 200,
        enrolled_count: 112,
        average_rating: 4.8,
        total_reviews: 58,
        is_free: 1,
        competencies: [competencyIds[2], competencyIds[1]]
      },
      {
        title: 'Scanning Electron Microscopy & EDS Microanalysis',
        short_description: 'Surface morphology imaging, secondary/backscattered electron detection, and elemental mapping via EDS.',
        description: 'Practical training on SEM operation, vacuum systems, secondary electron topographic imaging, atomic-number contrast via backscattered electrons, and quantitative EDS spectrum processing.',
        trainer_id: trainerIds[1],
        category: 'Microscopy & Microanalysis',
        difficulty: 'intermediate',
        duration_hours: 36,
        status: 'published',
        max_students: 100,
        enrolled_count: 76,
        average_rating: 4.9,
        total_reviews: 35,
        is_free: 1,
        competencies: [competencyIds[1], competencyIds[0], competencyIds[5]]
      },
      {
        title: 'Thermal Analysis (DSC & TGA) for Advanced Materials',
        short_description: 'Differential Scanning Calorimetry, Thermogravimetric Analysis, phase transition thermodynamics, and degradation kinetics.',
        description: 'Curriculum covering thermal characterization instrumentation, baseline calibration, glass transition temperature determination, heat capacity measurement, and atmosphere-controlled thermogravimetry.',
        trainer_id: trainerIds[3],
        category: 'Thermal Characterization',
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
        title: 'Advanced Metallography & Mechanical Behavior of Materials',
        short_description: 'Tensile test stress-strain analysis, Vickers/Rockwell microhardness, microstructural etching, and fracture mechanics.',
        description: 'Physical metallurgy course focused on metallurgical sample mounting, polishing, chemical etching, optical metallography, yield strength determination, and creep-fatigue failure analysis.',
        trainer_id: trainerIds[1],
        category: 'Physical Metallurgy',
        difficulty: 'advanced',
        duration_hours: 40,
        status: 'published',
        max_students: 60,
        enrolled_count: 45,
        average_rating: 4.9,
        total_reviews: 21,
        is_free: 1,
        competencies: [competencyIds[4], competencyIds[2]]
      },
      {
        title: 'X-Ray Photoelectron & Optical Spectroscopy Methods',
        short_description: 'XPS chemical state analysis, FTIR vibrational modes, UV-Vis absorption, and bandgap energy determination.',
        description: 'Analytical chemistry module for surface spectroscopy, core-level binding energy binding shifts, oxidation state quantitative determination, and infrared absorption spectrum interpretation.',
        trainer_id: trainerIds[0],
        category: 'Analytical Chemistry',
        difficulty: 'intermediate',
        duration_hours: 22,
        status: 'published',
        max_students: 120,
        enrolled_count: 63,
        average_rating: 4.6,
        total_reviews: 18,
        is_free: 1,
        competencies: [competencyIds[5], competencyIds[0]]
      },
      {
        title: 'Laboratory Safety & High-Energy Equipment Protocols',
        short_description: 'High-voltage beam safety, X-ray radiation shielding, cryogenic liquid handling, and chemical hygiene protocols.',
        description: 'Essential safety training for research facilities. Covers radiation safety monitoring, high-vacuum systems, pressurized gas cylinder handling, and emergency response procedures.',
        trainer_id: trainerIds[2],
        category: 'Laboratory Safety',
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
        title: 'Chemical & High-Voltage Hazard Mitigation in Labs',
        short_description: 'Hazardous chemical waste disposal, fume hood ventilation standards, and high-voltage power supply isolation.',
        description: 'Comprehensive lab governance course addressing toxic solvent storage, MSDS safety data compliance, high-voltage interlocks for electron guns, and MoES laboratory audit standards.',
        trainer_id: trainerIds[3],
        category: 'Laboratory Safety',
        difficulty: 'intermediate',
        duration_hours: 25,
        status: 'published',
        max_students: 90,
        enrolled_count: 48,
        average_rating: 4.7,
        total_reviews: 22,
        is_free: 1,
        competencies: [competencyIds[6]]
      },
      {
        title: 'Scientific Data Reporting & Research Documentation',
        short_description: 'Technical report structuring, experimental uncertainty quantification, lab notebook standards, and publishing.',
        description: 'Training scientific staff in high-impact scientific writing, error analysis reporting, data archiving compliance, peer-review response preparation, and research ethics.',
        trainer_id: trainerIds[4],
        category: 'Scientific Publishing',
        difficulty: 'beginner',
        duration_hours: 15,
        status: 'published',
        max_students: 200,
        enrolled_count: 140,
        average_rating: 4.9,
        total_reviews: 65,
        is_free: 1,
        competencies: [competencyIds[7]]
      },
      {
        title: 'Advanced Materials Synthesis & Nanomaterial Processing',
        short_description: 'Sol-gel chemical synthesis, chemical vapor deposition (CVD), powder metallurgy, and calcination control.',
        description: 'Synthesis technology course covering phase diagram interpretation, solid-state reaction kinetics, high-temperature furnace sintering, and controlled atmosphere processing.',
        trainer_id: trainerIds[4],
        category: 'Process Engineering',
        difficulty: 'beginner',
        duration_hours: 28,
        status: 'published',
        max_students: 120,
        enrolled_count: 88,
        average_rating: 4.8,
        total_reviews: 39,
        is_free: 1,
        competencies: [competencyIds[9], competencyIds[0]]
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
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 1: XRD Fundamentals & Lattice Geometry', 'Basic diffractometer setup, Bragg law, lattice spacing, and beam geometry.', 1, 120)`, [courseIds[0]]);
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 2: Phase Identification & PDF Database', 'Search-match analysis using JCPDS/ICDD Powder Diffraction File records.', 2, 180)`, [courseIds[0]]);
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 3: Profile Fitting & Scherrer Analysis', 'Peak broadening analysis, crystallite size extraction, and microstrain calculation.', 3, 150)`, [courseIds[0]]);

    const m1 = await db.get('SELECT id FROM course_modules WHERE course_id = ? AND order_index = 1', [courseIds[0]]);
    const m2 = await db.get('SELECT id FROM course_modules WHERE course_id = ? AND order_index = 2', [courseIds[0]]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'Introduction to X-Ray Diffraction & Bragg Law', 'Overview of characteristic X-rays, Bragg diffraction condition nλ = 2d sinθ, and crystal planes.', 'reading', 'X-Ray Diffraction is a non-destructive analytical technique used to determine crystallographic structure and chemical phase of materials. In this lesson, we study Bragg Law physics and d-spacing equations for cubic and lower symmetry lattices.', 30, 1)
    `, [m1.id]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_url, content_text, duration_minutes, order_index)
      VALUES (?, 'Diffractometer Components, Slits & X-Ray Tube Operation', 'Bragg-Brentano geometry, divergence slits, monochromators, and detector types.', 'video', 'https://www.youtube.com/embed/rfscVS0vtbw', 'Mastering optical alignment in a Bragg-Brentano diffractometer is critical for acquiring accurate peak positions and minimizing displacement errors.', 45, 2)
    `, [m1.id]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'Phase Identification & Powder Diffraction File Indexing', 'Search-match algorithms, ICDD database lookup, and multi-phase mixture identification.', 'reading', 'Phase identification relies on matching observed 2θ angles and relative peak intensities against standard PDF card databases. We demonstrate multi-phase phase fraction analysis.', 45, 3)
    `, [m1.id]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'Crystallite Size & Microstrain Calculation via Scherrer Equation', 'Instrumental peak broadening correction, FWHM determination, and Williamson-Hall plots.', 'reading', 'Peak broadening in XRD patterns arises from finite crystallite size and lattice microstrain. The Scherrer equation D = Kλ/(β cosθ) quantifies domain sizes below 100 nm.', 60, 1)
    `, [m2.id]);

    const l1 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Introduction to X-Ray%']);
    const l2 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Diffractometer Components%']);
    const l3 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Phase Identification%']);
    const l4 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Crystallite Size%']);

    console.log('Fetched lessons:', { l1, l2, l3, l4 });

    // Course 2 (TEM) modules & lessons
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 1: Electron Optics & TEM Principles', 'Electron guns, electromagnetic lenses, aberration correction, and sample thinning.', 1, 150)`, [courseIds[1]]);
    await db.run(`INSERT INTO course_modules (course_id, title, description, order_index, duration_minutes) VALUES (?, 'Module 2: Diffraction & High-Resolution Imaging', 'SAED pattern indexing, bright-field vs dark-field contrast, and lattice imaging.', 2, 210)`, [courseIds[1]]);

    const c2m1 = await db.get('SELECT id FROM course_modules WHERE course_id = ? AND order_index = 1', [courseIds[1]]);

    await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_text, duration_minutes, order_index)
      VALUES (?, 'Transmission Electron Microscopy Principles', 'Understanding electron wavelength, specimen transparency requirements, and lens aberrations.', 'reading', 'TEM operates by transmitting high-energy electrons (100-300 kV) through an ultrathin specimen (<100 nm). Image contrast depends on mass-thickness, diffraction contrast, and phase contrast.', 45, 1)
    `, [c2m1.id]);

    const c2l1 = await db.get('SELECT id FROM lessons WHERE title LIKE ?', ['%Transmission Electron Microscopy Principles%']);

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
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-18 days'), 'Mastered Bragg Law and d-spacing calculations.', 35)`, [traineeIds[0], l1.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-15 days'), 'Bragg-Brentano geometry minimizes displacement errors.', 50)`, [traineeIds[0], l2.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-10 days'), 'PDF card matching is crucial for multi-phase samples.', 45)`, [traineeIds[0], l3.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-8 days'), 'Scherrer formula applies to crystallite size < 100 nm.', 65)`, [traineeIds[0], l4.id]);
    await db.run(`INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes) VALUES (?, ?, 1, datetime('now', '-4 days'), 'TEM specimens must be under 100 nm thick for electron transparency.', 45)`, [traineeIds[0], c2l1.id]);

    // 10. Assessments & Questions (Materials Science Domain)
    await db.run(`
      INSERT INTO assessments (title, description, course_id, duration_minutes, passing_score, total_marks, is_baseline, status, created_by)
      VALUES ('MoES Baseline Competency Evaluation 2026', 'Comprehensive diagnostic baseline assessment covering materials characterization, TEM imaging, thermal analysis, and diffraction methods.', NULL, 45, 60, 100, 1, 'published', ?)
    `, [adminId]);

    await db.run(`
      INSERT INTO assessments (title, description, course_id, duration_minutes, passing_score, total_marks, is_baseline, status, created_by)
      VALUES ('Transmission Electron Microscopy (TEM) Knowledge Check', 'Evaluate your knowledge of electron optics, SAED pattern indexing, sample prep, and image contrast.', ?, 30, 60, 20, 0, 'published', ?)
    `, [courseIds[1], trainerIds[2]]);

    const aBase = await db.get('SELECT id FROM assessments WHERE is_baseline = 1');
    const aDS = await db.get('SELECT id FROM assessments WHERE course_id = ?', [courseIds[1]]);

    const questionsList = [
      {
        assessment_id: aBase.id,
        question_text: 'In Transmission Electron Microscopy (TEM), which phenomenon primarily enables atomic-resolution lattice image contrast in thin crystalline samples?',
        options: JSON.stringify(['Coherent Bragg Scattering and Phase Contrast', 'Secondary Electron Emission', 'Thermal Ionization', 'X-Ray Fluorescence']),
        correct_answer: 'Coherent Bragg Scattering and Phase Contrast',
        marks: 5,
        competency_id: competencyIds[2],
        explanation: 'TEM phase contrast relies on coherent Bragg scattering of high-energy electrons passing through ultrathin specimen sections.'
      },
      {
        assessment_id: aBase.id,
        question_text: 'What does Bragg Law (nλ = 2d sinθ) calculate in X-Ray Diffraction (XRD) analysis?',
        options: JSON.stringify(['Interplanar spacing (d) of crystal lattice planes', 'Sample mass density', 'Thermal expansion coefficient', 'Electron kinetic energy']),
        correct_answer: 'Interplanar spacing (d) of crystal lattice planes',
        marks: 5,
        competency_id: competencyIds[0],
        explanation: 'Bragg Law relates diffraction angle θ and X-ray wavelength λ to the interplanar spacing d of crystal planes.'
      },
      {
        assessment_id: aBase.id,
        question_text: 'In Differential Scanning Calorimetry (DSC), an endothermic heat flow peak during heating typically signifies:',
        options: JSON.stringify(['Melting or endothermic phase transformation', 'Exothermic crystallization', 'Oxidation reaction', 'Sample decomposition under oxygen']),
        correct_answer: 'Melting or endothermic phase transformation',
        marks: 5,
        competency_id: competencyIds[3],
        explanation: 'Endothermic processes absorb thermal energy from the furnace, producing a characteristic heat capacity peak during melting or phase changes.'
      },
      {
        assessment_id: aBase.id,
        question_text: 'Which signal in a Scanning Electron Microscope (SEM) provides surface topographic detail with the highest spatial resolution?',
        options: JSON.stringify(['Secondary Electrons (SE)', 'Backscattered Electrons (BSE)', 'Characteristic X-Rays', 'Auger Electrons']),
        correct_answer: 'Secondary Electrons (SE)',
        marks: 5,
        competency_id: competencyIds[1],
        explanation: 'Low-energy secondary electrons originate within a few nanometers of the sample surface, producing high-resolution topographical contrast.'
      },
      {
        assessment_id: aBase.id,
        question_text: 'Which hardness testing method utilizes a square-based diamond pyramid indenter with a 136-degree face angle?',
        options: JSON.stringify(['Vickers Hardness Test', 'Rockwell B Test', 'Mohs Hardness Scale', 'Shore Durometer Test']),
        correct_answer: 'Vickers Hardness Test',
        marks: 5,
        competency_id: competencyIds[4],
        explanation: 'The Vickers microhardness test uses a 136-degree diamond pyramid indenter suitable for thin metallic and ceramic microstructures.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'What sample thickness requirement is essential for high-resolution Transmission Electron Microscopy (HR-TEM)?',
        options: JSON.stringify(['Less than 100 nanometers', 'Greater than 1 millimeter', '5 to 10 micrometers', '1 centimeter']),
        correct_answer: 'Less than 100 nanometers',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'Specimens must be electron-transparent, typically under 100 nm (or <50 nm for atomic HR-TEM).'
      },
      {
        assessment_id: aDS.id,
        question_text: 'Selected Area Electron Diffraction (SAED) in a TEM is primarily used to determine:',
        options: JSON.stringify(['Crystal symmetry and structure of localized specimen areas', 'Elemental chemical composition percentage', 'Surface roughness profile', 'Sample magnetic susceptibility']),
        correct_answer: 'Crystal symmetry and structure of localized specimen areas',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'SAED uses a field-limiting aperture to obtain diffraction spot patterns from micro- and nano-sized crystal domains.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'In Focused Ion Beam (FIB) milling for TEM specimen preparation, which ion species is most commonly utilized?',
        options: JSON.stringify(['Gallium (Ga+)', 'Argon (Ar+)', 'Helium (He+)', 'Xenon (Xe+)']),
        correct_answer: 'Gallium (Ga+)',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'Gallium Liquid Metal Ion Sources (LMIS) provide precise, high-density ion beams for site-specific TEM cross-section extraction.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'What type of TEM image contrast is formed by excluding diffracted beams using an objective aperture?',
        options: JSON.stringify(['Bright-Field Contrast', 'Dark-Field Contrast', 'High-Angle Annular Dark-Field', 'Phase Contrast']),
        correct_answer: 'Bright-Field Contrast',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'Bright-field imaging selects only the unscattered electron beam, causing strongly diffracting or dense crystal regions to appear dark.'
      },
      {
        assessment_id: aDS.id,
        question_text: 'What is the primary cause of spherical aberration (Cs) in electromagnetic electron lenses?',
        options: JSON.stringify(['Off-axis peripheral rays bending more strongly than axial rays', 'Electron beam thermal energy spread', 'Specimen surface charging', 'Column vacuum fluctuations']),
        correct_answer: 'Off-axis peripheral rays bending more strongly than axial rays',
        marks: 4,
        competency_id: competencyIds[2],
        explanation: 'Spherical aberration occurs because magnetic lens field strength increases with radial displacement from the optical axis.'
      }
    ];

    for (let idx = 0; idx < questionsList.length; idx++) {
      const q = questionsList[idx];
      await db.run(`
        INSERT INTO questions (assessment_id, question_text, question_type, options, correct_answer, marks, competency_id, explanation, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [q.assessment_id, q.question_text, q.question_type || 'mcq', q.options, q.correct_answer, q.marks, q.competency_id, q.explanation, idx + 1]);
    }

    // 11. Recommendations for Arjun Singh (Materials Science Domain)
    await db.run(`
      INSERT INTO course_recommendations (user_id, course_id, match_score, reason)
      VALUES (?, ?, 96.0, 'Identified skill gap in Transmission Electron Microscopy (TEM) (48% score). Enrolling in this course directly targets your primary growth area.')
    `, [traineeIds[0], courseIds[1]]);

    await db.run(`
      INSERT INTO course_recommendations (user_id, course_id, match_score, reason)
      VALUES (?, ?, 91.0, 'Identified skill gap in Thermal Analysis (DSC/TGA) (52% score). Recommended for material characterization proficiency.')
    `, [traineeIds[0], courseIds[3]]);

    await db.run(`
      INSERT INTO trainer_recommendations (user_id, trainer_id, match_score, reason)
      VALUES (?, ?, 95.0, 'Prof. Amit Kumar holds 98% proficiency in TEM & Microstructure Analysis, matching your top skill gap.')
    `, [traineeIds[0], trainerIds[2]]);

    await db.run(`
      INSERT INTO trainer_recommendations (user_id, trainer_id, match_score, reason)
      VALUES (?, ?, 92.0, 'Dr. Sneha Reddy holds 97% proficiency in Thermal Characterization and DSC/TGA analysis.')
    `, [traineeIds[0], trainerIds[3]]);

    // 12. Live Classes
    await db.run(`
      INSERT INTO live_classes (course_id, trainer_id, title, description, scheduled_at, end_time, status, max_participants, meeting_type)
      VALUES (?, ?, 'Advanced XRD Rietveld Refinement & Profile Fitting', 'Live practical session detailing background subtraction, instrument broadening, and lattice strain extraction.', datetime('now', '-30 minutes'), datetime('now', '+60 minutes'), 'live', 50, 'virtual')
    `, [courseIds[0], trainerIds[0]]);

    await db.run(`
      INSERT INTO live_classes (course_id, trainer_id, title, description, scheduled_at, end_time, status, max_participants, meeting_type)
      VALUES (?, ?, 'TEM Microstructure Masterclass: SAED Pattern Indexing', 'Interactive workshop on selected area electron diffraction spot patterns and lattice plane indexing.', datetime('now', '+1 day'), datetime('now', '+1 day', '+90 minutes'), 'scheduled', 100, 'virtual')
    `, [courseIds[1], trainerIds[2]]);

    const classLive = await db.get('SELECT id FROM live_classes WHERE status = "live"');

    await db.run(`INSERT INTO class_messages (class_id, user_id, message) VALUES (?, ?, 'Welcome everyone to today live session on X-Ray Diffraction Rietveld Refinement!')`, [classLive.id, trainerIds[0]]);
    await db.run(`INSERT INTO class_messages (class_id, user_id, message) VALUES (?, ?, 'Good morning Dr. Sharma! Excited to learn about profile fitting.')`, [classLive.id, traineeIds[0]]);
    await db.run(`INSERT INTO class_messages (class_id, user_id, message) VALUES (?, ?, 'Will we cover asymmetric peak broadening models today?')`, [classLive.id, traineeIds[1]]);

    await db.run(`
      INSERT INTO polls (class_id, question, options, created_by, status)
      VALUES (?, 'What does Bragg Law (nλ = 2d sinθ) primarily calculate?', '["Sample Mass","Lattice Spacing (d)","Grain Count","Melting Point"]', ?, 'active')
    `, [classLive.id, trainerIds[0]]);

    const poll1 = await db.get('SELECT id FROM polls WHERE class_id = ?', [classLive.id]);

    await db.run(`INSERT INTO poll_responses (poll_id, user_id, selected_option) VALUES (?, ?, 1)`, [poll1.id, traineeIds[0]]);
    await db.run(`INSERT INTO poll_responses (poll_id, user_id, selected_option) VALUES (?, ?, 1)`, [poll1.id, traineeIds[1]]);
    await db.run(`INSERT INTO poll_responses (poll_id, user_id, selected_option) VALUES (?, ?, 0)`, [poll1.id, traineeIds[2]]);

    // 13. Assignments & Submissions
    await db.run(`
      INSERT INTO assignments (course_id, title, description, instructions, deadline, max_score, created_by)
      VALUES (?, 'Assignment 1: TEM Micrograph Indexing & Lattice Spacing Report', 'Calculate lattice interplanar spacing d from given SAED spot pattern measurements.', 'Submit a PDF report detailing d-spacing calculations, zone axis indexing, and error analysis.', datetime('now', '+5 days'), 100, ?)
    `, [courseIds[1], trainerIds[2]]);

    const assign1 = await db.get('SELECT id FROM assignments WHERE course_id = ?', [courseIds[1]]);

    await db.run(`
      INSERT INTO submissions (assignment_id, user_id, submission_text, score, feedback, status, submitted_at, graded_at)
      VALUES (?, ?, 'TEM SAED Indexing Report:\n1. Camera constant Lλ = 2.45 mm·nm\n2. Measured ring radius R1 = 12.3 mm -> d1 = 0.199 nm (200 plane)\n3. Zone axis [011] confirmed.', 95, 'Excellent report Arjun! Accurately indexed the cubic lattice reflections.', 'graded', datetime('now', '-2 days'), datetime('now', '-1 day'))
    `, [assign1.id, traineeIds[0]]);

    // 14. Certificate for Arjun Singh
    const certId = 'VELORA-2026-98421';
    await db.run(`
      INSERT INTO certificates (user_id, course_id, certificate_id, trainer_name, course_title, trainee_name, issued_at)
      VALUES (?, ?, ?, 'Prof. Kavita Nair', 'Advanced Materials Synthesis & Nanomaterial Processing', 'Arjun Singh', datetime('now', '-5 days'))
    `, [traineeIds[0], courseIds[9], certId]);

    // 15. Notifications for Arjun Singh
    const notifs = [
      { title: 'New Recommendation Available', desc: 'Based on your recent assessment, "Transmission Electron Microscopy (TEM)" was recommended for you.', type: 'recommendation', link: '/recommendations' },
      { title: 'Live Class Started!', desc: 'Dr. Rahul Sharma has started "Advanced XRD Rietveld Refinement". Click to join now.', type: 'class', link: '/live-class/' + classLive.id },
      { title: 'Certificate Issued! 🎓', desc: 'Congratulations! Your official VELORA certificate for Materials Synthesis is now available.', type: 'certificate', link: '/certificates' },
      { title: 'Skill Gap Identified', desc: 'Your Transmission Electron Microscopy (TEM) score is currently 48%. Target level is 80%.', type: 'system', link: '/skill-gaps' },
      { title: 'Assignment Graded', desc: 'Your submission for TEM Micrograph Indexing scored 95/100.', type: 'course', link: '/my-learning' }
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
      VALUES ('Welcome to VELORA Capacity Connect Portal', 'Official launch of the Ministry of Earth Sciences (MoES) materials science & technical capacity building platform.', 'all', 'high', ?)
    `, [adminId]);

    await db.run(`
      INSERT INTO announcements (title, description, audience, priority, created_by)
      VALUES ('Annual Materials Science Competency Drive 2026', 'All technical staff and scientific research assistants are requested to complete their baseline competency assessment by the end of the month.', 'trainees', 'normal', ?)
    `, [adminId]);

    // 17. Messages
    await db.run(`
      INSERT INTO messages (sender_id, receiver_id, content, read)
      VALUES (?, ?, 'Hello Dr. Sharma! I had a quick question regarding instrumental peak broadening in XRD Scherrer calculations.', 1)
    `, [traineeIds[0], trainerIds[0]]);

    await db.run(`
      INSERT INTO messages (sender_id, receiver_id, content, read)
      VALUES (?, ?, 'Hi Arjun! You should subtract the instrumental broadening in quadrature: beta_sample^2 = beta_measured^2 - beta_instrumental^2.', 1)
    `, [trainerIds[0], traineeIds[0]]);

    // 18. Notes
    await db.run(`
      INSERT INTO notes (user_id, lesson_id, course_id, content)
      VALUES (?, ?, ?, 'Remember: TEM specimens must be under 100 nm thick for electron transparency. Critical for atomic HR-TEM lattice imaging.')
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
