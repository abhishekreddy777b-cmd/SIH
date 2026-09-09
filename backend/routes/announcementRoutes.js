const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/announcements - Fetch announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await db.all(`
      SELECT a.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY CASE WHEN a.priority = 'high' THEN 1 ELSE 2 END, a.published_at DESC
    `);

    res.json({ success: true, count: announcements.length, announcements });
  } catch (err) {
    console.error('Fetch announcements error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/announcements - Admin Create Announcement
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { title, description, content, audience = 'all', priority = 'normal' } = req.body;
    const message = description || content;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const result = await db.run(`
      INSERT INTO announcements (title, description, audience, priority, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [title, message, audience, priority, req.user.id]);

    const newAnn = await db.get('SELECT * FROM announcements WHERE id = ?', [result.id]);

    res.status(201).json({ success: true, message: 'Announcement published.', announcement: newAnn });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
