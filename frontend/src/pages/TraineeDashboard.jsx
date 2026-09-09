import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { StatCard, ProgressBar, Badge } from '../components/common/UIComponents';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  Gauge, BookMarked, FileCheck, Clock, TrendingUp, Video, ArrowRight, AlertTriangle, RefreshCw, Zap, Send, Sparkles
} from 'lucide-react';

export default function ScientistDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [skillGaps, setSkillGaps] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [gapsRes, enrollRes, compRes, recRes, liveRes] = await Promise.all([
        api.getMySkillGaps(),
        api.getMyEnrollments(),
        api.getTraineeCompetencies(),
        api.getMyRecommendations(),
        api.getLiveClasses()
      ]);

      if (gapsRes.success) setSkillGaps(gapsRes.skillGaps || gapsRes.skill_gaps || []);
      if (enrollRes.success) setEnrollments(enrollRes.enrollments || []);
      if (compRes.success) setCompetencies(compRes.competencies || []);
      if (recRes.success) setRecommendations(recRes.course_recommendations || recRes.recommendations || []);
      if (liveRes.success) setLiveClasses(liveRes.classes || liveRes.live_classes || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateGaps = async () => {
    try {
      const res = await api.calculateSkillGaps();
      if (res.success) {
        toast.success(`Skill Gap Engine executed: ${res.stats?.total_gaps || 'gaps'} active gaps identified.`);
        const gapsRes = await api.getMySkillGaps();
        if (gapsRes.success) setSkillGaps(gapsRes.skillGaps || gapsRes.skill_gaps || []);
      }
    } catch (e) {
      toast.error('Error executing Skill Gap calculation');
    }
  };

  // Format data for Radar Chart
  const radarData = competencies.slice(0, 6).map(c => {
    const name = c.name || c.competency_name || 'Competency';
    return {
      subject: name.length > 16 ? name.substring(0, 16) + '...' : name,
      current: c.current_score || c.score || 50,
      target: c.target_score || 85,
      fullMark: 100
    };
  });

  const activeGapsCount = skillGaps.filter(g => g.status === 'active').length;
  const avgCompetencyScore = competencies.length > 0
    ? Math.round(competencies.reduce((acc, curr) => acc + (curr.current_score || 0), 0) / competencies.length)
    : 72;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
        <RefreshCw className="pulse-glow" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading your Capacity Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* WELCOME BANNER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>
            {user?.department || 'MoES / IMD Specialist'}
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0' }}>
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Designation: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{user?.designation || 'Trainee Officer'}</span> • Your capacity development plan is 65% complete.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleRecalculateGaps} className="btn btn-sm btn-outline" style={{ gap: '0.35rem' }}>
            <RefreshCw size={14} /> Recalculate Gaps
          </button>
          <Link to="/courses" className="btn btn-sm btn-primary">
            Explore Courses <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid-cols-4">
        <StatCard
          icon={Gauge}
          title="Competency Index"
          value={`${avgCompetencyScore}%`}
          subtitle="Current average score"
          color="#0066cc"
        />
        <StatCard
          icon={AlertTriangle}
          title="Active Gaps"
          value={activeGapsCount}
          subtitle="Below benchmark threshold"
          color={activeGapsCount > 0 ? "#ff9900" : "#00b386"}
        />
        <StatCard
          icon={BookMarked}
          title="Enrolled Courses"
          value={enrollments.length}
          subtitle="Active learning tracks"
          color="#00a8cc"
        />
        <StatCard
          icon={Clock}
          title="Training Hours"
          value={`${user?.learning_hours || 18.5}h`}
          subtitle="Logged engagement"
          color="#0099ff"
        />
      </div>

      {/* SKILL GAP ALERT BANNER */}
      {activeGapsCount > 0 && (
        <div className="velora-card" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertTriangle size={24} color="var(--warning)" />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {activeGapsCount} Skill Gaps Identified Below MoES Benchmark Target
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Target proficiency gap requires targeted training in: {skillGaps.slice(0, 2).map(g => g.competency_name).join(', ')}
                </p>
              </div>
            </div>
            <Link to="/skill-gaps" className="btn btn-sm btn-accent">
              View & Resolve Skill Gaps <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN DASHBOARD CONTENT */}
      <div className="grid-cols-2" style={{ gap: '1.5rem' }}>

        {/* LEFT COLUMN: COMPETENCY RADAR & ACTIVE ENROLLMENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* RADAR CHART CARD */}
          <div className="velora-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge size={18} color="var(--primary)" /> Competency Profile
              </h3>
              <Link to="/competencies" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>View Details →</Link>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--border-highlight)" />
                  <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--border-color)" />
                  <Radar name="Current Score" dataKey="current" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                  <Radar name="Target Benchmark" dataKey="target" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.15} strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-highlight)', borderRadius: '8px', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span> Current Score</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px dashed var(--secondary)' }}></span> MoES Target</span>
            </div>
          </div>

          {/* MY ENROLLED COURSES */}
          <div className="velora-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookMarked size={18} color="var(--secondary)" /> Active Learning Tracks
              </h3>
              <Link to="/courses" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Browse All →</Link>
            </div>

            {enrollments.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No active enrollments. Explore capacity recommendations below to get started.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {enrollments.slice(0, 3).map(en => (
                  <div key={en.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{en.course_title}</h4>
                      <Badge variant={en.progress_percentage === 100 ? 'success' : 'primary'}>
                        {en.progress_percentage === 100 ? '✓ Complete' : `${en.progress_percentage}%`}
                      </Badge>
                    </div>
                    <ProgressBar progress={en.progress_percentage} height="6px" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Trainer: {en.trainer_name}</span>
                      <Link to={`/courses/${en.course_id}`} className="btn btn-sm btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Continue Lesson
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CAPACITY RECOMMENDATIONS & UPCOMING LIVE CLASSES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Recommendations */}
          <div className="velora-card gradient-border-top">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--accent)" /> Capacity Recommendations
              </h3>
              <Link to="/recommendations" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>View All →</Link>
            </div>

            {recommendations.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No recommendations generated. Run skill gap assessment!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {recommendations.slice(0, 3).map(rec => (
                  <div key={rec.id} style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Badge variant="warning">{rec.gap_reason || 'Target Skill Deficit'}</Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                        {rec.match_score || 95}% Match
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      {rec.course_title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {rec.reason}
                    </p>
                    <Link to={`/courses/${rec.course_id}`} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      Enroll Recommended Course
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING LIVE CLASSROOM */}
          <div className="velora-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={18} color="var(--success)" /> Live Virtual Classrooms
              </h3>
              <Link to="/live-classes" style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Schedule →</Link>
            </div>

            {liveClasses.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No live sessions scheduled today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {liveClasses.slice(0, 2).map(lc => (
                  <div key={lc.id} style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: '#0f172a', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: lc.status === 'live' ? 'var(--danger)' : 'var(--success)' }} className={lc.status === 'live' ? 'pulse-glow' : ''}></span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: lc.status === 'live' ? 'var(--danger)' : 'var(--success)', textTransform: 'uppercase' }}>
                          {lc.status === 'live' ? 'LIVE NOW' : 'UPCOMING'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.25rem 0 0.1rem' }}>{lc.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trainer: {lc.trainer_name}</span>
                    </div>
                    <Link to={`/live-classes/${lc.id}`} className={`btn btn-sm ${lc.status === 'live' ? 'btn-danger' : 'btn-secondary'}`} style={{ fontSize: '0.75rem' }}>
                      {lc.status === 'live' ? 'Join Live Stream' : 'View Hub'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
