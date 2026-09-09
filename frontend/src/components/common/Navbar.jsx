import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate as useRouterNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Building2, Search, Bell, User, LogOut, Shield, Briefcase,
  BarChart3, Users, ChevronDown, Zap
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, switchDemoAccount } = useAuth();
  const navigate = useRouterNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setUnreadNotifs(res.unread_count || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: 'var(--bg-header)',
      backdropFilter: 'blur(10px)',
      borderBottom: '2px solid var(--border-highlight)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Ministry Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <RouterLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0066cc, #00a8cc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 102, 204, 0.5)',
            fontWeight: 700,
            color: '#ffffff',
            fontSize: '1.2rem'
          }}>
            🌊
          </div>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#e6f0ff' }}>
              MoES VELORA
            </span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, display: 'block', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '-2px' }}>
              Earth Systems Capacity Platform
            </span>
          </div>
        </RouterLink>
      </div>

      {/* Global Search */}
      <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: '400px', margin: '0 2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search competencies, courses, assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8rem', borderRadius: '6px' }}
          />
        </div>
      </form>

      {/* Right Navigation & Demo Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

        {/* DEMO ACCOUNT SWITCHER FOR JUDGES */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--accent)', color: 'var(--accent)', fontSize: '0.8rem' }}
            title="Switch demo account for evaluation"
          >
            <Zap size={14} />
            <span>Demo</span>
            <ChevronDown size={13} />
          </button>

          {showDemoMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '240px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.5rem',
              zIndex: 1050
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.5rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                Quick Demo Access
              </div>
              <button
                onClick={() => { switchDemoAccount('trainee'); setShowDemoMenu(false); navigate('/dashboard'); }}
                style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.75rem', borderRadius: '6px', background: user?.role === 'trainee' ? 'var(--primary-light)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.35rem' }}
              >
                <Briefcase size={15} color="#0066cc" />
                <span>Scientist (Arjun)</span>
              </button>
              <button
                onClick={() => { switchDemoAccount('trainer'); setShowDemoMenu(false); navigate('/trainer'); }}
                style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.75rem', borderRadius: '6px', background: user?.role === 'trainer' ? 'var(--primary-light)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.25rem' }}
              >
                <BarChart3 size={15} color="#00b386" />
                <span>Trainer (Dr. Rahul)</span>
              </button>
              <button
                onClick={() => { switchDemoAccount('admin'); setShowDemoMenu(false); navigate('/admin'); }}
                style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.75rem', borderRadius: '6px', background: user?.role === 'admin' ? 'var(--primary-light)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.25rem' }}
              >
                <Shield size={15} color="#ff9900" />
                <span>Director (MoES)</span>
              </button>
            </div>
          )}
        </div>

        {user ? (
          <>
            {/* Notification Bell */}
            <RouterLink to="/notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', transition: 'var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--warning)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Bell size={19} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--danger)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-header)'
                }}>
                  {unreadNotifs}
                </span>
              )}
            </RouterLink>

            {/* User Profile Menu */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.35rem 0.75rem', borderRadius: '6px', backgroundColor: 'var(--primary-light)' }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#ffffff'
                }}>
                  {user.first_name ? user.first_name[0] : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {user.first_name}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--secondary)' }}>
                    {user.role === 'admin' ? 'Director' : user.role === 'trainer' ? 'Trainer' : 'Scientist'}
                  </span>
                </div>
              </div>

              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '50px',
                  width: '200px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-highlight)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.5rem',
                  zIndex: 1050
                }}>
                  <RouterLink to="/profile" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', color: 'var(--text-main)', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <User size={16} /> My Profile
                  </RouterLink>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.35rem 0' }}></div>
                  <button onClick={logout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '6px', transition: 'var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-light)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RouterLink to="/login" className="btn btn-sm btn-secondary">Sign In</RouterLink>
            <RouterLink to="/register" className="btn btn-sm btn-primary">Register</RouterLink>
          </div>
        )}

      </div>
    </header>
  );
}
