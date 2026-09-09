const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/competencies - All competencies
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM competencies';
    const params = [];

    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY category, name';

    const competencies = await db.all(sql, params);
    res.json({ success: true, count: competencies.length, competencies });
  } catch (err) {
    console.error('Fetch competencies error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching competencies.' });
  }
});

// GET /api/competencies/trainee/me - Trainee competency profile
router.get('/trainee/me', authenticateToken, async (req, res) => {
  try {
    const traineeId = req.user.id;

    const competencies = await db.all(`
      SELECT c.id, c.name, c.category, c.description, c.icon,
             COALESCE(tc.score, 0) as current_score,
             COALESCE(tc.level, 'beginner') as level,
             COALESCE(tc.previous_score, 0) as previous_score,
             tc.assessed_at,
             sg.target_score, sg.gap, sg.status as gap_status
      FROM competencies c
      LEFT JOIN trainee_competencies tc ON c.id = tc.competency_id AND tc.trainee_id = ?
      LEFT JOIN skill_gaps sg ON c.id = sg.competency_id AND sg.user_id = ? AND sg.status = 'active'
      ORDER BY c.category, c.name
    `, [traineeId, traineeId]);

    const averageScore = competencies.reduce((acc, curr) => acc + curr.current_score, 0) / (competencies.length || 1);
    const activeGapsCount = competencies.filter(c => c.gap_status === 'active').length;

    res.json({
      success: true,
      summary: {
        total_competencies: competencies.length,
        average_score: Math.round(averageScore * 10) / 10,
        active_skill_gaps: activeGapsCount
      },
      competencies
    });
  } catch (err) {
    console.error('Fetch trainee competency error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching trainee competency matrix.' });
  }
});

// GET /api/competencies/trainee/:id - Specific trainee competency
router.get('/trainee/:id', authenticateToken, async (req, res) => {
  try {
    const traineeId = req.params.id;

    const competencies = await db.all(`
      SELECT c.id, c.name, c.category, c.description, c.icon,
             COALESCE(tc.score, 0) as current_score,
             COALESCE(tc.level, 'beginner') as level,
             tc.assessed_at,
             sg.target_score, sg.gap, sg.status as gap_status
      FROM competencies c
      LEFT JOIN trainee_competencies tc ON c.id = tc.competency_id AND tc.trainee_id = ?
      LEFT JOIN skill_gaps sg ON c.id = sg.competency_id AND sg.user_id = ? AND sg.status = 'active'
      ORDER BY c.category, c.name
    `, [traineeId, traineeId]);

    res.json({ success: true, competencies });
  } catch (err) {
    console.error('Fetch trainee competency detail error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/competencies - Admin create competency
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, description, icon } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required.' });
    }

    const result = await db.run(`
      INSERT INTO competencies (name, category, description, icon)
      VALUES (?, ?, ?, ?)
    `, [name, category, description || '', icon || 'BookOpen']);

    const newComp = await db.get('SELECT * FROM competencies WHERE id = ?', [result.id]);

    res.status(201).json({ success: true, message: 'Competency created.', competency: newComp });
  } catch (err) {
    console.error('Create competency error:', err);
    res.status(500).json({ success: false, message: 'Server error creating competency.' });
  }
});

module.exports = router;
