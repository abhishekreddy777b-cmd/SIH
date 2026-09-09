import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PlusCircle, ArrowLeft, BookOpen, Save, Layers } from 'lucide-react';

export default function CourseBuilderPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [competencies, setCompetencies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    category: 'Materials Characterization',
    difficulty: 'intermediate',
    duration_hours: 4,
    description: '',
    competency_id: 1,
    prerequisites: 'Basic scientific background'
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
      const payload = {
        title: formData.title,
        short_description: formData.short_description || formData.description?.slice(0, 160) || '',
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        duration_hours: Number(formData.duration_hours) || 4,
        max_students: 100,
        is_free: 1,
        competencies: [Number(formData.competency_id)].filter(Boolean)
      };

      const res = await api.createCourse(payload);
      if (res.success) {
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

          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Materials Characterization">Materials Characterization</option>
                <option value="Microstructural Analysis">Microstructural Analysis</option>
                <option value="Surface Engineering">Surface Engineering</option>
                <option value="Scientific Data Analysis">Scientific Data Analysis</option>
                <option value="Laboratory Safety">Laboratory Safety</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select
                className="form-control"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
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
            <label className="form-label">Short Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="Brief overview for course listings"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            />
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
