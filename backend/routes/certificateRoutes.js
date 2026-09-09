const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/certificates/me - User certificates
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const certificates = await db.all(`
      SELECT cert.*, c.category, c.duration_hours, c.thumbnail
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      WHERE cert.user_id = ?
      ORDER BY cert.issued_at DESC
    `, [req.user.id]);

    res.json({ success: true, count: certificates.length, certificates });
  } catch (err) {
    console.error('Fetch certificates error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/certificates/verify/:certId - Public verification
router.get('/verify/:certId', async (req, res) => {
  try {
    const certId = req.params.certId;

    const cert = await db.get(`
      SELECT cert.*, c.description as course_description, c.category
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      WHERE cert.certificate_id = ?
    `, [certId]);

    if (!cert) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Invalid certificate ID. Record not found in VELORA MoES Registry.'
      });
    }

    res.json({
      success: true,
      verified: true,
      certificate: cert
    });
  } catch (err) {
    console.error('Verify certificate error:', err);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

// POST /api/certificates/generate/:courseId - Generate certificate upon 100% completion
router.post('/generate/:courseId', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    // Check enrollment
    const enrollment = await db.get('SELECT progress FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    if (!enrollment || enrollment.progress < 100) {
      return res.status(400).json({ success: false, message: 'Course must be 100% completed to claim certificate.' });
    }

    // Check existing
    const existing = await db.get('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    if (existing) {
      return res.json({ success: true, message: 'Certificate already issued.', certificate: existing });
    }

    const course = await db.get(`
      SELECT c.title, u.first_name || ' ' || u.last_name as trainer_name
      FROM courses c
      LEFT JOIN users u ON c.trainer_id = u.id
      WHERE c.id = ?
    `, [courseId]);

    const user = await db.get(`SELECT first_name || ' ' || last_name as full_name FROM users WHERE id = ?`, [userId]);

    const certId = `VELORA-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    await db.run(`
      INSERT INTO certificates (user_id, course_id, certificate_id, trainer_name, course_title, trainee_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, courseId, certId, course.trainer_name || 'VELORA Faculty', course.title, user.full_name]);

    const newCert = await db.get('SELECT * FROM certificates WHERE certificate_id = ?', [certId]);

    res.status(201).json({
      success: true,
      message: 'Official VELORA Capacity Connect certificate generated successfully!',
      certificate: newCert
    });
  } catch (err) {
    console.error('Generate certificate error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
