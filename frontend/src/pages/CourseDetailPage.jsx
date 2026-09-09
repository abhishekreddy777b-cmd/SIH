import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge, ProgressBar } from '../components/common/UIComponents';
import {
  BookOpen, Clock, User, Star, CheckCircle, ArrowRight, PlayCircle, Lock, Shield, FileText, ChevronRight
} from 'lucide-react';

export default function CourseDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const [res, enrollRes] = await Promise.all([
        api.getCourseById(id),
        api.getMyEnrollments()
      ]);

      if (res.success) {
        setCourse(res.course);
      }

      if (enrollRes.success) {
        const enrolled = enrollRes.enrollments.some(e => e.course_id === parseInt(id));
        setIsEnrolled(enrolled);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await api.enrollCourse(id);
      if (res.success) {
        toast.success('Successfully enrolled in course!');
        setIsEnrolled(true);
      }
    } catch (e) {
      toast.error(e.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || !course) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading course syllabus...</div>;
  }

  const firstLessonId = course.modules?.[0]?.lessons?.[0]?.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* BANNER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Badge variant="primary">{course.category}</Badge>
            <Badge variant={course.level === 'advanced' ? 'danger' : 'success'}>{course.level}</Badge>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
              MoES Verified Module
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            {course.title}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {course.description}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-main)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={16} color="var(--primary)" /> {course.duration_hours} Training Hours</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><User size={16} color="var(--secondary)" /> {course.trainer_name} ({course.trainer_designation || 'IMD Senior Specialist'})</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24' }}><Star size={16} fill="#fbbf24" /> {course.rating || 4.9} Rating</span>
          </div>
        </div>

        {/* ENROLLMENT ACTION BOX */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          minWidth: '280px',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status: {isEnrolled ? 'Active Enrolled Trainee' : 'Open for Enrollment'}</div>
          {isEnrolled ? (
            <div>
              <div style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                <CheckCircle size={18} /> You are enrolled!
              </div>
              {firstLessonId && (
                <Link to={`/lessons/${firstLessonId}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Start Learning Now <ArrowRight size={16} />
                </Link>
              )}
            </div>
          ) : (
            <div>
              <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}>
                {enrolling ? 'Enrolling...' : 'Enroll in Course'}
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                Free access for MoES / IMD personnel & registered trainees
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SYLLABUS & MODULES */}
      <div className="velora-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--primary)" /> Course Syllabus & Micro-Lessons
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {course.modules?.map((mod, modIdx) => (
            <div key={mod.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: '#0f172a', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', fontWeight: 700, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Module {modIdx + 1}: {mod.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mod.lessons?.length || 0} Lessons</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {mod.lessons?.map((les, lesIdx) => (
                  <div key={les.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', borderBottom: lesIdx === mod.lessons.length - 1 ? 'none' : '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <PlayCircle size={18} color="var(--primary)" />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{les.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{les.duration_mins} mins • {les.content_type?.toUpperCase()}</div>
                      </div>
                    </div>

                    {isEnrolled ? (
                      <Link to={`/lessons/${les.id}`} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem' }}>
                        Start Lesson <ChevronRight size={14} />
                      </Link>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Lock size={12} /> Enroll to Unlock
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
