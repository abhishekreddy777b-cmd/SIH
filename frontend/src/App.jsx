import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TraineeDashboard from './pages/TraineeDashboard';
import CompetenciesPage from './pages/CompetenciesPage';
import SkillGapsPage from './pages/SkillGapsPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonViewerPage from './pages/LessonViewerPage';
import AssessmentEnginePage from './pages/AssessmentEnginePage';
import TakeAssessmentPage from './pages/TakeAssessmentPage';
import RecommendationsPage from './pages/RecommendationsPage';
import LiveClassroomPage from './pages/LiveClassroomPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import TrainerDashboard from './pages/TrainerDashboard';
import CourseBuilderPage from './pages/CourseBuilderPage';
import AdminDashboard from './pages/AdminDashboard';
import MessagingPage from './pages/MessagingPage';
import NotesPage from './pages/NotesPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PersonnelPage from './pages/PersonnelPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function MainLayout({ children, fullWidth = false }) {
  const { user } = useAuth();
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-layout">
        {user && <Sidebar />}
        <main className={fullWidth || !user ? 'content-area-full' : 'content-area'}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainLayout fullWidth><LandingPage /></MainLayout>} />
            <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
            <Route path="/register" element={<MainLayout><RegisterPage /></MainLayout>} />
            <Route path="/certificates/verify/:certId" element={<MainLayout><CertificateVerifyPage /></MainLayout>} />

            {/* Protected Trainee & Shared Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><MainLayout><TraineeDashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/competencies" element={<ProtectedRoute><MainLayout><CompetenciesPage /></MainLayout></ProtectedRoute>} />
            <Route path="/skill-gaps" element={<ProtectedRoute><MainLayout><SkillGapsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><MainLayout><CoursesPage /></MainLayout></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><MainLayout><CourseDetailPage /></MainLayout></ProtectedRoute>} />
            <Route path="/lessons/:id" element={<ProtectedRoute><MainLayout><LessonViewerPage /></MainLayout></ProtectedRoute>} />
            <Route path="/assessments" element={<ProtectedRoute><MainLayout><AssessmentEnginePage /></MainLayout></ProtectedRoute>} />
            <Route path="/assessments/:id" element={<ProtectedRoute><MainLayout><TakeAssessmentPage /></MainLayout></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><MainLayout><RecommendationsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/live-classes" element={<ProtectedRoute><MainLayout><LiveClassroomPage /></MainLayout></ProtectedRoute>} />
            <Route path="/live-classes/:id" element={<ProtectedRoute><MainLayout><LiveClassroomPage /></MainLayout></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><MainLayout><CertificatesPage /></MainLayout></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MainLayout><MessagingPage /></MainLayout></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><MainLayout><NotesPage /></MainLayout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><MainLayout><NotificationsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute allowedRoles={['trainee', 'trainer', 'admin']}><MainLayout><AnnouncementsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><MainLayout><UserProfilePage /></MainLayout></ProtectedRoute>} />

            {/* Trainer Routes */}
            <Route path="/trainer" element={<ProtectedRoute allowedRoles={['trainer', 'admin']}><MainLayout><TrainerDashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/trainer/courses/new" element={<ProtectedRoute allowedRoles={['trainer', 'admin']}><MainLayout><CourseBuilderPage /></MainLayout></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout><AdminDashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout><PersonnelPage /></MainLayout></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout><AnnouncementsPage /></MainLayout></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
