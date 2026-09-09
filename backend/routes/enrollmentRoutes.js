const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/enrollments/me - User enrolled courses
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await db.all(`
      SELECT e.id as enrollment_id, e.status as enrollment_status, e.progress, e.enrolled_at, e.completed_at,
             c.id as course_id, c.title, c.short_description, c.thumbnail, c.category, c.difficulty, c.duration_hours,
             u.first_name as trainer_first_name, u.last_name as trainer_last_name,
             cert.certificate_id
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.trainer_id = u.id
      LEFT JOIN certificates cert ON cert.user_id = e.user_id AND cert.course_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `, [userId]);

    // Aliases expected by the React pages
    const shaped = enrollments.map(e => {
      const trainerName = `${e.trainer_first_name || ''} ${e.trainer_last_name || ''}`.trim() || null;
      return {
        ...e,
        id: e.enrollment_id,
        course_title: e.title,
        progress_percentage: e.progress,
        trainer_name: trainerName,
        // keep consistency with older UI expectations
        status: e.enrollment_status
      };
    });

    res.json({ success: true, count: shaped.length, enrollments: shaped });
  } catch (err) {
    console.error('Fetch enrollments error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching enrollments.' });
  }
});

// POST /api/enrollments/:courseId - Enroll in a course
router.post('/:courseId', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const existing = await db.get('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course.' });
    }

    await db.run(`
      INSERT INTO enrollments (user_id, course_id, status, progress, enrolled_at)
      VALUES (?, ?, 'active', 0.0, CURRENT_TIMESTAMP)
    `, [userId, courseId]);

    // Update course enrolled count
    await db.run('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?', [courseId]);

    res.status(201).json({ success: true, message: `Enrolled in "${course.title}" successfully!` });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ success: false, message: 'Server error enrolling in course.' });
  }
});

module.exports = router;
