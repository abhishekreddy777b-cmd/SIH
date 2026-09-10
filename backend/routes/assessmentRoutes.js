const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/assessments/attempts/me - Current user's attempt history
router.get('/attempts/me', authenticateToken, async (req, res) => {
  try {
    const attempts = await db.all(`
      SELECT aa.*, a.title as assessment_title, a.passing_score, c.title as course_title
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE aa.user_id = ?
      ORDER BY aa.started_at DESC
    `, [req.user.id]);

    res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    console.error('Fetch attempts error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/assessments - List assessments
router.get('/', async (req, res) => {
  try {
    const assessments = await db.all(`
      SELECT a.*, c.title as course_title,
             c.category as category,
             a.duration_minutes as time_limit_mins,
             (SELECT COUNT(*) FROM questions WHERE assessment_id = a.id) as total_questions
      FROM assessments a
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.status = 'published'
      ORDER BY a.is_baseline DESC, a.created_at DESC
    `);

    res.json({ success: true, count: assessments.length, assessments });
  } catch (err) {
    console.error('Fetch assessments error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching assessments.' });
  }
});

// GET /api/assessments/:id - Assessment test taking view
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assessmentId = req.params.id;

    const assessment = await db.get(`
      SELECT a.*, c.title as course_title,
             c.category as category,
             a.duration_minutes as time_limit_mins,
             (SELECT COUNT(*) FROM questions WHERE assessment_id = a.id) as total_questions
      FROM assessments a
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [assessmentId]);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const questions = await db.all(`
      SELECT id, question_text, question_type, options, marks, order_index
      FROM questions
      WHERE assessment_id = ?
      ORDER BY order_index ASC
    `, [assessmentId]);

    const formattedQuestions = questions.map(q => {
      let parsedOptions = [];
      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      } catch (e) {
        parsedOptions = [q.options];
      }
      return {
        ...q,
        options: parsedOptions
      };
    });

    res.json({
      success: true,
      assessment: {
        ...assessment,
        questions: formattedQuestions
      }
    });
  } catch (err) {
    console.error('Fetch test error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/assessments/:id/submit - Evaluate assessment & update competency engine
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const userId = req.user.id;
    const { answers, time_taken_minutes = 15 } = req.body; // answers: { [questionId]: selectedOptionString }

    const assessment = await db.get('SELECT * FROM assessments WHERE id = ?', [assessmentId]);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const questions = await db.all('SELECT * FROM questions WHERE assessment_id = ?', [assessmentId]);

    let score = 0;
    let totalMarks = 0;
    const answerResults = [];
    const competencyPerformance = {}; // { [compId]: { scored: X, total: Y } }

    // Handle answers as object or array
    let answersObj = {};
    if (Array.isArray(answers)) {
      answers.forEach(item => {
        answersObj[item.question_id] = item.selected_option !== undefined ? item.selected_option : item.selected_answer;
      });
    } else if (answers && typeof answers === 'object') {
      answersObj = answers;
    }

    for (const q of questions) {
      totalMarks += q.marks;
      const selected = answersObj ? answersObj[q.id] : null;
      let isCorrect = false;

      if (selected !== undefined && selected !== null) {
        let selStr = selected.toString().trim();
        let targetStr = q.correct_answer.toString().trim();

        // Check numeric index matching (if selected is index 0, 1, 2...)
        let parsedOpts = [];
        try {
          parsedOpts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        } catch (e) {
          parsedOpts = [];
        }

        if (typeof selected === 'number' && parsedOpts[selected] !== undefined) {
          selStr = parsedOpts[selected].toString().trim();
        }

        isCorrect = selStr.toLowerCase() === targetStr.toLowerCase();
      }

      if (isCorrect) {
        score += q.marks;
      }

      answerResults.push({
        question_id: q.id,
        selected_answer: selected ?? null,
        is_correct: isCorrect ? 1 : 0,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      });

      if (q.competency_id) {
        if (!competencyPerformance[q.competency_id]) {
          competencyPerformance[q.competency_id] = { scored: 0, total: 0 };
        }
        competencyPerformance[q.competency_id].total += q.marks;
        if (isCorrect) {
          competencyPerformance[q.competency_id].scored += q.marks;
        }
      }
    }

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 10) / 10 : 0;
    const passed = percentage >= assessment.passing_score ? 1 : 0;

    // Record Attempt
    const attemptResult = await db.run(`
      INSERT INTO assessment_attempts (user_id, assessment_id, score, total_marks, percentage, passed, time_taken_minutes, started_at, completed_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'completed')
    `, [userId, assessmentId, score, totalMarks, percentage, passed, time_taken_minutes]);

    const attemptId = attemptResult.id;

    for (const ans of answerResults) {
      await db.run(`
        INSERT INTO assessment_answers (attempt_id, question_id, selected_answer, is_correct)
        VALUES (?, ?, ?, ?)
      `, [attemptId, ans.question_id, ans.selected_answer, ans.is_correct]);
    }

    // UPDATE COMPETENCY ENGINE & RECALCULATE SKILL GAPS
    for (const compIdStr of Object.keys(competencyPerformance)) {
      const compId = parseInt(compIdStr);
      const perf = competencyPerformance[compId];
      const compPercent = Math.round((perf.scored / perf.total) * 100);

      const level = compPercent >= 80 ? 'advanced' : compPercent >= 60 ? 'intermediate' : compPercent >= 40 ? 'developing' : 'beginner';

      const existingComp = await db.get('SELECT score FROM trainee_competencies WHERE trainee_id = ? AND competency_id = ?', [userId, compId]);

      if (existingComp) {
        await db.run(`
          UPDATE trainee_competencies
          SET previous_score = score, score = ?, level = ?, assessed_at = CURRENT_TIMESTAMP
          WHERE trainee_id = ? AND competency_id = ?
        `, [compPercent, level, userId, compId]);
      } else {
        await db.run(`
          INSERT INTO trainee_competencies (trainee_id, competency_id, score, level, previous_score, assessed_at)
          VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        `, [userId, compId, compPercent, level]);
      }

      // Update skill gap for this competency
      const targetScore = 80.0;
      const gap = targetScore - compPercent;

      if (gap > 0) {
        await db.run(`
          INSERT INTO skill_gaps (user_id, competency_id, current_score, target_score, gap, status)
          VALUES (?, ?, ?, ?, ?, 'active')
          ON CONFLICT(user_id, competency_id) DO UPDATE SET
          current_score = excluded.current_score, gap = excluded.gap, status = 'active'
        `, [userId, compId, compPercent, targetScore, gap]);
      } else {
        await db.run(`
          UPDATE skill_gaps SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND competency_id = ? AND status = 'active'
        `, [userId, compId]);
      }
    }

    res.json({
      success: true,
      message: passed ? 'Congratulations! You passed the assessment!' : 'Assessment completed. Review recommendations to improve.',
      score_percentage: percentage,
      score,
      total_questions: questions.length,
      passed: Boolean(passed),
      answer_review: answerResults,
      result: {
        attempt_id: attemptId,
        score,
        total_marks: totalMarks,
        percentage,
        passed: Boolean(passed),
        passing_score: assessment.passing_score
      }
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting assessment.' });
  }
});

module.exports = router;
