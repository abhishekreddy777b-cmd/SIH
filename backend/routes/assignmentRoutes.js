const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/assignments - List assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { course_id } = req.query;
    let sql = `
      SELECT a.*, c.title as course_title
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
    `;
    const params = [];

    if (course_id) {
      sql += ` WHERE a.course_id = ?`;
      params.push(course_id);
    }
    sql += ` ORDER BY a.created_at DESC`;

    const assignments = await db.all(sql, params);

    for (const assign of assignments) {
      const submission = await db.get(`
        SELECT * FROM submissions WHERE assignment_id = ? AND user_id = ?
      `, [assign.id, req.user.id]);
      assign.user_submission = submission || null;
    }

    res.json({ success: true, count: assignments.length, assignments });
  } catch (err) {
    console.error('Fetch assignments error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching assignments.' });
  }
});

// POST /api/assignments/:id/submit - Submit assignment
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.user.id;
    const { submission_text, file_url } = req.body;

    const assignment = await db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await db.run(`
      INSERT INTO submissions (assignment_id, user_id, submission_text, file_url, status)
      VALUES (?, ?, ?, ?, 'submitted')
    `, [assignmentId, userId, submission_text || '', file_url || '']);

    res.status(201).json({ success: true, message: 'Assignment submitted successfully for review!' });
  } catch (err) {
    console.error('Submit assignment error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/assignments/submissions/:id/grade - Trainer Grade submission
router.post('/submissions/:id/grade', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { score, feedback } = req.body;

    await db.run(`
      UPDATE submissions
      SET score = ?, feedback = ?, status = 'graded', graded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [score, feedback || '', submissionId]);

    res.json({ success: true, message: 'Submission graded successfully.' });
  } catch (err) {
    console.error('Grade submission error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
