import React from 'react';

export function Badge({ children, variant = 'primary', style = {} }) {
  return (
    <span className={`badge badge-${variant}`} style={style}>
      {children}
    </span>
  );
}

export function ProgressBar({ progress = 0, height = '8px', showPercent = false, color }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div style={{ width: '100%' }}>
      {showPercent && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          <span>Completion</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height,
        backgroundColor: '#1f2937',
        borderRadius: '999px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${clamped}%`,
          height: '100%',
          background: color || 'linear-gradient(90deg, #3b82f6, #06b6d4)',
          borderRadius: '999px',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, title, value, subtitle, trend, color = '#3b82f6' }) {
  return (
    <div className="velora-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0' }}>{value}</h3>
          {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{subtitle}</p>}
        </div>
        {Icon && (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: `${color}18`,
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
          }}>
            <Icon size={22} />
          </div>
        )}
      </div>
      {trend && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: trend.positive ? '#34d399' : '#f87171' }}>
          {trend.text}
        </div>
      )}
    </div>
  );
}
