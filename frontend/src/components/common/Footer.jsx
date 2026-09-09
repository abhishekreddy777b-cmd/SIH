import React from 'react';
import { Compass, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-dark)',
      borderTop: '1px solid var(--border-color)',
      padding: '2rem 1.5rem',
      marginTop: 'auto',
      color: 'var(--text-muted)',
      fontSize: '0.8125rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Compass size={20} color="var(--primary)" />
          <div>
            <span style={{ fontWeight: 800, color: '#fff' }}>VELORA — CAPACITY CONNECT</span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              Next-Gen AI Capacity-Building Ecosystem • Ministry of Earth Sciences (MoES) / IMD
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a href="https://moes.gov.in" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
            MoES Portal <ExternalLink size={12} />
          </a>
          <a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
            IMD Official <ExternalLink size={12} />
          </a>
          <a href="/certificates/verify/CERT-2026-ARJ101" style={{ color: 'var(--text-muted)' }}>
            Verify Certificate
          </a>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          © 2026 Smart India Hackathon (SIH26075). Built for Public & National Service.
        </div>
      </div>
    </footer>
  );
}
