const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/messages/contacts - Users the current user can message
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    let contacts;
    if (req.user.role === 'trainer') {
      contacts = await db.all(`
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.role, u.avatar, u.department, u.designation
        FROM users u
        JOIN enrollments e ON e.user_id = u.id
        JOIN courses c ON c.id = e.course_id
        WHERE c.trainer_id = ? AND u.role = 'trainee' AND u.status = 'active'
        ORDER BY u.first_name, u.last_name
      `, [req.user.id]);
    } else if (req.user.role === 'trainee') {
      contacts = await db.all(`
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.role, u.avatar, u.department, u.designation
        FROM users u
        JOIN courses c ON c.trainer_id = u.id
        JOIN enrollments e ON e.course_id = c.id
        WHERE e.user_id = ? AND u.role = 'trainer' AND u.status = 'active'
        ORDER BY u.first_name, u.last_name
      `, [req.user.id]);
    } else {
      contacts = await db.all(`
        SELECT id, first_name, last_name, role, avatar, department, designation
        FROM users
        WHERE id != ? AND status = 'active'
        ORDER BY first_name, last_name
      `, [req.user.id]);
    }

    res.json({ success: true, count: contacts.length, contacts });
  } catch (err) {
    console.error('Fetch message contacts error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/messages/conversations - User message conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await db.all(`
      SELECT DISTINCT
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `, [userId, userId, userId]);

    const results = [];
    for (const conv of conversations) {
      const otherUser = await db.get(`
        SELECT id, first_name, last_name, role, avatar, department, designation FROM users WHERE id = ?
      `, [conv.other_user_id]);

      const lastMessage = await db.get(`
        SELECT content, created_at, read, sender_id
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, conv.other_user_id, conv.other_user_id, userId]);

      const unreadCount = await db.get(`
        SELECT COUNT(*) as count FROM messages WHERE sender_id = ? AND receiver_id = ? AND read = 0
      `, [conv.other_user_id, userId]);

      if (otherUser) {
        results.push({
          user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount ? unreadCount.count : 0
        });
      }
    }

    res.json({ success: true, count: results.length, conversations: results });
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/messages/thread/:otherUserId - Get messages in thread
router.get('/thread/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;

    const thread = await db.all(`
      SELECT m.*, u.first_name as sender_first_name, u.last_name as sender_last_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [userId, otherUserId, otherUserId, userId]);

    // Mark as read
    await db.run('UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ?', [otherUserId, userId]);

    res.json({ success: true, messages: thread });
  } catch (err) {
    console.error('Fetch thread error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/messages/send - Send message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, content, message } = req.body;
    const messageContent = content || message;
    if (!receiver_id || !messageContent || !messageContent.trim()) {
      return res.status(400).json({ success: false, message: 'Receiver ID and content are required.' });
    }

    const result = await db.run(`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `, [req.user.id, receiver_id, messageContent.trim()]);

    const newMsg = await db.get('SELECT * FROM messages WHERE id = ?', [result.id]);
    const normalizedMessage = {
      ...(newMsg || {
        id: result.id,
        sender_id: req.user.id,
        receiver_id,
        content: messageContent.trim(),
        read: 0,
        created_at: new Date().toISOString()
      }),
      message: (newMsg || {}).content || messageContent.trim(),
      content: (newMsg || {}).content || messageContent.trim()
    };

    res.status(201).json({ success: true, message: normalizedMessage });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
