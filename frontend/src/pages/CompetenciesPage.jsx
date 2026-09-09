import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ProgressBar, Badge } from '../components/common/UIComponents';
import { Target, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, Shield } from 'lucide-react';

export default function CompetenciesPage() {
  const toast = useToast();
  const [competencies, setCompetencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const fetchCompetencies = async () => {
    setLoading(true);
    try {
      const res = await api.getTraineeCompetencies();
      if (res.success) {
        setCompetencies(res.competencies || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load competency framework');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ALL', ...new Set(competencies.map(c => c.category))];

  const filteredCompetencies = selectedCategory === 'ALL'
    ? competencies
    : competencies.filter(c => c.category === selectedCategory);

  const getLevelVariant = (level) => {
    switch (level?.toLowerCase()) {
      case 'advanced': return 'success';
      case 'intermediate': return 'primary';
      case 'developing': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
            MoES Official Skill Standards Framework
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Domain Competency Matrix
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time evaluation of technical, scientific, and operational proficiencies against MoES target benchmarks.
          </p>
        </div>

        <Link to="/assessments" className="btn btn-primary">
          Take Competency Assessment <ArrowRight size={16} />
        </Link>
      </div>

      {/* CATEGORY FILTERS */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* COMPETENCY GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="pulse-glow" size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p>Loading Competency Matrix...</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {filteredCompetencies.map(comp => {
            const currentScore = comp.current_score || 0;
            const targetScore = comp.target_score || 85;
            const hasGap = currentScore < targetScore;
            const gapAmount = targetScore - currentScore;

            return (
              <div key={comp.id} className="velora-card velora-card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <Badge variant={getLevelVariant(comp.proficiency_level)}>
                      {comp.proficiency_level || 'Beginner'}
                    </Badge>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--secondary)' }}>
                      {comp.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {comp.name}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {comp.description}
                  </p>

                  <div style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current Score: <strong style={{ color: 'var(--text-main)' }}>{currentScore}/100</strong></span>
                      <span style={{ color: 'var(--text-dim)' }}>MoES Target: <strong style={{ color: 'var(--secondary)' }}>{targetScore}/100</strong></span>
                    </div>

                    <ProgressBar progress={currentScore} height="8px" color={hasGap ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #06b6d4)'} />

                    {hasGap ? (
                      <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={12} /> Deficit Gap: {gapAmount} pts below benchmark
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle size={12} /> Meets MoES Benchmark Standard
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {hasGap ? (
                    <Link to="/skill-gaps" className="btn btn-sm btn-accent" style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem' }}>
                      View Skill Gap Solution
                    </Link>
                  ) : (
                    <Link to="/assessments" className="btn btn-sm btn-outline" style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem' }}>
                      Re-Test Competency
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
