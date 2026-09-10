import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatCard, Badge } from '../components/common/UIComponents';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Shield, Users, BookOpen, Download, ArrowRight, Award, Megaphone, UserRound, ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [topGaps, setTopGaps] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalyticsDashboard();
      if (res.success) {
        setMetrics(res.metrics || {});
        setTopGaps(res.top_skill_gaps || []);
        setDeptStats(res.department_breakdown || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load directorate analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading || !metrics) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading MoES Executive Analytics...</div>;
  }

  const divisionData = deptStats.map(d => ({
    name: d.department.length > 15 ? d.department.substring(0, 15) + '...' : d.department,
    trainees: d.trainee_count
  }));

  const categoryGapData = topGaps.slice(0, 5).map(g => {
    const name = g.competency_name || g.name || 'Competency Gap';
    return {
      name: name.length > 16 ? name.substring(0, 16) + '...' : name,
      value: g.affected_trainees || g.gap_count || 1
    };
  });

  return (
    <div className="director-shell" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* EXECUTIVE HEADER */}
      <div className="velora-card director-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', padding: '1.75rem' }}>
        <div>
          <span className="director-kicker">Directorate control room · 10 Sep 2026</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            National capacity command center
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            One view of people, learning delivery, and readiness across MoES institutes.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <span className="badge badge-success">Systems operational</span>
          <a href={api.exportAnalyticsCSV()} download="MoES_Capacity_Building_Report.csv" className="btn btn-secondary">
            <Download size={16} /> Export report
          </a>
        </div>
      </div>

      <div>
        <div className="director-section-label" style={{ marginBottom: '0.65rem' }}>Director modules</div>
        <div className="director-module-grid">
          <Link to="/admin/users" className="director-module">
            <span className="director-module-icon"><UserRound size={18} /></span>
            <span><strong style={{ display: 'block', fontSize: '0.9rem' }}>Personnel</strong><small style={{ color: 'var(--text-muted)' }}>Access, roles, and activity</small></span>
            <ArrowUpRight size={15} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
          </Link>
          <Link to="/admin/announcements" className="director-module">
            <span className="director-module-icon"><Megaphone size={18} /></span>
            <span><strong style={{ display: 'block', fontSize: '0.9rem' }}>Broadcasts</strong><small style={{ color: 'var(--text-muted)' }}>Directives and updates</small></span>
            <ArrowUpRight size={15} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
          </Link>
          <div className="director-module" style={{ cursor: 'default' }}>
            <span className="director-module-icon"><Shield size={18} /></span>
            <span><strong style={{ display: 'block', fontSize: '0.9rem' }}>Readiness</strong><small style={{ color: 'var(--text-muted)' }}>Live analytics snapshot</small></span>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Registered Trainees"
          value={metrics.total_trainees || 0}
          subtitle="IMD & MoES Scientists"
          color="#67e8d5"
        />
        <StatCard
          icon={Shield}
          title="Domain Trainers"
          value={metrics.total_trainers || 0}
          subtitle="Certified specialists"
          color="#5bb8ff"
        />
        <StatCard
          icon={BookOpen}
          title="Published Courses"
          value={metrics.total_courses || 0}
          subtitle="Capacity modules"
          color="#9be15d"
        />
        <StatCard
          icon={Award}
          title="Certificates Issued"
          value={metrics.total_certificates || 0}
          subtitle="Verified credentials"
          color="#ffc857"
        />
      </div>

      {/* CHARTS ROW */}
      <div className="grid-cols-2">

        {/* BAR CHART: DIVISION READINESS */}
        <div className="velora-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
            Trainee Count by MoES Department
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
                <Bar dataKey="trainees" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART: SKILL GAP SPREAD */}
        <div className="velora-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
            Top Skill Gap Deficits (Trainees Affected)
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryGapData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryGapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
                <Legend formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
