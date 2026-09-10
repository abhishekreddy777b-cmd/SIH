import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/UIComponents';
import {
  Clock, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Award, Shield, RefreshCw
} from 'lucide-react';

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins default
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [id]);

  useEffect(() => {
    if (!loading && !result && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, result, timeLeft]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getAssessmentById(id);
      if (res.success) {
        setAssessment(res.assessment);
        setTimeLeft((res.assessment.time_limit_mins || 10) * 60);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load assessment questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.keys(answers).map(qId => ({
        question_id: parseInt(qId),
        selected_option: answers[qId]
      }));

      const res = await api.submitAssessment(id, { answers: formattedAnswers });
      if (res.success) {
        setResult(res);
        toast.success(`Assessment submitted! Score: ${res.score_percentage}%`);
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !assessment) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading assessment environment...</div>;
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // IF RESULT RETURNED, SHOW SCORE CARD REPORT
  if (result) {
    return (
      <div style={{ maxWidth: '680px', margin: '2rem auto', width: '100%' }}>
        <div className="velora-card gradient-border-top" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          {result.passed ? (
            <CheckCircle size={56} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
          ) : (
            <AlertTriangle size={56} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
          )}

          <Badge variant={result.passed ? 'success' : 'danger'} style={{ fontSize: '0.875rem', padding: '0.35rem 0.875rem', marginBottom: '1rem' }}>
            {result.passed ? 'ASSESSMENT PASSED' : 'BENCHMARK NOT MET'}
          </Badge>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Your Score: {result.score_percentage}%
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Correct Answers: {result.score} out of {result.total_questions} questions.
          </p>

          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Answer Review</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(result.answer_review || []).map((answer, index) => {
                const selected = answer.selected_answer === null || answer.selected_answer === undefined
                  ? 'Not answered'
                  : answer.options?.[answer.selected_answer] ?? answer.selected_answer;
                return (
                  <div key={answer.question_id} style={{ padding: '0.85rem', border: `1px solid ${answer.is_correct ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 'var(--radius-md)', backgroundColor: '#0f172a' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{index + 1}. {answer.question_text}</div>
                    <div style={{ fontSize: '0.78rem', color: answer.is_correct ? 'var(--success)' : 'var(--danger)' }}>Your answer: {selected}</div>
                    {!answer.is_correct && <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.25rem' }}>Correct answer: {answer.correct_answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '2rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.35rem' }}>
              ⚡ Dynamic Competency Engine Status:
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>
              {result.competency_updated
                ? `Competency Score automatically updated to ${result.competency_updated.new_score}/100!`
                : 'Competency records synchronized with MoES Database.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/competencies" className="btn btn-primary">
              View Competency Matrix
            </Link>
            <Link to="/skill-gaps" className="btn btn-secondary">
              View Skill Gap Analysis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* TIMED TOP BAR */}
      <div className="velora-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
            {assessment.category} Test
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{assessment.title}</h2>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#0f172a',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          color: timeLeft < 120 ? 'var(--danger)' : '#fff',
          fontWeight: 700
        }}>
          <Clock size={16} />
          <span>Timer: {timeFormatted}</span>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {assessment.questions?.map((q, qIdx) => (
          <div key={q.id} className="velora-card">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {qIdx + 1}
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {q.question_text}
              </h3>
            </div>

            {/* MCQ OPTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '2.25rem' }}>
              {q.options?.map((opt, optIdx) => {
                const isSelected = answers[q.id] === optIdx;
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(q.id, optIdx)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : '#0f172a',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'var(--transition)'
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: '0.5rem', color: isSelected ? 'var(--primary)' : 'var(--text-dim)' }}>
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* SUBMIT BUTTON */}
      <div style={{ textAlign: 'right', marginTop: '1rem' }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn btn-primary btn-lg"
        >
          {submitting ? 'Evaluating Test...' : 'Submit Assessment Test'}
        </button>
      </div>

    </div>
  );
}
