import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/UIComponents';
import { Sparkles, ArrowRight, RefreshCw, BookOpen, User, CheckCircle } from 'lucide-react';

export default function RecommendationsPage() {
  const toast = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getMyRecommendations();
      if (res.success) {
        setRecommendations(res.recommendations || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch capacity recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateRecommendations();
      if (res.success) {
        toast.success(`Recommendation Engine updated! Generated ${res.generated_count} tailored pathways.`);
        fetchRecommendations();
      }
    } catch (e) {
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
            Adaptive Learning Path Engine
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Rules-Based Capacity Recommendations
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Intelligent mapping between your active skill gaps, career goals, and specialized micro-learning modules.
          </p>
        </div>

        <button onClick={handleGenerate} disabled={generating} className="btn btn-accent" style={{ gap: '0.5rem' }}>
          <Sparkles size={16} className={generating ? 'pulse-glow' : ''} />
          {generating ? 'Re-analyzing Pathways...' : 'Re-Generate Recommendations'}
        </button>
      </div>

      {/* RECOMMENDATION LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="pulse-glow" size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p>Generating personalized learning pathways...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {recommendations.map(rec => (
            <div key={rec.id} className="velora-card velora-card-interactive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Badge variant="primary">{rec.match_score || 95}% Match Index</Badge>
                  <Badge variant="warning">{rec.gap_reason || 'Skill Gap Deficit'}</Badge>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {rec.course_title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  <strong>Match Rationale:</strong> {rec.reason}
                </p>
              </div>

              <div>
                <Link to={`/courses/${rec.course_id}`} className="btn btn-primary">
                  Enroll Recommended Pathway <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
