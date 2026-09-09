const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/analytics/dashboard - Platform-wide MoES capacity statistics
router.get('/dashboard', authenticateToken, requireRole('admin', 'trainer'), async (req, res) => {
  try {
    const totalTrainees = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'trainee'`);
    const totalTrainers = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'trainer'`);
    const totalCourses = await db.get(`SELECT COUNT(*) as count FROM courses WHERE status = 'published'`);
    const totalCertificates = await db.get(`SELECT COUNT(*) as count FROM certificates`);
    const totalEnrollments = await db.get(`SELECT COUNT(*) as count FROM enrollments`);

    // Department breakdown
    const departmentStats = await db.all(`
      SELECT department, COUNT(*) as trainee_count
      FROM users
      WHERE role = 'trainee' AND department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY trainee_count DESC
    `);

    // Top active skill gaps across platform
    const topSkillGaps = await db.all(`
      SELECT c.name as competency_name, c.category, COUNT(sg.id) as affected_trainees, AVG(sg.gap) as average_gap
      FROM skill_gaps sg
      JOIN competencies c ON sg.competency_id = c.id
      WHERE sg.status = 'active'
      GROUP BY c.id
      ORDER BY affected_trainees DESC, average_gap DESC
      LIMIT 6
    `);

    // Average competency scores across platform
    const competencyAverages = await db.all(`
      SELECT c.name as competency_name, c.category, AVG(tc.score) as average_score
      FROM competencies c
      JOIN trainee_competencies tc ON c.id = tc.competency_id
      GROUP BY c.id
      ORDER BY average_score ASC
    `);

    // Learning activity timeline (monthly completed courses)
    const completionTrends = await db.all(`
      SELECT strftime('%Y-%m', completed_at) as month, COUNT(*) as count
      FROM enrollments
      WHERE completed_at IS NOT NULL
      GROUP BY month
      ORDER BY month ASC
      LIMIT 6
    `);

    res.json({
      success: true,
      metrics: {
        total_trainees: totalTrainees ? totalTrainees.count : 0,
        total_trainers: totalTrainers ? totalTrainers.count : 0,
        total_courses: totalCourses ? totalCourses.count : 0,
        total_certificates: totalCertificates ? totalCertificates.count : 0,
        total_enrollments: totalEnrollments ? totalEnrollments.count : 0
      },
      department_breakdown: departmentStats,
      top_skill_gaps: topSkillGaps,
      competency_averages: competencyAverages,
      completion_trends: completionTrends
    });
  } catch (err) {
    console.error('Fetch analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching analytics data.' });
  }
});

// GET /api/analytics/export-csv - Generate CSV export
router.get('/export-csv', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const trainees = await db.all(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.department, u.designation, u.location,
             tp.learning_hours, tp.current_streak,
             (SELECT COUNT(*) FROM enrollments WHERE user_id = u.id) as enrolled_courses,
             (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as certificates_count,
             (SELECT COUNT(*) FROM skill_gaps WHERE user_id = u.id AND status = 'active') as active_gaps
      FROM users u
      JOIN trainee_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'trainee'
      ORDER BY u.first_name ASC
    `);

    let csvContent = 'User ID,First Name,Last Name,Email,Department,Designation,Location,Learning Hours,Current Streak,Enrolled Courses,Certificates Earned,Active Skill Gaps\n';

    for (const t of trainees) {
      csvContent += `"${t.id}","${t.first_name}","${t.last_name}","${t.email}","${t.department}","${t.designation}","${t.location}",${t.learning_hours},${t.current_streak},${t.enrolled_courses},${t.certificates_count},${t.active_gaps}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="velora-trainee-capacity-report.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ success: false, message: 'Error generating CSV report.' });
  }
});

module.exports = router;
