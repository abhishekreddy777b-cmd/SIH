const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('velora_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...getAuthHeader(),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error(typeof data === 'string' ? data : data.message || 'API Request Failed');
    }

    return typeof data === 'string' ? { success: true, data } : data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: profileData }),

  // Users & Trainers
  getTrainers: () => request('/users/trainers'),
  getTrainerById: (id) => request(`/users/trainers/${id}`),
  getAllUsers: (params = '') => request(`/users?${params}`),
  updateUserStatus: (id, status, reason = '') => request(`/users/${id}/status`, { method: 'PUT', body: { status, reason } }),
  getModerationHistory: (id) => request(`/users/${id}/moderation-history`),

  // Competencies & Skill Gaps
  getCompetencies: (category = '') => request(`/competencies${category ? `?category=${category}` : ''}`),
  getTraineeCompetencies: () => request('/competencies/trainee/me'),
  getMySkillGaps: () => request('/skill-gaps/me'),
  calculateSkillGaps: () => request('/skill-gaps/calculate', { method: 'POST' }),
  resolveSkillGap: (id) => request(`/skill-gaps/resolve/${id}`, { method: 'PUT' }),

  // Courses & Lessons
  getCourses: (params = '') => request(`/courses?${params}`),
  getCourseById: (id) => request(`/courses/${id}`),
  getTrainerCourses: () => request('/courses/trainer/my-courses'),
  createCourse: (courseData) => request('/courses', { method: 'POST', body: courseData }),
  updateCourse: (id, courseData) => request(`/courses/${id}`, { method: 'PUT', body: courseData }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  addModuleToCourse: (courseId, moduleData) => request(`/courses/${courseId}/modules`, { method: 'POST', body: moduleData }),
  updateModule: (courseId, moduleId, moduleData) => request(`/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: moduleData }),
  reorderModule: (courseId, moduleId, direction) => request(`/courses/${courseId}/modules/${moduleId}/reorder`, { method: 'PUT', body: { direction } }),
  deleteModule: (courseId, moduleId) => request(`/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' }),

  getLessonById: (id) => request(`/lessons/${id}`),
  completeLesson: (id, payload) => request(`/lessons/${id}/complete`, { method: 'POST', body: payload }),
  createLesson: (lessonData) => request('/lessons', { method: 'POST', body: lessonData }),
  updateLesson: (id, lessonData) => request(`/lessons/${id}`, { method: 'PUT', body: lessonData }),
  deleteLesson: (id) => request(`/lessons/${id}`, { method: 'DELETE' }),

  // Enrollments
  getMyEnrollments: () => request('/enrollments/me'),
  enrollCourse: (courseId) => request(`/enrollments/${courseId}`, { method: 'POST' }),

  // Assessments
  getAssessments: () => request('/assessments'),
  getAssessmentById: (id) => request(`/assessments/${id}`),
  submitAssessment: (id, payload) => request(`/assessments/${id}/submit`, { method: 'POST', body: payload }),
  getMyAttempts: () => request('/assessments/attempts/me'),

  // Recommendations
  getMyRecommendations: () => request('/recommendations/me'),
  generateRecommendations: () => request('/recommendations/generate', { method: 'POST' }),

  // Live Classroom
  getLiveClasses: () => request('/live-classes'),
  getLiveClassById: (id) => request(`/live-classes/${id}`),
  joinLiveClass: (id) => request(`/live-classes/${id}/join`, { method: 'POST' }),
  sendChatMessage: (id, message) => request(`/live-classes/${id}/messages`, { method: 'POST', body: { message } }),
  votePoll: (pollId, selectedOption) => request(`/live-classes/polls/${pollId}/respond`, { method: 'POST', body: { selected_option: selectedOption } }),

  // Assignments & Submissions
  getAssignments: (params = '') => request(`/assignments${params ? `?${params}` : ''}`),
  getAssignmentById: (id) => request(`/assignments/${id}`),
  createAssignment: (assignmentData) => request('/assignments', { method: 'POST', body: assignmentData }),
  updateAssignment: (id, assignmentData) => request(`/assignments/${id}`, { method: 'PUT', body: assignmentData }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),
  getAssignmentSubmissions: (id) => request(`/assignments/${id}/submissions`),
  submitAssignment: (id, payload) => request(`/assignments/${id}/submit`, { method: 'POST', body: payload }),
  gradeSubmission: (id, payload) => request(`/assignments/submissions/${id}/grade`, { method: 'POST', body: payload }),

  // Certificates & Verification
  getMyCertificates: () => request('/certificates/me'),
  verifyCertificate: (certId) => request(`/certificates/verify/${certId}`),
  generateCertificate: (courseId) => request(`/certificates/generate/${courseId}`, { method: 'POST' }),

  // Analytics & Admin
  getAnalyticsDashboard: () => request('/analytics/dashboard'),
  exportAnalyticsCSV: () => `${API_BASE_URL}/analytics/export-csv${localStorage.getItem('velora_token') ? `?token=${localStorage.getItem('velora_token')}` : ''}`,

  // Notifications & Announcements
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  getAnnouncements: () => request('/announcements'),
  createAnnouncement: (annData) => request('/announcements', { method: 'POST', body: annData }),

  // Messaging & Notes & Bookmarks
  getConversations: () => request('/messages/conversations'),
  getMessageContacts: () => request('/messages/contacts'),
  getMessageThread: (userId) => request(`/messages/thread/${userId}`),
  sendMessage: (payload) => request('/messages/send', { method: 'POST', body: payload }),

  getNotes: () => request('/notes'),
  saveNote: (noteData) => request('/notes', { method: 'POST', body: noteData }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  getBookmarks: () => request('/bookmarks'),
  toggleBookmark: (itemId) => request('/bookmarks/toggle', { method: 'POST', body: { item_id: itemId, item_type: 'course' } }),

  // Uploads
  getCourseUploads: (courseId) => request(`/uploads/course/${courseId}`),
  uploadCourseFile: (courseId, formData) => {
    const payload = new FormData();
    const file = formData.get('file');
    payload.append('file', file);
    if (courseId) payload.append('course_id', courseId);
    if (formData.get('lesson_id')) payload.append('lesson_id', formData.get('lesson_id'));
    if (formData.get('resource_type')) payload.append('resource_type', formData.get('resource_type'));
    return request('/uploads/course', { method: 'POST', body: payload });
  },
  deleteUploadedFile: (id) => request(`/uploads/${id}`, { method: 'DELETE' }),

  // Search
  globalSearch: (q) => request(`/search?q=${encodeURIComponent(q)}`)
};
