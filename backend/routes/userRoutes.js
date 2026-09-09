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
    const { role, search, status } = req.query;
    let sql = `SELECT id, email, role, first_name, last_name, department, designation, location, status, created_at FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
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

// GET /api/users/:id/moderation-history - Fetch moderation audit trail for a user
router.get('/:id/moderation-history', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const history = await db.all(`
      SELECT h.id, h.user_id, h.old_status, h.new_status, h.reason, h.created_at,
             u.first_name AS changed_by_first_name,
             u.last_name AS changed_by_last_name,
             u.email AS changed_by_email
      FROM user_moderation_history h
      LEFT JOIN users u ON u.id = h.changed_by
      WHERE h.user_id = ?
      ORDER BY h.created_at DESC
    `, [req.params.id]);

    res.json({ success: true, history });
  } catch (err) {
    console.error('Fetch moderation history error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching moderation history.' });
  }
});

// PUT /api/users/:id/status - Update moderation status
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const allowedStatuses = ['active', 'inactive', 'suspended', 'flagged'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be one of active, inactive, suspended, or flagged.' });
    }

    const existingUser = await db.get('SELECT id, status FROM users WHERE id = ?', [req.params.id]);

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const oldStatus = existingUser.status || 'active';

    if (oldStatus !== status) {
      await db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
      await db.run(`
        INSERT INTO user_moderation_history (user_id, changed_by, old_status, new_status, reason)
        VALUES (?, ?, ?, ?, ?)
      `, [req.params.id, req.user.id, oldStatus, status, reason || 'Administrative moderation update']);
    }

    res.json({
      success: true,
      message: `User status updated to ${status}.`,
      history: {
        user_id: Number(req.params.id),
        old_status: oldStatus,
        new_status: status,
        reason: reason || 'Administrative moderation update'
      }
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
