import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/UIComponents';
import {
  CheckSquare, Clock, HelpCircle, Award, ArrowRight, RefreshCw, CheckCircle, AlertTriangle
} from 'lucide-react';

export default function AssessmentEnginePage() {
  const toast = useToast();
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessmentData();
  }, []);

  const fetchAssessmentData = async () => {
    setLoading(true);
    try {
      const [assRes, attRes] = await Promise.all([
        api.getAssessments(),
        api.getMyAttempts()
      ]);

      if (assRes.success) setAssessments(assRes.assessments || []);
      if (attRes.success) setAttempts(attRes.attempts || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load assessments catalog');
    } finally {
      setLoading(false);
    }
  };

  const getAttemptForAssessment = (assId) => {
    return attempts.find(a => a.assessment_id === assId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
            MoES Automated Evaluation Engine
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Competency Assessment Engine
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Timed examinations measuring technical mastery to automatically calibrate skill gap profiles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#0f172a', border: '1px solid var(--border-color)', fontSize: '0.8125rem' }}>
            Attempts Logged: <strong style={{ color: 'var(--text-main)' }}>{attempts.length}</strong>
          </div>
        </div>
      </div>

      {/* ASSESSMENTS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="pulse-glow" size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p>Loading Assessment Engine...</p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {assessments.map(ass => {
            const attempt = getAttemptForAssessment(ass.id);
            return (
              <div key={ass.id} className="velora-card velora-card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <Badge variant="primary">{ass.category}</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                      Passing score: {ass.passing_score}%
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {ass.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {ass.description}
                  </p>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> {ass.time_limit_mins} Minutes</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><HelpCircle size={14} /> {ass.total_questions || 5} Questions</span>
                  </div>
                </div>

                <div>
                  {attempt ? (
                    <div style={{ backgroundColor: '#0f172a', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Last Attempt Score</span>
                        <strong style={{ fontSize: '1.1rem', color: attempt.passed ? '#34d399' : '#f87171' }}>{attempt.score_percentage}%</strong>
                      </div>
                      <Badge variant={attempt.passed ? 'success' : 'danger'}>
                        {attempt.passed ? 'PASSED' : 'RE-TAKE REQUIRED'}
                      </Badge>
                    </div>
                  ) : null}

                  <Link to={`/assessments/${ass.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {attempt ? 'Retake Skill Assessment' : 'Start Assessment Test'} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
