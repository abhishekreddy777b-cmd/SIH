import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatCard, Badge, ProgressBar } from '../components/common/UIComponents';
import { BookOpen, Users, PlusCircle, CheckCircle, Star, MessageSquare, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';

export default function TrainerDashboard() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  useEffect(() => {
    fetchTrainerCourses();
  }, []);

  const fetchTrainerCourses = async () => {
    setLoading(true);
    try {
      const res = await api.getTrainerCourses();
      if (res.success) {
        setCourses(res.courses || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load trainer portal data');
    } finally {
      setLoading(false);
    }
  };

  const totalTrainees = courses.reduce((acc, curr) => acc + (Number(curr.enrolled_count) || 0), 0);

  const deleteCourse = async () => {
    if (!courseToDelete) return;

    setDeletingCourseId(courseToDelete.id);
    try {
      const res = await api.deleteCourse(courseToDelete.id);
      if (res.success) {
        setCourses((currentCourses) => currentCourses.filter((course) => course.id !== courseToDelete.id));
        toast.success('Micro-course deleted successfully.');
        setCourseToDelete(null);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to delete micro-course');
    } finally {
      setDeletingCourseId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
            Domain Specialist Trainer Portal
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Trainer Management Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Curate specialized MoES learning tracks, manage trainees, and track capacity development metrics.
          </p>
        </div>

        <Link to="/trainer/courses/new" className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <PlusCircle size={16} /> Create New Micro-Course
        </Link>
      </div>

      {/* STAT CARDS */}
      <div className="grid-cols-3">
        <StatCard
          icon={BookOpen}
          title="Courses Authored"
          value={courses.length}
          subtitle="Active learning modules"
          color="#34d399"
        />
        <StatCard
          icon={Users}
          title="Active Trainees"
          value={totalTrainees}
          subtitle="Enrolled MoES personnel"
          color="#3b82f6"
        />
        <StatCard
          icon={Star}
          title="Avg Trainer Rating"
          value="4.9 / 5.0"
          subtitle="Trainee evaluation score"
          color="#fbbf24"
        />
      </div>

      {/* MANAGED COURSES TABLE / LIST */}
      <div className="velora-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--success)" /> My Authored Micro-Courses
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            <RefreshCw className="pulse-glow" size={24} style={{ margin: '0 auto 0.5rem' }} />
            <p>Loading course metrics...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {courses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                No courses created yet.
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: '#0f172a', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Badge variant="primary">{course.category}</Badge>
                      <Badge variant="success">{course.level}</Badge>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{course.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Target Competency: <strong style={{ color: 'var(--secondary)' }}>{course.competency_name || 'Not assigned'}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Enrolled</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{Number(course.enrolled_count) || 0}</strong>
                    </div>
                    <Link to={`/courses/${course.id}`} className="btn btn-sm btn-outline">
                      View Course <ArrowRight size={14} />
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                      onClick={() => setCourseToDelete(course)}
                      disabled={deletingCourseId === course.id}
                      aria-label={`Delete ${course.title}`}
                      title="Delete micro-course"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {courseToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-course-title"
          className="velora-card"
          style={{ border: '1px solid var(--danger)', position: 'fixed', right: '2rem', bottom: '2rem', zIndex: 20, width: 'min(420px, calc(100vw - 2rem))', boxShadow: '0 18px 45px rgba(0, 0, 0, 0.35)' }}
        >
          <h2 id="delete-course-title" style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Delete micro-course?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            This will permanently delete <strong>{courseToDelete.title}</strong>, including its modules and lessons.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCourseToDelete(null)} disabled={Boolean(deletingCourseId)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={deleteCourse} disabled={Boolean(deletingCourseId)}>
              {deletingCourseId ? 'Deleting...' : 'Delete course'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
