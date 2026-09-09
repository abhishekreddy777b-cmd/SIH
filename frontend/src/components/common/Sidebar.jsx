import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid, Gauge, BookMarked, Zap, Video, Send,
  BarChart2, Users, Megaphone, Target, FileCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const scientistNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { label: 'Competency Gauge', path: '/competencies', icon: Gauge },
    { label: 'Course Library', path: '/courses', icon: BookMarked },
    { label: 'Assessments', path: '/assessments', icon: Zap },
    { label: 'Live Sessions', path: '/live-classes', icon: Video },
    { label: 'Recommendations', path: '/recommendations', icon: Send },
    { label: 'Certificates', path: '/certificates', icon: FileCheck }
  ];

  const trainerNav = [
    { label: 'Dashboard', path: '/trainer', icon: LayoutGrid },
    { label: 'Course Builder', path: '/trainer/courses', icon: BookMarked },
    { label: 'New Course', path: '/trainer/courses/new', icon: BookMarked },
    { label: 'Live Classes', path: '/live-classes', icon: Video },
    { label: 'Messages', path: '/messages', icon: Megaphone }
  ];

  const directorNav = [
    { label: 'Analytics Hub', path: '/admin', icon: BarChart2 },
    { label: 'Personnel', path: '/admin/users', icon: Users },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Competencies', path: '/competencies', icon: Target },
    { label: 'Certificates', path: '/certificates', icon: FileCheck }
  ];

  const navItems = user.role === 'admin'
    ? directorNav
    : user.role === 'trainer'
      ? trainerNav
      : scientistNav;

  return (
    <aside style={{
      width: '220px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      padding: '1.25rem 0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.15rem',
      minHeight: 'calc(100vh - 64px)',
      overflowY: 'auto'
    }}>
      <div style={{ padding: '0 0.75rem 0.75rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '3px', height: '12px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
        {user.role === 'admin' ? 'DIRECTOR PORTAL' : user.role === 'trainer' ? 'TRAINER TOOLS' : 'SCIENTIST WORKSPACE'}
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard' || item.path === '/trainer' || item.path === '/admin'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.675rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'var(--transition)',
              cursor: 'pointer'
            })}
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '1rem 0.75rem 0' }}>
        <div className="velora-card velora-card-glass" style={{ padding: '0.85rem', textAlign: 'center', borderTop: '1px solid var(--border-highlight)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.05em' }}>MINISTRY OF EARTH SCIENCES</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '2px' }}>SIH 2026 • Problem SIH26075</div>
        </div>
      </div>
    </aside>
  );
}
