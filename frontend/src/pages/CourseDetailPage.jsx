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
  const [assignments, setAssignments] = useState([]);
  const [submissionDrafts, setSubmissionDrafts] = useState({});
  const [submittingAssignment, setSubmittingAssignment] = useState(null);

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

      await fetchAssignments();
    } catch (e) {
      console.error(e);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.getAssignments(`course_id=${id}`);
      if (res.success) {
        setAssignments(res.assignments || []);
      }
    } catch (err) {
      console.error(err);
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

  const handleSubmitAssignment = async (assignmentId) => {
    const text = (submissionDrafts[assignmentId] || '').trim();

    if (!text) {
      toast.error('Please enter a submission before sending.');
      return;
    }

    setSubmittingAssignment(assignmentId);
    try {
      const res = await api.submitAssignment(assignmentId, { submission_text: text });
      if (res.success) {
        toast.success('Assignment submitted successfully.');
        await fetchAssignments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit assignment.');
    } finally {
      setSubmittingAssignment(null);
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
          backgroundColor: 'var(--surface-deep)',
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

      <div className="velora-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--primary)" /> Assignments & Practice Tasks
        </h3>

        {assignments.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {assignments.map((assignment) => (
              <div key={assignment.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', backgroundColor: 'var(--surface-deep)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{assignment.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {assignment.max_score || 100} points • {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'No deadline'}
                    </div>
                  </div>
                  {assignment.user_submission ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>
                      Submitted • {assignment.user_submission.status}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Not yet submitted</span>
                  )}
                </div>

                <div style={{ color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                  {assignment.description || 'No description provided.'}
                </div>

                {assignment.instructions ? (
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-main)' }}>Instructions:</strong> {assignment.instructions}
                  </div>
                ) : null}

                {isEnrolled ? (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      rows={4}
                      className="form-control"
                      value={submissionDrafts[assignment.id] ?? assignment.user_submission?.submission_text ?? ''}
                      onChange={(e) => setSubmissionDrafts(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                      placeholder="Write your assignment response here..."
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSubmitAssignment(assignment.id)}
                      disabled={submittingAssignment === assignment.id}
                      style={{ width: 'fit-content' }}
                    >
                      {submittingAssignment === assignment.id ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    Enroll in the course to submit this assignment.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>No assignments are available for this course yet.</div>
        )}
      </div>

      {/* SYLLABUS & MODULES */}
      <div className="velora-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--primary)" /> Course Syllabus & Micro-Lessons
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {course.modules?.map((mod, modIdx) => (
            <div key={mod.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-deep)', overflow: 'hidden' }}>
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
