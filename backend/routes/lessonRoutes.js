const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/lessons/:id - Lesson viewer details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user.id;

    const lesson = await db.get(`
      SELECT l.*, cm.course_id, cm.title as module_title, c.title as course_title
      FROM lessons l
      JOIN course_modules cm ON l.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE l.id = ?
    `, [lessonId]);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found.' });
    }

    const progress = await db.get(`
      SELECT completed, notes, time_spent_minutes
      FROM lesson_progress
      WHERE user_id = ? AND lesson_id = ?
    `, [userId, lessonId]);

    const userNotes = await db.get(`
      SELECT content
      FROM notes
      WHERE user_id = ? AND lesson_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `, [userId, lessonId]);

    // Aliases expected by the React pages
    lesson.duration_mins = lesson.duration_minutes;
    lesson.content_body = lesson.content_text;

    const completed = progress?.completed ? 1 : 0;
    lesson.is_completed = completed;
    lesson.user_progress = progress || { completed: 0, notes: '', time_spent_minutes: 0 };
    lesson.saved_notes = userNotes ? userNotes.content : '';

    res.json({ success: true, lesson });
  } catch (err) {
    console.error('Fetch lesson error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching lesson.' });
  }
});

// POST /api/lessons/:id/complete - Mark lesson complete and update overall course progress
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user.id;

    // Frontend may send watch_time_mins; backend DB stores time_spent_minutes
    const time_spent_minutes =
      typeof req.body?.time_spent_minutes === 'number'
        ? req.body.time_spent_minutes
        : (typeof req.body?.watch_time_mins === 'number' ? req.body.watch_time_mins : 15);

    const { notes = '' } = req.body;

    // Check if lesson exists
    const lesson = await db.get(`
      SELECT l.id, cm.course_id
      FROM lessons l
      JOIN course_modules cm ON l.module_id = cm.id
      WHERE l.id = ?
    `, [lessonId]);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found.' });
    }

    // Insert or update lesson progress
    const existing = await db.get(`
      SELECT id
      FROM lesson_progress
      WHERE user_id = ? AND lesson_id = ?
    `, [userId, lessonId]);

    if (existing) {
      await db.run(`
        UPDATE lesson_progress
        SET completed = 1,
            completed_at = CURRENT_TIMESTAMP,
            time_spent_minutes = time_spent_minutes + ?,
            notes = ?
        WHERE id = ?
      `, [time_spent_minutes, notes, existing.id]);
    } else {
      await db.run(`
        INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, notes, time_spent_minutes)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?, ?)
      `, [userId, lessonId, notes, time_spent_minutes]);
    }

    // Recalculate enrollment overall progress %
    const totalLessonsRes = await db.get(`
      SELECT COUNT(*) as count
      FROM lessons l
      JOIN course_modules cm ON l.module_id = cm.id
      WHERE cm.course_id = ?
    `, [lesson.course_id]);

    const completedLessonsRes = await db.get(`
      SELECT COUNT(*) as count
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN course_modules cm ON l.module_id = cm.id
      WHERE cm.course_id = ? AND lp.user_id = ? AND lp.completed = 1
    `, [lesson.course_id, userId]);

    const total = totalLessonsRes ? totalLessonsRes.count : 1;
    const completed = completedLessonsRes ? completedLessonsRes.count : 0;
    const progressPercent = Math.min(100, Math.round((completed / (total || 1)) * 100));

    const isFinished = progressPercent >= 100;

    await db.run(`
      UPDATE enrollments
      SET progress = ?,
          completed_at = ${isFinished ? 'CURRENT_TIMESTAMP' : 'completed_at'}
      WHERE user_id = ? AND course_id = ?
    `, [progressPercent, userId, lesson.course_id]);

    // Update trainee learning hours
    await db.run(`
      UPDATE trainee_profiles
      SET learning_hours = learning_hours + ?,
          last_activity_date = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [time_spent_minutes / 60, userId]);

    res.json({
      success: true,
      message: 'Lesson marked as completed!',
      course_id: lesson.course_id,
      course_progress: progressPercent,
      progress_percentage: progressPercent,
      is_completed: isFinished
    });
  } catch (err) {
    console.error('Complete lesson error:', err);
    res.status(500).json({ success: false, message: 'Server error marking lesson completed.' });
  }
});

// POST /api/lessons - Trainer Add Lesson to Module
router.post('/', authenticateToken, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const { module_id, title, description, content_type, content_url, content_text, duration_minutes } = req.body;
    if (!module_id || !title) {
      return res.status(400).json({ success: false, message: 'Module ID and title are required.' });
    }

    const orderRes = await db.get('SELECT MAX(order_index) as max_order FROM lessons WHERE module_id = ?', [module_id]);
    const nextOrder = (orderRes ? orderRes.max_order : 0) + 1;

    const result = await db.run(`
      INSERT INTO lessons (module_id, title, description, content_type, content_url, content_text, duration_minutes, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [module_id, title, description || '', content_type || 'reading', content_url || '', content_text || '', duration_minutes || 15, nextOrder]);

    const newLesson = await db.get('SELECT * FROM lessons WHERE id = ?', [result.id]);

    res.status(201).json({ success: true, message: 'Lesson added successfully.', lesson: newLesson });
  } catch (err) {
    console.error('Create lesson error:', err);
    res.status(500).json({ success: false, message: 'Server error creating lesson.' });
  }
});

module.exports = router;
