const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status !== 'active') {
      if (user.status === 'suspended') {
        const suspension = await db.get(`
          SELECT reason
          FROM user_moderation_history
          WHERE user_id = ? AND new_status = 'suspended'
          ORDER BY created_at DESC
          LIMIT 1
        `, [user.id]);

        const reason = suspension?.reason || 'No suspension reason was provided.';
        return res.status(403).json({
          success: false,
          message: `Your account has been suspended. Reason: ${reason}`
        });
      }

      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    let profile = null;
    if (user.role === 'trainee') {
      profile = await db.get('SELECT * FROM trainee_profiles WHERE user_id = ?', [user.id]);
    } else if (user.role === 'trainer') {
      profile = await db.get('SELECT * FROM trainer_profiles WHERE user_id = ?', [user.id]);
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        ...userWithoutPassword,
        profile
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, department, designation, location } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Public self-registration allows trainee or trainer roles (admin must be assigned by system/existing admin)
    const assignedRole = ['trainee', 'trainer'].includes(role) ? role : 'trainee';

    await db.run(`
      INSERT INTO users (email, password, role, first_name, last_name, department, designation, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [email, passwordHash, assignedRole, first_name || '', last_name || '', department || 'General', designation || 'Staff', location || 'India']);

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    let profile = null;
    if (assignedRole === 'trainee') {
      await db.run(`INSERT INTO trainee_profiles (user_id) VALUES (?)`, [user.id]);
      profile = await db.get('SELECT * FROM trainee_profiles WHERE user_id = ?', [user.id]);
    } else if (assignedRole === 'trainer') {
      await db.run(`INSERT INTO trainer_profiles (user_id) VALUES (?)`, [user.id]);
      profile = await db.get('SELECT * FROM trainer_profiles WHERE user_id = ?', [user.id]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password: __, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        ...userWithoutPassword,
        profile
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, email, role, first_name, last_name, avatar, phone, department, designation, location, bio, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'trainee') {
      profile = await db.get('SELECT * FROM trainee_profiles WHERE user_id = ?', [user.id]);
    } else if (user.role === 'trainer') {
      profile = await db.get('SELECT * FROM trainer_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({
      success: true,
      user: {
        ...user,
        profile
      }
    });
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching user details.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      department,
      designation,
      location,
      bio,
      qualifications,
      experience_years,
      students_trained,
      learning_hours,
      current_streak,
      longest_streak
    } = req.body;

    await db.run(`
      UPDATE users
      SET first_name = ?, last_name = ?, phone = ?, department = ?, designation = ?, location = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [first_name, last_name, phone, department, designation, location, bio, req.user.id]);

    let profile = null;

    if (req.user.role === 'trainee') {
      const existingProfile = await db.get('SELECT * FROM trainee_profiles WHERE user_id = ?', [req.user.id]);

      if (existingProfile) {
        await db.run(`
          UPDATE trainee_profiles
          SET learning_hours = ?, current_streak = ?, longest_streak = ?, last_activity_date = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [
          learning_hours !== undefined ? Number(learning_hours) : (existingProfile.learning_hours || 0),
          current_streak !== undefined ? Number(current_streak) : (existingProfile.current_streak || 0),
          longest_streak !== undefined ? Number(longest_streak) : (existingProfile.longest_streak || 0),
          req.user.id
        ]);
      } else {
        await db.run(`
          INSERT INTO trainee_profiles (user_id, learning_hours, current_streak, longest_streak, last_activity_date)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          req.user.id,
          learning_hours !== undefined ? Number(learning_hours) : 0,
          current_streak !== undefined ? Number(current_streak) : 0,
          longest_streak !== undefined ? Number(longest_streak) : 0
        ]);
      }

      profile = await db.get('SELECT * FROM trainee_profiles WHERE user_id = ?', [req.user.id]);
    }

    if (req.user.role === 'trainer') {
      const existingProfile = await db.get('SELECT * FROM trainer_profiles WHERE user_id = ?', [req.user.id]);

      if (existingProfile) {
        await db.run(`
          UPDATE trainer_profiles
          SET qualifications = ?, experience_years = ?, students_trained = ?
          WHERE user_id = ?
        `, [
          qualifications !== undefined ? qualifications : (existingProfile.qualifications || ''),
          experience_years !== undefined ? Number(experience_years) : (existingProfile.experience_years || 0),
          students_trained !== undefined ? Number(students_trained) : (existingProfile.students_trained || 0),
          req.user.id
        ]);
      } else {
        await db.run(`
          INSERT INTO trainer_profiles (user_id, qualifications, experience_years, students_trained)
          VALUES (?, ?, ?, ?)
        `, [
          req.user.id,
          qualifications || '',
          experience_years !== undefined ? Number(experience_years) : 0,
          students_trained !== undefined ? Number(students_trained) : 0
        ]);
      }

      profile = await db.get('SELECT * FROM trainer_profiles WHERE user_id = ?', [req.user.id]);
    }

    const updatedUser = await db.get('SELECT id, email, role, first_name, last_name, avatar, phone, department, designation, location, bio, status FROM users WHERE id = ?', [req.user.id]);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        ...updatedUser,
        profile
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
});

module.exports = router;
