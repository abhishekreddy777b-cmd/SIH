const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers
  };

  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('  VELORA CAPACITY CONNECT — AUTOMATED INTEGRATION TEST SUITE  ');
  console.log('  SIH 2026 Problem Statement SIH26075 (MoES / IMD Ecosystem)  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.log(`  ❌ FAILED: ${testName} (${details})`);
      failed++;
    }
  }

  try {
    // 1. HEALTH CHECK
    console.log('📌 Test Suite 1: System Health & Base Infrastructure');
    const health = await request('/health');
    assert(health.status === 200 && health.data.success, 'Backend Health Check API (/api/health)');

    // 2. AUTHENTICATION & DEMO ROLES
    console.log('\n📌 Test Suite 2: Role-Based Authentication & JWT Security');

    // Login Trainee
    const traineeAuth = await request('/auth/login', 'POST', { email: 'trainee@velora.demo', password: 'Demo@123' });
    assert(traineeAuth.status === 200 && traineeAuth.data.token, 'Trainee Authentication (Arjun Sharma)');
    const traineeToken = traineeAuth.data.token;

    // Login Trainer
    const trainerAuth = await request('/auth/login', 'POST', { email: 'trainer@velora.demo', password: 'Demo@123' });
    assert(trainerAuth.status === 200 && trainerAuth.data.token, 'Trainer Authentication (Dr. Rahul Mehta)');
    const trainerToken = trainerAuth.data.token;

    // Login Admin
    const adminAuth = await request('/auth/login', 'POST', { email: 'admin@velora.demo', password: 'Demo@123' });
    assert(adminAuth.status === 200 && adminAuth.data.token, 'Admin Authentication (Director General)');
    const adminToken = adminAuth.data.token;

    // Verify /auth/me
    const meRes = await request('/auth/me', 'GET', null, traineeToken);
    assert(meRes.data.user?.role === 'trainee', 'Verify Auth Middleware (/auth/me)');

    // 2A. ADMIN MODERATION AUDIT TRAIL
    const traineeDirectoryRes = await request('/users?role=trainee', 'GET', null, adminToken);
    assert(traineeDirectoryRes.data.success && Array.isArray(traineeDirectoryRes.data.users) && traineeDirectoryRes.data.users.length > 0, 'List trainee personnel for moderation checks');

    const moderationTargetId = traineeDirectoryRes.data.users[0].id;
    const moderationStatusRes = await request(`/users/${moderationTargetId}/status`, 'PUT', {
      status: 'flagged',
      reason: 'Automated moderation audit trail validation.'
    }, adminToken);
    assert(moderationStatusRes.status === 200 && moderationStatusRes.data.success, 'Update user status with audit reason');

    const moderationHistoryRes = await request(`/users/${moderationTargetId}/moderation-history`, 'GET', null, adminToken);
    assert(Array.isArray(moderationHistoryRes.data.history) && moderationHistoryRes.data.history.some(entry => entry.reason && entry.new_status === 'flagged'), 'Fetch moderation history for user');

    // 3. COMPETENCIES & DYNAMIC SKILL GAP ENGINE
    console.log('\n📌 Test Suite 3: MoES Competency Matrix & Dynamic Skill Gap Engine');

    const compRes = await request('/competencies', 'GET', null, traineeToken);
    assert(compRes.data.competencies?.length > 0, 'Fetch Public MoES Competencies Matrix');

    const traineeCompRes = await request('/competencies/trainee/me', 'GET', null, traineeToken);
    assert(traineeCompRes.data.competencies?.length > 0, 'Fetch Trainee Specific Scores & Levels');

    // Run Skill Gap calculation engine
    const calcGapRes = await request('/skill-gaps/calculate', 'POST', { target_score: 80 }, traineeToken);
    assert(calcGapRes.data.success && calcGapRes.data.stats, 'Execute Skill Gap Calculation Engine (Gap = Target - Current)');

    const myGapsRes = await request('/skill-gaps/me', 'GET', null, traineeToken);
    assert(Array.isArray(myGapsRes.data.skillGaps), 'Fetch Trainee Active Skill Deficits');

    // 4. COURSES & LESSON PLAYER
    console.log('\n📌 Test Suite 4: Course Catalog & Micro-Lesson Completion Engine');

    const coursesRes = await request('/courses', 'GET', null, traineeToken);
    assert(coursesRes.data.courses?.length > 0, 'Fetch Courses Catalog');

    let courseId = null;
    let courseDetailRes = null;

    for (const course of coursesRes.data.courses) {
      const detailRes = await request(`/courses/${course.id}`, 'GET', null, traineeToken);
      if (detailRes.data.course?.modules?.length > 0 && detailRes.data.course.modules.some((module) => Array.isArray(module.lessons) && module.lessons.length > 0)) {
        courseId = course.id;
        courseDetailRes = detailRes;
        break;
      }
    }

    assert(courseId && courseDetailRes?.data.course?.modules?.length > 0, 'Fetch Detailed Course Syllabus & Modules');

    const firstLessonId = courseDetailRes.data.course.modules.find((module) => Array.isArray(module.lessons) && module.lessons.length > 0)?.lessons[0].id;
    const completeLessonRes = await request(`/lessons/${firstLessonId}/complete`, 'POST', { time_spent_minutes: 15 }, traineeToken);
    assert(completeLessonRes.data.success && typeof completeLessonRes.data.progress_percentage === 'number', 'Complete Lesson & Real-Time Progress Update');

    const trainerCoursesRes = await request('/courses/trainer/my-courses', 'GET', null, trainerToken);
    assert(trainerCoursesRes.data.courses?.length > 0, 'Fetch Trainer Created Courses');

    const trainerCourseId = trainerCoursesRes.data.courses[0].id;

    const createModuleRes = await request(`/courses/${trainerCourseId}/modules`, 'POST', {
      title: 'Automation Module',
      description: 'Module created for regression testing.'
    }, trainerToken);
    assert(createModuleRes.status === 201 && createModuleRes.data.success, 'Create Module for Trainer Course');

    const createdModuleId = createModuleRes.data.module.id;
    const updateModuleRes = await request(`/courses/${trainerCourseId}/modules/${createdModuleId}`, 'PUT', {
      title: 'Automation Module Updated',
      description: 'Module description updated for regression testing.'
    }, trainerToken);
    assert(updateModuleRes.status === 200 && updateModuleRes.data.success, 'Update Existing Module');

    const reorderModuleRes = await request(`/courses/${trainerCourseId}/modules/${createdModuleId}/reorder`, 'PUT', {
      direction: 'up'
    }, trainerToken);
    assert(reorderModuleRes.status === 200 && reorderModuleRes.data.success && reorderModuleRes.data.module.order_index > 0, 'Reorder Module Within Course');

    const deleteModuleRes = await request(`/courses/${trainerCourseId}/modules/${createdModuleId}`, 'DELETE', null, trainerToken);
    assert(deleteModuleRes.status === 200 && deleteModuleRes.data.success, 'Delete Existing Module');

    const createAssignmentRes = await request('/assignments', 'POST', {
      course_id: trainerCourseId,
      title: 'Automation QA Assignment',
      description: 'Validate assignment workflow for trainer review.',
      instructions: 'Submit a brief report summarizing your findings.',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      max_score: 100
    }, trainerToken);
    assert(createAssignmentRes.status === 201 && createAssignmentRes.data.success, 'Create Assignment for Trainer Course');

    const createdAssignmentId = createAssignmentRes.data.assignment.id;
    const assignmentSubmissionsRes = await request(`/assignments/${createdAssignmentId}/submissions`, 'GET', null, trainerToken);
    assert(assignmentSubmissionsRes.data.success && Array.isArray(assignmentSubmissionsRes.data.submissions), 'Fetch Assignment Submissions for Review');

    const submitAssignmentRes = await request(`/assignments/${createdAssignmentId}/submit`, 'POST', {
      submission_text: 'Automated test submission content.'
    }, traineeToken);
    assert(submitAssignmentRes.status === 201 && submitAssignmentRes.data.success, 'Submit Assignment for Review');

    const updatedAssignmentsRes = await request(`/assignments/${createdAssignmentId}/submissions`, 'GET', null, trainerToken);
    const newSubmissionId = updatedAssignmentsRes.data.submissions?.[0]?.id;
    assert(newSubmissionId, 'Track User Submission Within Assignment Review');

    const gradeRes = await request(`/assignments/submissions/${newSubmissionId}/grade`, 'POST', {
      score: 92,
      feedback: 'Well structured submission.'
    }, trainerToken);
    assert(gradeRes.data.success, 'Grade Submitted Assignment');

    // 5. TIMED ASSESSMENT SCORING ENGINE
    console.log('\n📌 Test Suite 5: Timed Assessment Engine & Automated Competency Boost');

    const assRes = await request('/assessments', 'GET', null, traineeToken);
    assert(assRes.data.assessments?.length > 0, 'Fetch Available Assessments');

    const testId = assRes.data.assessments[0].id;
    const testDetailRes = await request(`/assessments/${testId}`, 'GET', null, traineeToken);
    assert(testDetailRes.data.assessment?.questions?.length > 0, 'Fetch Assessment Questions & Options');

    // Prepare answer dict { [questionId]: selectedOption }
    const answersObj = {};
    testDetailRes.data.assessment.questions.forEach(q => {
      answersObj[q.id] = q.options[0];
    });

    // Submit Assessment Test
    const submitTestRes = await request(`/assessments/${testId}/submit`, 'POST', {
      answers: answersObj,
      time_taken_minutes: 10
    }, traineeToken);
    assert(submitTestRes.data.success && submitTestRes.data.result, 'Submit Timed Assessment & Calculate Score Report');

    // 6. AI RECOMMENDATION ENGINE
    console.log('\n📌 Test Suite 6: AI-Driven Adaptive Recommendation Engine');

    const genRecRes = await request('/recommendations/generate', 'POST', {}, traineeToken);
    assert(genRecRes.data.success, 'Trigger AI Learning Path Recommendation Engine');

    const myRecRes = await request('/recommendations/me', 'GET', null, traineeToken);
    assert(Array.isArray(myRecRes.data.course_recommendations), 'Fetch Tailored Course Pathways with Match Rationale');

    // 7. LIVE CLASSROOM & CHAT
    console.log('\n📌 Test Suite 7: Live Classroom Streaming, Interactive Chat & Polls');

    const liveClassesRes = await request('/live-classes', 'GET', null, traineeToken);
    assert(liveClassesRes.data.classes?.length > 0, 'Fetch Live Virtual Classrooms List');

    const liveId = liveClassesRes.data.classes[0].id;
    const sendChatRes = await request(`/live-classes/${liveId}/messages`, 'POST', { message: 'Automated test chat message in stream' }, traineeToken);
    assert(sendChatRes.data.success, 'Post Live Classroom Chat Message');

    // 8. CRYPTOGRAPHIC CERTIFICATES & VERIFICATION REGISTRY
    console.log('\n📌 Test Suite 8: Cryptographic Certificates & Verification Registry');

    const verifyCertRes = await request('/certificates/verify/VELORA-2026-98421');
    assert(verifyCertRes.data.success && verifyCertRes.data.certificate.trainee_name === 'Arjun Singh', 'Public Cryptographic Certificate Verification (VELORA-2026-98421)');

    // 9. EXECUTIVE ANALYTICS DASHBOARD
    console.log('\n📌 Test Suite 9: Executive Directorate Analytics & CSV Export');

    const analyticsRes = await request('/analytics/dashboard', 'GET', null, adminToken);
    assert(analyticsRes.data.metrics?.total_trainees > 0, 'Fetch Directorate National Capacity Analytics');

    console.log('\n===============================================================');
    console.log(`  TEST RESULTS SUMMARY: ${passed} PASSED | ${failed} FAILED  `);
    console.log('===============================================================\n');

    if (failed === 0) {
      console.log('✨ ALL 21 AUTOMATED SYSTEM INTEGRATION TESTS PASSED PERFECTLY!');
    }
  } catch (err) {
    console.error('Test Suite Error:', err.message);
  }
}

runTestSuite();
