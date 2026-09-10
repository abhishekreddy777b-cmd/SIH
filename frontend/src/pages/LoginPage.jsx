import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Compass, Lock, Mail, Sparkles, GraduationCap, BookOpen, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login, switchDemoAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.success) {
        toast.success(`Welcome back, ${res.user.first_name}!`);
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'trainer') navigate('/trainer');
        else navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', width: '100%', padding: '0 1rem' }}>
      <div className="velora-card gradient-border-top">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <Compass size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Sign In to VELORA</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            MoES Capacity Building & Skill Gap Ecosystem
          </p>
        </div>

        {/* DEMO JUDGE QUICK SWITCHER */}
        <div style={{
          backgroundColor: 'var(--surface-deep)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem',
          marginBottom: '1.5rem',
          border: '1px dashed var(--secondary)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <Sparkles size={14} /> Quick Demo Login for Judges:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              onClick={async () => { await switchDemoAccount('trainee'); navigate('/dashboard'); }}
              className="btn btn-sm btn-secondary"
              style={{ justifyContent: 'flex-start' }}
            >
              <GraduationCap size={14} color="var(--primary)" /> Trainee (Arjun Sharma)
            </button>
            <button
              onClick={async () => { await switchDemoAccount('trainer'); navigate('/trainer'); }}
              className="btn btn-sm btn-secondary"
              style={{ justifyContent: 'flex-start' }}
            >
              <BookOpen size={14} color="var(--success)" /> Trainer (Dr. Rahul Mehta)
            </button>
            <button
              onClick={async () => { await switchDemoAccount('admin'); navigate('/admin'); }}
              className="btn btn-sm btn-secondary"
              style={{ justifyContent: 'flex-start' }}
            >
              <Shield size={14} color="#f59e0b" /> Admin (Director General)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="e.g. arjun@imd.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register Now</Link>
        </div>
      </div>
    </div>
  );
}
