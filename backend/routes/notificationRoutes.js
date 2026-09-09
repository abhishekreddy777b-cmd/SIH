const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications - User notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await db.all(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30
    `, [req.user.id]);

    const unreadCount = await db.get(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
    `, [req.user.id]);

    res.json({
      success: true,
      unread_count: unreadCount ? unreadCount.count : 0,
      notifications
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/notifications/:id/read - Mark one read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/notifications/read-all - Mark all read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.run('UPDATE notifications SET read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Read all notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
