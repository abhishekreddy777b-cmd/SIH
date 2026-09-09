const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'video/mp4', 'video/webm', 'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Unsupported file type.'));
  }
});

router.post('/course', authenticateToken, requireRole('trainer', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { course_id, lesson_id, resource_type = 'resource' } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await db.run(`
      INSERT INTO uploaded_files (user_id, course_id, lesson_id, file_name, original_name, mime_type, size_bytes, resource_type, file_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, course_id || null, lesson_id || null, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, resource_type, fileUrl]);

    const uploadedFile = await db.get('SELECT * FROM uploaded_files WHERE id = ?', [result.id]);

    res.status(201).json({ success: true, file: uploadedFile });
  } catch (err) {
    console.error('Upload course file error:', err);
    res.status(500).json({ success: false, message: err.message || 'File upload failed.' });
  }
});

router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const files = await db.all(`
      SELECT *
      FROM uploaded_files
      WHERE course_id = ?
      ORDER BY created_at DESC
    `, [req.params.courseId]);

    res.json({ success: true, files });
  } catch (err) {
    console.error('Fetch uploaded files error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching uploaded files.' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await db.get('SELECT * FROM uploaded_files WHERE id = ?', [req.params.id]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    if (file.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not allowed to delete this file.' });
    }

    const filePath = path.join(uploadDir, path.basename(file.file_name));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.run('DELETE FROM uploaded_files WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (err) {
    console.error('Delete uploaded file error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting file.' });
  }
});

module.exports = router;
