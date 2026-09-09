const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const buildDisplayName = (user = {}) => {
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const joined = `${firstName} ${lastName}`.trim();
  return joined || user.email || 'Unknown User';
};

// GET /api/assignments - List assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { course_id } = req.query;
    let sql = `
      SELECT a.*, c.title as course_title,
             u.first_name as creator_first_name,
             u.last_name as creator_last_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
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

      const submissionCount = await db.get(`
        SELECT COUNT(*) as count FROM submissions WHERE assignment_id = ?
      `, [assign.id]);

      assign.user_submission = submission || null;
      assign.submission_count = submissionCount?.count || 0;
      assign.created_by_name = buildDisplayName({
        first_name: assign.creator_first_name,
        last_name: assign.creator_last_name,
        email: assign.creator_email
      });
      delete assign.creator_first_name;
      delete assign.creator_last_name;
      delete assign.creator_email;
    }

    res.json({ success: true, count: assignments.length, assignments });
  } catch (err) {
    console.error('Fetch assignments error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching assignments.' });
  }
});

// GET /api/assignments/:id - Fetch one assignment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await db.get(`
      SELECT a.*, c.title as course_title,
             u.first_name as creator_first_name,
             u.last_name as creator_last_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const submissionCount = await db.get(`
      SELECT COUNT(*) as count FROM submissions WHERE assignment_id = ?
    `, [assignment.id]);

    assignment.submission_count = submissionCount?.count || 0;
    assignment.created_by_name = buildDisplayName({
      first_name: assignment.creator_first_name,
      last_name: assignment.creator_last_name,
      email: assignment.creator_email
    });

    delete assignment.creator_first_name;
    delete assignment.creator_last_name;
    delete assignment.creator_email;

    res.json({ success: true, assignment });
  } catch (err) {
    console.error('Fetch assignment detail error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching assignment.' });
  }
});

// GET /api/assignments/:id/submissions - Trainer/Admin review submissions
router.get('/:id/submissions', authenticateToken, async (req, res) => {
  try {
    const assignment = await db.get('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const course = await db.get('SELECT trainer_id FROM courses WHERE id = ?', [assignment.course_id]);

    if (req.user.role === 'trainer' && course?.trainer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only review submissions for your own course assignments.' });
    }

    const submissions = await db.all(`
      SELECT s.*, u.first_name, u.last_name, u.email
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `, [req.params.id]);

    submissions.forEach((submission) => {
      submission.user_name = buildDisplayName(submission);
      delete submission.password_hash;
    });

    res.json({ success: true, submissions });
  } catch (err) {
    console.error('Fetch assignment submissions error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching submissions.' });
  }
});

// POST /api/assignments - Create assignment
router.post('/', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const { course_id, title, description, instructions, deadline, max_score } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({ success: false, message: 'Course and title are required.' });
    }

    const course = await db.get('SELECT * FROM courses WHERE id = ?', [course_id]);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (req.user.role === 'trainer' && course.trainer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only create assignments for your own courses.' });
    }

    await db.run(`
      INSERT INTO assignments (course_id, title, description, instructions, deadline, max_score, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [course_id, title, description || '', instructions || '', deadline || null, max_score || 100, req.user.id]);

    const assignment = await db.get(`
      SELECT * FROM assignments
      WHERE course_id = ? AND title = ?
      ORDER BY id DESC
      LIMIT 1
    `, [course_id, title]);

    res.status(201).json({ success: true, message: 'Assignment created successfully.', assignment });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ success: false, message: 'Server error creating assignment.' });
  }
});

// PUT /api/assignments/:id - Update assignment
router.put('/:id', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const assignment = await db.get('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const course = await db.get('SELECT trainer_id FROM courses WHERE id = ?', [assignment.course_id]);
    if (req.user.role === 'trainer' && course?.trainer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit assignments for your own courses.' });
    }

    const { title, description, instructions, deadline, max_score } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Assignment title is required.' });
    }

    await db.run(`
      UPDATE assignments
      SET title = ?, description = ?, instructions = ?, deadline = ?, max_score = ?
      WHERE id = ?
    `, [title, description || '', instructions || '', deadline || null, max_score || assignment.max_score, req.params.id]);

    const updatedAssignment = await db.get('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Assignment updated successfully.', assignment: updatedAssignment });
  } catch (err) {
    console.error('Update assignment error:', err);
    res.status(500).json({ success: false, message: 'Server error updating assignment.' });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const assignment = await db.get('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const course = await db.get('SELECT trainer_id FROM courses WHERE id = ?', [assignment.course_id]);
    if (req.user.role === 'trainer' && course?.trainer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete assignments for your own courses.' });
    }

    await db.run('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting assignment.' });
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

    const existingSubmission = await db.get(
      'SELECT id FROM submissions WHERE assignment_id = ? AND user_id = ?',
      [assignmentId, userId]
    );

    if (existingSubmission) {
      await db.run(`
        UPDATE submissions
        SET submission_text = ?, file_url = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [submission_text || '', file_url || '', existingSubmission.id]);

      return res.status(200).json({ success: true, message: 'Assignment resubmitted successfully.' });
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

// POST /api/assignments/submissions/:id/grade - Trainer/Admin Grade submission
router.post('/submissions/:id/grade', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { score, feedback } = req.body;

    const submission = await db.get('SELECT * FROM submissions WHERE id = ?', [submissionId]);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const assignment = await db.get('SELECT * FROM assignments WHERE id = ?', [submission.assignment_id]);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const course = await db.get('SELECT trainer_id FROM courses WHERE id = ?', [assignment.course_id]);
    if (req.user.role === 'trainer' && course?.trainer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only grade submissions for your own courses.' });
    }

    await db.run(`
      UPDATE submissions
      SET score = ?, feedback = ?, status = 'graded', graded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [score ?? null, feedback || '', submissionId]);

    res.json({ success: true, message: 'Submission graded successfully.' });
  } catch (err) {
    console.error('Grade submission error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
