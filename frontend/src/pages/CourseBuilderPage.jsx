import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PlusCircle, ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function CourseBuilderPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [competencies, setCompetencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState([
    { title: '', content_type: 'reading', content_text: '', content_url: '', duration_minutes: 15 }
  ]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Numerical Weather Prediction',
    level: 'intermediate',
    duration_hours: 4,
    description: '',
    competency_id: 1,
    prerequisites: 'Basic Meteorology'
  });

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const fetchCompetencies = async () => {
    try {
      const res = await api.getCompetencies();
      if (res.success) {
        setCompetencies(res.competencies || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createCourse(formData);
      if (res.success) {
        for (const lesson of lessons.filter(item => item.title.trim())) {
          await api.createLesson({ ...lesson, module_id: res.module_id });
        }
        toast.success('Course created successfully!');
        navigate('/trainer');
      }
    } catch (err) {
      toast.error(err.message || 'Course creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Link to="/trainer" className="btn btn-sm btn-secondary" style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} /> Back to Trainer Portal
      </Link>

      <div className="velora-card gradient-border-top">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Create MoES Capacity Micro-Course</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Publish specialized training modules aligned with official MoES competency frameworks.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="form-label">Course Title</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Operational WRF Model Diagnostics & Severe Storm Forecasting"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Study Materials & Tests</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lessons.map((lesson, index) => (
                <div key={index} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                    <input className="form-control" placeholder="Lesson or test title" value={lesson.title} onChange={e => setLessons(prev => prev.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} />
                    <select className="form-control" value={lesson.content_type} onChange={e => setLessons(prev => prev.map((item, i) => i === index ? { ...item, content_type: e.target.value } : item))}>
                      <option value="reading">Reading Material</option>
                      <option value="document">Document</option>
                      <option value="video">Video</option>
                      <option value="quiz">Quiz / Test</option>
                      <option value="assignment">Assignment</option>
                    </select>
                  </div>
                  <textarea className="form-control" rows={2} placeholder="Instructions, questions, or study content" value={lesson.content_text} onChange={e => setLessons(prev => prev.map((item, i) => i === index ? { ...item, content_text: e.target.value } : item))} style={{ marginTop: '0.75rem' }} />
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <input className="form-control" placeholder="Resource URL (optional)" value={lesson.content_url} onChange={e => setLessons(prev => prev.map((item, i) => i === index ? { ...item, content_url: e.target.value } : item))} />
                    <input className="form-control" type="number" min="1" placeholder="Minutes" value={lesson.duration_minutes} onChange={e => setLessons(prev => prev.map((item, i) => i === index ? { ...item, duration_minutes: parseInt(e.target.value) || 1 } : item))} style={{ maxWidth: '120px' }} />
                    {lessons.length > 1 && <button type="button" className="btn btn-sm btn-outline" onClick={() => setLessons(prev => prev.filter((_, i) => i !== index))} title="Remove item"><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setLessons(prev => [...prev, { title: '', content_type: 'reading', content_text: '', content_url: '', duration_minutes: 15 }])}>
                <PlusCircle size={14} /> Add Material or Test
              </button>
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Numerical Weather Prediction">Numerical Weather Prediction</option>
                <option value="Radar Meteorology">Radar Meteorology</option>
                <option value="Satellite Meteorology">Satellite Meteorology</option>
                <option value="Oceanographic Modeling">Oceanographic Modeling</option>
                <option value="Seismology & Tsunami Warning">Seismology & Tsunami Warning</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select
                className="form-control"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Competency</label>
              <select
                className="form-control"
                value={formData.competency_id}
                onChange={(e) => setFormData({ ...formData, competency_id: parseInt(e.target.value) })}
              >
                {competencies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Hours)</label>
              <input
                type="number"
                required
                className="form-control"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course Description & Learning Objectives</label>
            <textarea
              required
              rows={4}
              className="form-control"
              placeholder="Provide a comprehensive summary of skills acquired..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <Save size={18} /> {loading ? 'Publishing Course...' : 'Publish Course to Catalog'}
          </button>
        </form>
      </div>

    </div>
  );
}
