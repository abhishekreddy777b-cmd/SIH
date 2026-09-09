const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/live-classes - List live & scheduled sessions
router.get('/', async (req, res) => {
  try {
    const classes = await db.all(`
      SELECT lc.*, c.title as course_title,
             u.first_name as trainer_first_name, u.last_name as trainer_last_name, u.avatar as trainer_avatar,
             (SELECT COUNT(*) FROM class_participants WHERE class_id = lc.id) as participant_count
      FROM live_classes lc
      LEFT JOIN courses c ON lc.course_id = c.id
      JOIN users u ON lc.trainer_id = u.id
      ORDER BY CASE WHEN lc.status = 'live' THEN 1 WHEN lc.status = 'scheduled' THEN 2 ELSE 3 END, lc.scheduled_at ASC
    `);

    res.json({ success: true, count: classes.length, classes, live_classes: classes });
  } catch (err) {
    console.error('Fetch live classes error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching live classes.' });
  }
});

// GET /api/live-classes/:id - Live classroom view details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;

    const liveClass = await db.get(`
      SELECT lc.*, c.title as course_title,
             u.first_name as trainer_first_name, u.last_name as trainer_last_name, u.avatar as trainer_avatar, u.department as trainer_dept
      FROM live_classes lc
      LEFT JOIN courses c ON lc.course_id = c.id
      JOIN users u ON lc.trainer_id = u.id
      WHERE lc.id = ?
    `, [classId]);

    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class session not found.' });
    }

    // Fetch chat messages
    const messages = await db.all(`
      SELECT cm.id, cm.message, cm.message_type, cm.created_at,
             u.id as user_id, u.first_name, u.last_name, u.role, u.avatar
      FROM class_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.class_id = ?
      ORDER BY cm.created_at ASC
    `, [classId]);

    // Fetch active polls
    const polls = await db.all(`
      SELECT * FROM polls WHERE class_id = ? ORDER BY created_at DESC
    `, [classId]);

    for (const poll of polls) {
      let parsedOpts = [];
      try {
        parsedOpts = typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options;
      } catch (e) {
        parsedOpts = [poll.options];
      }
      poll.options = parsedOpts;

      // Fetch user response if any
      const userResp = await db.get(`
        SELECT selected_option FROM poll_responses WHERE poll_id = ? AND user_id = ?
      `, [poll.id, req.user.id]);

      poll.user_selected_option = userResp ? userResp.selected_option : null;

      // Aggregated response counts
      const counts = await db.all(`
        SELECT selected_option, COUNT(*) as count FROM poll_responses WHERE poll_id = ? GROUP BY selected_option
      `, [poll.id]);

      poll.response_counts = counts;
    }

    liveClass.messages = messages;
    liveClass.polls = polls;

    res.json({ success: true, liveClass });
  } catch (err) {
    console.error('Live classroom detail error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/live-classes/:id/join - Join room
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.id;

    const existing = await db.get('SELECT id FROM class_participants WHERE class_id = ? AND user_id = ?', [classId, userId]);
    if (!existing) {
      await db.run(`
        INSERT INTO class_participants (class_id, user_id, joined_at, attendance_status)
        VALUES (?, ?, CURRENT_TIMESTAMP, 'present')
      `, [classId, userId]);
    }

    res.json({ success: true, message: 'Joined live classroom session.' });
  } catch (err) {
    console.error('Join live class error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/live-classes/:id/messages - Send chat message
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.id;
    const { message, message_type = 'chat' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const result = await db.run(`
      INSERT INTO class_messages (class_id, user_id, message, message_type)
      VALUES (?, ?, ?, ?)
    `, [classId, userId, message.trim(), message_type]);

    const newMsg = await db.get(`
      SELECT cm.id, cm.message, cm.message_type, cm.created_at,
             u.id as user_id, u.first_name, u.last_name, u.role, u.avatar
      FROM class_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?
    `, [result.id]);

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    console.error('Send chat message error:', err);
    res.status(500).json({ success: false, message: 'Server error sending message.' });
  }
});

// POST /api/live-classes/polls/:pollId/respond - Submit poll answer
router.post('/polls/:pollId/respond', authenticateToken, async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const userId = req.user.id;
    const { selected_option } = req.body;

    if (selected_option === undefined || selected_option === null) {
      return res.status(400).json({ success: false, message: 'Selected option index required.' });
    }

    await db.run(`
      INSERT INTO poll_responses (poll_id, user_id, selected_option)
      VALUES (?, ?, ?)
      ON CONFLICT(poll_id, user_id) DO UPDATE SET selected_option = excluded.selected_option
    `, [pollId, userId, selected_option]);

    res.json({ success: true, message: 'Poll vote recorded successfully.' });
  } catch (err) {
    console.error('Poll vote error:', err);
    res.status(500).json({ success: false, message: 'Server error recording poll response.' });
  }
});

module.exports = router;
