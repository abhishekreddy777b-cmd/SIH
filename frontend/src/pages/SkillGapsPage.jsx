import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge, ProgressBar } from '../components/common/UIComponents';
import {
  Target, AlertTriangle, RefreshCw, CheckCircle, Sparkles, ArrowRight, UserCheck, BookOpen
} from 'lucide-react';

export default function SkillGapsPage() {
  const toast = useToast();
  const [skillGaps, setSkillGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchSkillGaps();
  }, []);

  const fetchSkillGaps = async () => {
    setLoading(true);
    try {
      const res = await api.getMySkillGaps();
      if (res.success) {
        setSkillGaps(res.skill_gaps || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load skill gaps');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCalculation = async () => {
    setCalculating(true);
    try {
      const res = await api.calculateSkillGaps();
      if (res.success) {
        toast.success(`Skill Gap Analysis Executed: Identified ${res.gaps_found} active competency gaps!`);
        fetchSkillGaps();
      }
    } catch (e) {
      toast.error('Failed to run skill gap calculation');
    } finally {
      setCalculating(false);
    }
  };

  const handleResolveGap = async (gapId) => {
    try {
      const res = await api.resolveSkillGap(gapId);
      if (res.success) {
        toast.success('Skill gap marked as resolved!');
        fetchSkillGaps();
      }
    } catch (e) {
      toast.error('Failed to resolve skill gap');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>
            Skill Gap Analyzer Engine
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Targeted Skill Gap Resolution
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Automatically identifies score deficits against MoES operational target benchmarks and constructs targeted resolution pathways.
          </p>
        </div>

        <button
          onClick={handleRunCalculation}
          disabled={calculating}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={calculating ? 'pulse-glow' : ''} />
          {calculating ? 'Executing Gap Analysis...' : 'Run Gap Engine Now'}
        </button>
      </div>

      {/* ACTIVE GAPS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="pulse-glow" size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p>Analyzing active skill gaps...</p>
        </div>
      ) : skillGaps.length === 0 ? (
        <div className="velora-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>No Active Skill Gaps!</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Congratulations! All your assessed competency scores meet or exceed MoES benchmark targets.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {skillGaps.map(gap => {
            const gapVal = gap.gap_score !== undefined ? gap.gap_score : (gap.gap !== undefined ? gap.gap : 0);
            const gapSeverity = gapVal > 25 ? 'High Deficit' : gapVal > 15 ? 'Moderate' : 'Minor';
            const badgeVariant = gapVal > 25 ? 'danger' : gapVal > 15 ? 'warning' : 'primary';

            return (
              <div key={gap.id} className="velora-card velora-card-glass" style={{ borderLeft: `4px solid ${gapVal > 25 ? 'var(--danger)' : 'var(--warning)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>

                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Badge variant={badgeVariant}>{gapSeverity}</Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Category: {gap.category || 'Competency Gap'}</span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                      {gap.competency_name || gap.name || 'Domain Competency'}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Target Score: <strong style={{ color: 'var(--secondary)' }}>{gap.target_score || 80}</strong> | Current Score: <strong style={{ color: 'var(--text-main)' }}>{gap.current_score || 0}</strong> | Gap Deficit: <strong style={{ color: '#f87171' }}>-{gapVal} pts</strong>
                    </p>

                    <div style={{ marginTop: '0.75rem', maxWidth: '400px' }}>
                      <ProgressBar progress={gap.current_score || 0} height="8px" color="linear-gradient(90deg, #f59e0b, #ef4444)" />
                    </div>
                  </div>

                  {/* RECOMMENDATION ACTION BOX */}
                  <div style={{
                    backgroundColor: 'var(--surface-deep)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    minWidth: '280px',
                    flex: 1,
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      <Sparkles size={14} /> Recommended Resolution:
                    </div>

                    {gap.recommended_course_id ? (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Course: {gap.recommended_course_title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Trainer: {gap.recommended_trainer_name}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <Link to={`/courses/${gap.recommended_course_id}`} className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem' }}>
                            Enroll Course Now <ArrowRight size={12} />
                          </Link>
                          <button onClick={() => handleResolveGap(gap.id)} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Take targeted training course or consult a domain specialist trainer.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <Link to="/courses" className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem' }}>
                            Find Course
                          </Link>
                          <button onClick={() => handleResolveGap(gap.id)} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
