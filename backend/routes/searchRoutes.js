const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/search?q=... - Global platform search
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({ success: true, results: { courses: [], trainers: [], competencies: [], assessments: [] } });
    }

    const pattern = `%${query.trim()}%`;

    const courses = await db.all(`
      SELECT id, title, short_description, category, difficulty, duration_hours, average_rating
      FROM courses
      WHERE status = 'published' AND (title LIKE ? OR short_description LIKE ? OR category LIKE ?)
      LIMIT 6
    `, [pattern, pattern, pattern]);

    const trainers = await db.all(`
      SELECT u.id, u.first_name, u.last_name, u.avatar, u.department, u.designation, tp.qualifications, tp.average_rating
      FROM users u
      JOIN trainer_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'trainer' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.department LIKE ?)
      LIMIT 6
    `, [pattern, pattern, pattern]);

    const competencies = await db.all(`
      SELECT id, name, category, description, icon
      FROM competencies
      WHERE name LIKE ? OR category LIKE ? OR description LIKE ?
      LIMIT 6
    `, [pattern, pattern, pattern]);

    const assessments = await db.all(`
      SELECT id, title, description, duration_minutes, passing_score
      FROM assessments
      WHERE status = 'published' AND (title LIKE ? OR description LIKE ?)
      LIMIT 6
    `, [pattern, pattern]);

    res.json({
      success: true,
      query: query.trim(),
      results: {
        courses,
        trainers,
        competencies,
        assessments
      }
    });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ success: false, message: 'Server error during search.' });
  }
});

module.exports = router;
