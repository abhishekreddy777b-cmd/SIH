const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('velora_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API Request Failed');
    }

    return data;
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
  updateUserStatus: (id, status) => request(`/users/${id}/status`, { method: 'PUT', body: { status } }),

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
  createLesson: (lessonData) => request('/lessons', { method: 'POST', body: lessonData }),

  getLessonById: (id) => request(`/lessons/${id}`),
  completeLesson: (id, payload) => request(`/lessons/${id}/complete`, { method: 'POST', body: payload }),

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

  // Search
  globalSearch: (q) => request(`/search?q=${encodeURIComponent(q)}`)
};
