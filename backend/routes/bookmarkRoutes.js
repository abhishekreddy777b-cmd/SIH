const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/bookmarks - User bookmarks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const bookmarkedCourses = await db.all(`
      SELECT b.id as bookmark_id, b.created_at as bookmarked_at,
             c.*, u.first_name as trainer_first_name, u.last_name as trainer_last_name
      FROM bookmarks b
      JOIN courses c ON b.item_id = c.id AND b.item_type = 'course'
      LEFT JOIN users u ON c.trainer_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({ success: true, count: bookmarkedCourses.length, bookmarks: bookmarkedCourses });
  } catch (err) {
    console.error('Fetch bookmarks error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/bookmarks/toggle - Toggle bookmark
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_type = 'course', item_id } = req.body;

    if (!item_id) {
      return res.status(400).json({ success: false, message: 'Item ID is required.' });
    }

    const existing = await db.get('SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?', [userId, item_type, item_id]);

    if (existing) {
      await db.run('DELETE FROM bookmarks WHERE id = ?', [existing.id]);
      res.json({ success: true, is_bookmarked: false, message: 'Bookmark removed.' });
    } else {
      await db.run('INSERT INTO bookmarks (user_id, item_type, item_id) VALUES (?, ?, ?)', [userId, item_type, item_id]);
      res.json({ success: true, is_bookmarked: true, message: 'Bookmarked successfully.' });
    }
  } catch (err) {
    console.error('Toggle bookmark error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
