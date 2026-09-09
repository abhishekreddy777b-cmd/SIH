const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notes - User notes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notes = await db.all(`
      SELECT n.*, l.title as lesson_title, c.title as course_title
      FROM notes n
      LEFT JOIN lessons l ON n.lesson_id = l.id
      LEFT JOIN courses c ON n.course_id = c.id
      WHERE n.user_id = ?
      ORDER BY n.updated_at DESC
    `, [req.user.id]);

    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/notes - Create/update note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, course_id, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    const existing = lesson_id ? await db.get('SELECT id FROM notes WHERE user_id = ? AND lesson_id = ?', [req.user.id, lesson_id]) : null;

    if (existing) {
      await db.run('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content.trim(), existing.id]);
    } else {
      await db.run(`
        INSERT INTO notes (user_id, lesson_id, course_id, content)
        VALUES (?, ?, ?, ?)
      `, [req.user.id, lesson_id || null, course_id || null, content.trim()]);
    }

    res.status(201).json({ success: true, message: 'Note saved successfully.' });
  } catch (err) {
    console.error('Save note error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Note deleted.' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
