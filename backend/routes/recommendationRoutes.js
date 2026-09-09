const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/recommendations/me - Fetch personalized recommendations
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const courseRecs = await db.all(`
      SELECT cr.id,
             cr.match_score,
             cr.reason,
             cr.created_at,
             c.id as course_id,
             c.title as course_title,
             c.short_description,
             c.thumbnail,
             c.category,
             c.difficulty,
             c.duration_hours,
             c.average_rating,
             u.first_name as trainer_first_name,
             u.last_name as trainer_last_name
      FROM course_recommendations cr
      JOIN courses c ON cr.course_id = c.id
      LEFT JOIN users u ON c.trainer_id = u.id
      WHERE cr.user_id = ?
      ORDER BY cr.match_score DESC
    `, [userId]);

    const shapedCourseRecs = courseRecs.map(r => {
      const trainerName = `${r.trainer_first_name || ''} ${r.trainer_last_name || ''}`.trim() || null;
      return {
        ...r,
        // aliases expected by the React pages
        gap_reason: r.reason,
        trainer_name: trainerName,
        rating: r.average_rating
      };
    });

    const trainerRecs = await db.all(`
      SELECT tr.id,
             tr.match_score,
             tr.reason,
             tr.created_at,
             u.id as trainer_id,
             u.first_name,
             u.last_name,
             u.avatar,
             u.department,
             u.designation,
             u.location,
             tp.qualifications,
             tp.experience_years,
             tp.average_rating
      FROM trainer_recommendations tr
      JOIN users u ON tr.trainer_id = u.id
      JOIN trainer_profiles tp ON u.id = tp.user_id
      WHERE tr.user_id = ?
      ORDER BY tr.match_score DESC
    `, [userId]);

    res.json({
      success: true,
      // Back-compat alias expected by RecommendationsPage
      recommendations: shapedCourseRecs,
      course_recommendations: shapedCourseRecs,
      trainer_recommendations: trainerRecs
    });
  } catch (err) {
    console.error('Fetch recommendations error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching recommendations.' });
  }
});

// POST /api/recommendations/generate - Run recommendation engine for user
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get trainee's active skill gaps
    const activeGaps = await db.all(`
      SELECT sg.competency_id, sg.gap, c.name as competency_name
      FROM skill_gaps sg
      JOIN competencies c ON sg.competency_id = c.id
      WHERE sg.user_id = ? AND sg.status = 'active'
      ORDER BY sg.gap DESC
    `, [userId]);

    if (activeGaps.length === 0) {
      return res.json({
        success: true,
        message: 'No active skill gaps identified. Keep learning!',
        generated_count: 0,
        // Back-compat alias expected by RecommendationsPage
        recommendations: [],
        course_recommendations: [],
        trainer_recommendations: []
      });
    }

    // Clean old recommendations for fresh generate
    await db.run('DELETE FROM course_recommendations WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM trainer_recommendations WHERE user_id = ?', [userId]);

    const generatedCourseRecs = [];
    const generatedTrainerRecs = [];

    for (const gap of activeGaps) {
      // Find courses that teach this competency
      const matchingCourses = await db.all(`
        SELECT DISTINCT c.id, c.title, c.average_rating
        FROM courses c
        JOIN course_competencies cc ON c.id = cc.course_id
        WHERE cc.competency_id = ? AND c.status = 'published'
      `, [gap.competency_id]);

      for (const crs of matchingCourses) {
        const matchScore = Math.min(99, Math.round(85 + (gap.gap / 100) * 15));
        const reason = `Identified skill gap in ${gap.competency_name} (${Math.round(gap.gap)}% gap). Enrolling in "${crs.title}" directly targets your primary growth area.`;

        await db.run(`
          INSERT INTO course_recommendations (user_id, course_id, match_score, reason)
          VALUES (?, ?, ?, ?)
        `, [userId, crs.id, matchScore, reason]);

        generatedCourseRecs.push({ course_id: crs.id, matchScore, reason });
      }

      // Find trainers proficient in this competency
      const matchingTrainers = await db.all(`
        SELECT u.id, u.first_name, u.last_name, tc.proficiency_level
        FROM users u
        JOIN trainer_competencies tc ON u.id = tc.trainer_id
        WHERE tc.competency_id = ? AND u.role = 'trainer'
        ORDER BY tc.proficiency_level DESC
        LIMIT 2
      `, [gap.competency_id]);

      for (const t of matchingTrainers) {
        const matchScore = Math.min(98, Math.round(t.proficiency_level));
        const reason = `${t.first_name} ${t.last_name} holds ${t.proficiency_level}% proficiency in ${gap.competency_name}, matching your top skill gap.`;

        await db.run(`
          INSERT INTO trainer_recommendations (user_id, trainer_id, match_score, reason)
          VALUES (?, ?, ?, ?)
        `, [userId, t.id, matchScore, reason]);

        generatedTrainerRecs.push({ trainer_id: t.id, matchScore, reason });
      }
    }

    res.json({
      success: true,
      message: 'Personalized recommendations generated successfully.',
      generated_count: generatedCourseRecs.length + generatedTrainerRecs.length
    });
  } catch (err) {
    console.error('Generate recommendations error:', err);
    res.status(500).json({ success: false, message: 'Server error generating recommendations.' });
  }
});

module.exports = router;
