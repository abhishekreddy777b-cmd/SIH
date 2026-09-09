const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/skill-gaps/me - Get current user active skill gaps
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const skillGaps = await db.all(`
      SELECT sg.id, sg.competency_id, sg.current_score, sg.target_score, sg.gap, sg.status, sg.identified_at, sg.resolved_at,
             c.name as competency_name, c.category as competency_category, c.description as competency_description, c.icon as competency_icon
      FROM skill_gaps sg
      JOIN competencies c ON sg.competency_id = c.id
      WHERE sg.user_id = ?
      ORDER BY sg.gap DESC
    `, [userId]);

    res.json({
      success: true,
      count: skillGaps.length,
      active_count: skillGaps.filter(g => g.status === 'active').length,
      skillGaps
    });
  } catch (err) {
    console.error('Fetch skill gaps error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching skill gaps.' });
  }
});

// POST /api/skill-gaps/calculate - Run core Skill Gap engine for trainee
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetScore = req.body.target_score || 80.0;

    // Get all competencies & trainee's current scores
    const competencies = await db.all(`
      SELECT c.id, COALESCE(tc.score, 0) as current_score
      FROM competencies c
      LEFT JOIN trainee_competencies tc ON c.id = tc.competency_id AND tc.trainee_id = ?
    `, [userId]);

    let newlyIdentified = 0;
    let updatedGaps = 0;

    for (const c of competencies) {
      const currentScore = c.current_score;
      const gap = targetScore - currentScore;

      if (gap > 0) {
        const existing = await db.get(`
          SELECT id, status FROM skill_gaps WHERE user_id = ? AND competency_id = ?
        `, [userId, c.id]);

        if (existing) {
          await db.run(`
            UPDATE skill_gaps
            SET current_score = ?, target_score = ?, gap = ?, status = 'active', identified_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [currentScore, targetScore, gap, existing.id]);
          updatedGaps++;
        } else {
          await db.run(`
            INSERT INTO skill_gaps (user_id, competency_id, current_score, target_score, gap, status)
            VALUES (?, ?, ?, ?, ?, 'active')
          `, [userId, c.id, currentScore, targetScore, gap]);
          newlyIdentified++;
        }
      } else {
        // Gap is resolved!
        await db.run(`
          UPDATE skill_gaps SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND competency_id = ? AND status = 'active'
        `, [userId, c.id]);
      }
    }

    res.json({
      success: true,
      message: `Skill gap calculation complete. ${newlyIdentified} new gaps identified, ${updatedGaps} updated.`,
      stats: { newlyIdentified, updatedGaps }
    });
  } catch (err) {
    console.error('Calculate skill gaps error:', err);
    res.status(500).json({ success: false, message: 'Server error during skill gap analysis.' });
  }
});

// PUT /api/skill-gaps/resolve/:id - Mark gap as resolved
router.put('/resolve/:id', authenticateToken, async (req, res) => {
  try {
    await db.run(`
      UPDATE skill_gaps SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);

    res.json({ success: true, message: 'Skill gap marked as resolved.' });
  } catch (err) {
    console.error('Resolve skill gap error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
