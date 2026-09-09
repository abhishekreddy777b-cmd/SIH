const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/users/trainers - Get all public trainers
router.get('/trainers', async (req, res) => {
  try {
    const trainers = await db.all(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.avatar, u.department, u.designation, u.location, u.bio,
             tp.qualifications, tp.experience_years, tp.students_trained, tp.average_rating, tp.total_reviews
      FROM users u
      JOIN trainer_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'trainer' AND u.status = 'active'
    `);

    // Attach competencies taught by each trainer
    for (const t of trainers) {
      const competencies = await db.all(`
        SELECT c.id, c.name, c.category, c.icon, tc.proficiency_level
        FROM trainer_competencies tc
        JOIN competencies c ON tc.competency_id = c.id
        WHERE tc.trainer_id = ?
      `, [t.id]);

      const coursesCount = await db.get(`
        SELECT COUNT(*) as count FROM courses WHERE trainer_id = ? AND status = 'published'
      `, [t.id]);

      t.competencies = competencies;
      t.courses_count = coursesCount ? coursesCount.count : 0;
    }

    res.json({ success: true, count: trainers.length, trainers });
  } catch (err) {
    console.error('Fetch trainers error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching trainers.' });
  }
});

// GET /api/users/trainers/:id - Single trainer profile with courses
router.get('/trainers/:id', async (req, res) => {
  try {
    const trainer = await db.get(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.avatar, u.department, u.designation, u.location, u.bio,
             tp.qualifications, tp.experience_years, tp.students_trained, tp.average_rating, tp.total_reviews
      FROM users u
      JOIN trainer_profiles tp ON u.id = tp.user_id
      WHERE u.id = ? AND u.role = 'trainer'
    `, [req.params.id]);

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    const competencies = await db.all(`
      SELECT c.id, c.name, c.category, c.icon, tc.proficiency_level
      FROM trainer_competencies tc
      JOIN competencies c ON tc.competency_id = c.id
      WHERE tc.trainer_id = ?
    `, [trainer.id]);

    const courses = await db.all(`
      SELECT id, title, short_description, thumbnail, category, difficulty, duration_hours, average_rating, total_reviews, enrolled_count
      FROM courses
      WHERE trainer_id = ? AND status = 'published'
    `, [trainer.id]);

    trainer.competencies = competencies;
    trainer.courses = courses;

    res.json({ success: true, trainer });
  } catch (err) {
    console.error('Trainer detail error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/users - Admin list all users
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let sql = `SELECT id, email, role, first_name, last_name, department, designation, location, status, created_at FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    if (search) {
      sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR department LIKE ?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    sql += ` ORDER BY created_at DESC`;

    const users = await db.all(sql, params);
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Server error listing users.' });
  }
});

// PUT /api/users/:id/status - Toggle active/deactive status
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or inactive.' });
    }

    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `User status updated to ${status}.` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
