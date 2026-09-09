const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/skill-gaps/me - Get current user active skill gaps
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const skillGaps = await db.all(`
      SELECT sg.id,
             sg.competency_id,
             sg.current_score,
             sg.target_score,
             sg.gap,
             sg.status,
             sg.identified_at,
             sg.resolved_at,
             c.name as competency_name,
             c.category as competency_category,
             c.description as competency_description,
             c.icon as competency_icon
      FROM skill_gaps sg
      JOIN competencies c ON sg.competency_id = c.id
      WHERE sg.user_id = ? AND sg.status = 'active'
      ORDER BY sg.gap DESC
    `, [userId]);

    const competencyIds = [...new Set(skillGaps.map(g => g.competency_id))];

    let bestCourseByComp = new Map();
    let bestTrainerByComp = new Map();

    if (competencyIds.length > 0) {
      // Recommended course per competency (rule-based: highest course rating)
      const placeholders = competencyIds.map(() => '?').join(',');

      const courseRows = await db.all(`
        SELECT cc.competency_id,
               c.id as course_id,
               c.title as course_title,
               c.average_rating,
               u.first_name as trainer_first_name,
               u.last_name as trainer_last_name
        FROM course_competencies cc
        JOIN courses c ON c.id = cc.course_id
        LEFT JOIN users u ON u.id = c.trainer_id
        WHERE cc.competency_id IN (${placeholders})
          AND c.status = 'published'
        ORDER BY cc.competency_id ASC, c.average_rating DESC
      `, competencyIds);

      for (const r of courseRows) {
        if (!bestCourseByComp.has(r.competency_id)) {
          bestCourseByComp.set(r.competency_id, {
            recommended_course_id: r.course_id,
            recommended_course_title: r.course_title,
            recommended_trainer_name: `${r.trainer_first_name || ''} ${r.trainer_last_name || ''}`.trim() || null
          });
        }
      }

      // Recommended trainer per competency (rule-based: highest proficiency)
      const trainerRows = await db.all(`
        SELECT tc.competency_id,
               u.id as trainer_id,
               u.first_name,
               u.last_name,
               tc.proficiency_level
        FROM trainer_competencies tc
        JOIN users u ON u.id = tc.trainer_id
        WHERE tc.competency_id IN (${placeholders})
          AND u.role = 'trainer'
        ORDER BY tc.competency_id ASC, tc.proficiency_level DESC
      `, competencyIds);

      for (const r of trainerRows) {
        if (!bestTrainerByComp.has(r.competency_id)) {
          bestTrainerByComp.set(r.competency_id, {
            recommended_trainer_id: r.trainer_id,
            recommended_trainer_name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || null
          });
        }
      }
    }

    const shaped = skillGaps.map(g => {
      const course = bestCourseByComp.get(g.competency_id);
      const trainer = bestTrainerByComp.get(g.competency_id);

      return {
        ...g,
        // Back-compat / aliases expected by the UI
        category: g.competency_category,
        gap_score: g.gap,

        recommended_course_id: course?.recommended_course_id || null,
        recommended_course_title: course?.recommended_course_title || null,

        recommended_trainer_id: trainer?.recommended_trainer_id || null,
        recommended_trainer_name: trainer?.recommended_trainer_name || course?.recommended_trainer_name || null
      };
    });

    res.json({
      success: true,
      count: shaped.length,
      active_count: shaped.filter(g => g.status === 'active').length,
      skill_gaps: shaped,
      // Older code paths
      skillGaps: shaped
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
          SELECT id
          FROM skill_gaps
          WHERE user_id = ? AND competency_id = ?
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
        await db.run(`
          UPDATE skill_gaps
          SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND competency_id = ? AND status = 'active'
        `, [userId, c.id]);
      }
    }

    const activeAfter = await db.get(`
      SELECT COUNT(*) as count
      FROM skill_gaps
      WHERE user_id = ? AND status = 'active'
    `, [userId]);

    const totalActiveGaps = activeAfter?.count || 0;

    res.json({
      success: true,
      message: `Skill gap calculation complete. ${newlyIdentified} new gaps identified, ${updatedGaps} updated.`,
      gaps_found: newlyIdentified + updatedGaps,
      stats: {
        newlyIdentified,
        updatedGaps,
        total_gaps: totalActiveGaps
      }
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
      UPDATE skill_gaps
      SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);

    res.json({ success: true, message: 'Skill gap marked as resolved.' });
  } catch (err) {
    console.error('Resolve skill gap error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
