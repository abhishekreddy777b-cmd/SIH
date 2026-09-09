const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// GET /api/courses - List and filter courses
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, difficulty, search, status = 'published' } = req.query;
    let sql = `
      SELECT c.*,
             u.first_name as trainer_first_name, u.last_name as trainer_last_name, u.avatar as trainer_avatar
      FROM courses c
      LEFT JOIN users u ON c.trainer_id = u.id
      WHERE c.status = ?
    `;
    const params = [status];

    if (category) {
      sql += ` AND c.category = ?`;
      params.push(category);
    }
    if (difficulty) {
      sql += ` AND c.difficulty = ?`;
      params.push(difficulty);
    }
    if (search) {
      sql += ` AND (c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const courses = await db.all(sql, params);

    // Attach competencies to each course
    for (const course of courses) {
      const competencies = await db.all(`
        SELECT comp.id, comp.name, comp.category, comp.icon
        FROM course_competencies cc
        JOIN competencies comp ON cc.competency_id = comp.id
        WHERE cc.course_id = ?
      `, [course.id]);
      course.competencies = competencies;

      if (req.user) {
        const enrollment = await db.get(`
          SELECT status, progress FROM enrollments WHERE user_id = ? AND course_id = ?
        `, [req.user.id, course.id]);
        course.user_enrollment = enrollment || null;
      }
    }

    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    console.error('Fetch courses error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching courses.' });
  }
});

// GET /api/courses/trainer/my-courses - Trainer created courses
router.get('/trainer/my-courses', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const courses = await db.all(`
      SELECT c.*,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as real_enrolled_count
      FROM courses c
      WHERE c.trainer_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    console.error('Fetch trainer courses error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/courses/:id - Course detail view with modules & lessons
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await db.get(`
      SELECT c.*,
             u.id as trainer_id, u.first_name as trainer_first_name, u.last_name as trainer_last_name, u.avatar as trainer_avatar, u.department as trainer_department, u.bio as trainer_bio,
             tp.qualifications as trainer_qualifications, tp.average_rating as trainer_rating
      FROM courses c
      LEFT JOIN users u ON c.trainer_id = u.id
      LEFT JOIN trainer_profiles tp ON u.id = tp.user_id
      WHERE c.id = ?
    `, [courseId]);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Fetch competencies
    const competencies = await db.all(`
      SELECT comp.id, comp.name, comp.category, comp.icon
      FROM course_competencies cc
      JOIN competencies comp ON cc.competency_id = comp.id
      WHERE cc.course_id = ?
    `, [courseId]);

    // Fetch modules
    const modules = await db.all(`
      SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC
    `, [courseId]);

    // Fetch lessons for each module
    for (const mod of modules) {
      const lessons = await db.all(`
        SELECT id, module_id, title, description, content_type, content_url, duration_minutes, order_index
        FROM lessons
        WHERE module_id = ?
        ORDER BY order_index ASC
      `, [mod.id]);

      if (req.user) {
        for (const l of lessons) {
          const prog = await db.get(`
            SELECT completed, notes, time_spent_minutes FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
          `, [req.user.id, l.id]);
          l.user_progress = prog || { completed: 0, notes: '', time_spent_minutes: 0 };
        }
      }

      mod.lessons = lessons;
    }

    course.competencies = competencies;
    course.modules = modules;

    if (req.user) {
      const enrollment = await db.get(`
        SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?
      `, [req.user.id, courseId]);
      course.user_enrollment = enrollment || null;
    }

    res.json({ success: true, course });
  } catch (err) {
    console.error('Fetch course detail error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching course details.' });
  }
});

// POST /api/courses - Trainer/Admin Create Course
router.post('/', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const { title, short_description, description, category, difficulty, duration_hours, max_students, competencies, is_free } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required.' });
    }

    const result = await db.run(`
      INSERT INTO courses (title, short_description, description, trainer_id, category, difficulty, duration_hours, status, max_students, is_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
    `, [title, short_description || '', description || '', req.user.id, category, difficulty || 'beginner', duration_hours || 10, max_students || 100, is_free !== undefined ? is_free : 1]);

    const courseId = result.id;

    if (Array.isArray(competencies)) {
      for (const compId of competencies) {
        await db.run(`INSERT INTO course_competencies (course_id, competency_id) VALUES (?, ?)`, [courseId, compId]);
      }
    }

    // Create default Module 1
    await db.run(`
      INSERT INTO course_modules (course_id, title, description, order_index)
      VALUES (?, 'Module 1: Introduction & Foundations', 'Getting started with fundamental concepts.', 1)
    `, [courseId]);

    const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);

    res.status(201).json({ success: true, message: 'Course created successfully.', course });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ success: false, message: 'Server error creating course.' });
  }
});

module.exports = router;
