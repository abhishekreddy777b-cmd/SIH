import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatCard, Badge } from '../components/common/UIComponents';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Shield, Users, BookOpen, Download, AlertTriangle, CheckCircle, Bell, ArrowRight, RefreshCw, Activity, Award
} from 'lucide-react';

export default function AdminDashboard() {
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [topGaps, setTopGaps] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [announcement, setAnnouncement] = useState({ title: '', content: '', priority: 'normal' });
  const [publishing, setPublishing] = useState(false);

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

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.title || !announcement.content) return;
    setPublishing(true);
    try {
      const res = await api.createAnnouncement(announcement);
      if (res.success) {
        toast.success('System announcement broadcasted to all MoES personnel!');
        setAnnouncement({ title: '', content: '', priority: 'normal' });
      }
    } catch (e) {
      toast.error('Failed to broadcast announcement');
    } finally {
      setPublishing(false);
    }
  };

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading || !metrics) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading MoES Executive Analytics...</div>;
  }

  const divisionData = deptStats.length > 0 ? deptStats.map(d => ({
    name: d.department.length > 15 ? d.department.substring(0, 15) + '...' : d.department,
    trainees: d.trainee_count
  })) : [
    { name: 'IMD Severe Weather', trainees: 14 },
    { name: 'INCOIS Coastal', trainees: 9 },
    { name: 'IITM Climate Tech', trainees: 12 },
    { name: 'NCMRWF Modeling', trainees: 8 }
  ];

  const categoryGapData = topGaps.length > 0 ? topGaps.slice(0, 5).map(g => ({
    name: g.competency_name.length > 16 ? g.competency_name.substring(0, 16) + '...' : g.competency_name,
    value: g.affected_trainees || 1
  })) : [
    { name: 'Numerical Weather', value: 14 },
    { name: 'Radar Meteorology', value: 8 },
    { name: 'Satellite Imagery', value: 11 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* EXECUTIVE HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>
            Director General MoES Executive Suite
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            National Capacity Analytics & Monitoring
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time readiness monitoring across all 5 MoES institutes and regional weather centers.
          </p>
        </div>

        <a
          href={api.exportAnalyticsCSV()}
          download="MoES_Capacity_Building_Report.csv"
          className="btn btn-outline"
          style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
        >
          <Download size={16} /> Export Directorate Report CSV
        </a>
      </div>

      {/* STAT CARDS */}
      <div className="grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Registered Trainees"
          value={metrics.total_trainees || 0}
          subtitle="IMD & MoES Scientists"
          color="#3b82f6"
        />
        <StatCard
          icon={Shield}
          title="Domain Trainers"
          value={metrics.total_trainers || 0}
          subtitle="Certified specialists"
          color="#06b6d4"
        />
        <StatCard
          icon={BookOpen}
          title="Published Courses"
          value={metrics.total_courses || 0}
          subtitle="Capacity modules"
          color="#10b981"
        />
        <StatCard
          icon={Award}
          title="Certificates Issued"
          value={metrics.total_certificates || 0}
          subtitle="Verified credentials"
          color="#f59e0b"
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

      {/* ANNOUNCEMENT BROADCAST FORM */}
      <div className="velora-card gradient-border-top">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} color="var(--warning)" /> Broadcast System-Wide MoES Announcement
        </h3>

        <form onSubmit={handleCreateAnnouncement}>
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Announcement Title</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Mandatory Radar Meteorology Assessment Directive 2026"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-control"
                value={announcement.priority}
                onChange={(e) => setAnnouncement({ ...announcement, priority: e.target.value })}
              >
                <option value="normal">Normal Broadcast</option>
                <option value="high">High Directive</option>
                <option value="urgent">Urgent Operational</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Announcement Content</label>
            <textarea
              required
              rows={3}
              className="form-control"
              placeholder="Message will be pushed instantly to all trainee & trainer dashboards..."
              value={announcement.content}
              onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
            />
          </div>

          <button type="submit" disabled={publishing} className="btn btn-primary">
            {publishing ? 'Publishing...' : 'Broadcast Announcement Now'}
          </button>
        </form>
      </div>

    </div>
  );
}
