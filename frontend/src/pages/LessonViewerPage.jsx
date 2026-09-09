import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  PlayCircle, CheckCircle, ArrowLeft, ArrowRight, FileText, Save, Video, BookOpen, Clock, ChevronRight
} from 'lucide-react';

export default function LessonViewerPage() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [id]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const res = await api.getLessonById(id);
      if (res.success) {
        setLesson(res.lesson);
        setIsCompleted(res.lesson.is_completed || false);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load lesson content');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    setCompleting(true);
    try {
      const res = await api.completeLesson(id, { watch_time_mins: lesson.duration_mins || 20 });
      if (res.success) {
        toast.success(`Lesson marked as completed! Course progress updated to ${res.course_progress}%.`);
        setIsCompleted(true);
      }
    } catch (e) {
      toast.error('Failed to complete lesson');
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    try {
      const res = await api.saveNote({
        title: `Note: ${lesson.title}`,
        content: noteContent,
        course_id: lesson.course_id
      });
      if (res.success) {
        toast.success('Study note saved to your Personal Notebook!');
        setNoteContent('');
      }
    } catch (e) {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading || !lesson) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading classroom lesson...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* TOP NAVIGATION BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/courses/${lesson.course_id}`} className="btn btn-sm btn-secondary">
          <ArrowLeft size={14} /> Back to Course Syllabus
        </Link>

        <button
          onClick={handleCompleteLesson}
          disabled={completing || isCompleted}
          className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
        >
          {isCompleted ? (
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={14} /> Completed
            </span>
          ) : completing ? 'Updating...' : 'Mark Lesson Complete'}
        </button>
      </div>

      {/* MAIN TWO COLUMN VIEW */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* LEFT COLUMN: LESSON MEDIA & TEXT CONTENT */}
        <div style={{ flex: 2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* VIDEO / STREAM PLAYER MOCKUP */}
          <div className="velora-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-highlight)' }}>
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#030712',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'radial-gradient(ellipse at center, #1e293b 0%, #030712 100%)'
            }}>
              <Video size={56} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {lesson.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                MoES Interactive Video Stream • Duration: {lesson.duration_mins} mins
              </p>

              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 1rem', borderRadius: '8px', backdropFilter: 'blur(8px)' }}>
                <PlayCircle size={24} color="var(--primary)" style={{ cursor: 'pointer' }} />
                <div style={{ flex: 1, height: '4px', backgroundColor: '#374151', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-main)' }}>08:30 / {lesson.duration_mins}:00</span>
              </div>
            </div>
          </div>

          {/* LESSON WRITTEN MATERIAL */}
          <div className="velora-card">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
              {lesson.title}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {lesson.content_body || 'This lesson provides comprehensive domain instruction on key meteorology concepts.'}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STUDY NOTES & RESOURCES */}
        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* PERSONAL STUDY NOTES DRAWER */}
          <div className="velora-card gradient-border-top">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--accent)" /> Quick Study Note
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
              Jot down key takeaways. Notes are saved instantly to your personal notebook.
            </p>

            <textarea
              className="form-control"
              rows={5}
              placeholder="e.g. Remember to check radar Doppler velocity profiles during severe thunderstorm warnings..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}
            />

            <button
              onClick={handleSaveNote}
              disabled={savingNote || !noteContent.trim()}
              className="btn btn-sm btn-accent"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Save size={14} /> {savingNote ? 'Saving...' : 'Save to Notebook'}
            </button>
          </div>

          {/* COMPETENCY IMPACT SUMMARY */}
          <div className="velora-card">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              🎯 Target Competency Boost
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Completing this lesson contributes directly toward resolving active skill gaps and increasing your official MoES Competency Score!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
