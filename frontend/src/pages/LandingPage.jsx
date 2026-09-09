import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Shield, Gauge, Database, FileCheck, Zap, CheckCircle2,
  ArrowRight, Users, TrendingUp, Cloud, Workflow, ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const { switchDemoAccount } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '3rem' }}>

      {/* HERO SECTION - GOVERNMENT FOCUS */}
      <section style={{
        position: 'relative',
        padding: '4rem 1.5rem 3rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(0, 102, 204, 0.1), transparent 70%)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '950px', margin: '0 auto' }}>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1.1rem',
            borderRadius: '999px',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            color: 'var(--accent)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.75rem',
            letterSpacing: '0.05em'
          }}>
            <Building2 size={15} />
            <span>MINISTRY OF EARTH SCIENCES • INDIA METEOROLOGICAL DEPARTMENT</span>
          </div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.035em', color: 'var(--text-main)' }}>
            National Capacity Building <br />
            <span style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              for Earth System Scientists
            </span>
          </h1>

          <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '820px', margin: '0 auto 2.5rem' }}>
            VELORA Capacity Connect operationalizes the complete learning lifecycle—from competency assessment to skill gap identification, rules-based recommendations, live training, and verifiable national certifications across Weather Forecasting, Seismology, Oceanography, and Climate Systems.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ boxShadow: 'var(--shadow-glow)', fontSize: '0.95rem' }}>
              Enter As Scientist <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" style={{ fontSize: '0.95rem' }}>
              Sign In
            </Link>
          </div>

          {/* DEMO ACCESS FOR JUDGES */}
          <div className="velora-card gradient-border-top" style={{ marginTop: '4rem', padding: '1.5rem 2rem', textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border-highlight)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                  ⚡ EVALUATION MODE
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                  Quick-launch demo portals for judges — instant access to all features:
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => switchDemoAccount('trainee')} className="btn btn-sm" style={{ background: 'var(--primary)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700 }}>
                  Scientist Portal
                </button>
                <button onClick={() => switchDemoAccount('trainer')} className="btn btn-sm" style={{ background: 'var(--success)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700 }}>
                  Trainer Portal
                </button>
                <button onClick={() => switchDemoAccount('admin')} className="btn btn-sm" style={{ background: 'var(--warning)', color: '#000', fontSize: '0.75rem', fontWeight: 700 }}>
                  Director Portal
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PLATFORM CAPABILITIES */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Platform Capabilities
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Enterprise-grade infrastructure for national capacity assessment and development
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            { label: '45+ MoES Competencies', value: 'Tracked & Benchmarked', icon: Gauge, color: '#0066cc' },
            { label: 'Dynamic Skill Gap Engine', value: 'Target vs Current Analysis', icon: Workflow, color: '#00a8cc' },
            { label: 'Capacity Recommendations', value: 'Personalized Learning Paths', icon: Zap, color: '#0099ff' },
            { label: 'Live Training Sessions', value: 'Interactive Classroom Hub', icon: Cloud, color: '#00b386' },
            { label: 'Timed Assessments', value: 'Auto-Score with Competency Boost', icon: TrendingUp, color: '#ff9900' },
            { label: 'Verifiable Certificates', value: 'Cryptographic Registry', icon: FileCheck, color: '#0066cc' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="velora-card velora-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', cursor: 'pointer' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: `${stat.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={24} color={stat.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {stat.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INTEGRATED WORKFLOW */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Integrated Learning Lifecycle
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            End-to-end operationalization for national capacity development
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '0.75rem', alignItems: 'center', padding: '2rem 1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {['PROFILE', 'ASSESS', 'ANALYZE', 'IDENTIFY GAP', 'RECOMMEND', 'LEARN', 'PRACTICE', 'REASSESS', 'CERTIFY'].map((step, idx) => (
            <React.Fragment key={idx}>
              <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  margin: '0 auto 0.5rem'
                }}>
                  {idx + 1}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {step}
                </div>
              </div>
              {idx < 8 && <div style={{ width: '100%', height: '2px', background: 'linear-gradient(90deg, var(--border-color), transparent)', alignSelf: 'center' }}></div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* INSTITUTIONAL IMPACT */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-highlight)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          {[
            { num: '5', label: 'Ministry Institutes', icon: Building2 },
            { num: '100+', label: 'Training Professionals', icon: Users },
            { num: '1000+', label: 'Scientists Trained', icon: Gauge },
            { num: '94%', label: 'Skill Gap Resolution Target', icon: CheckCircle2 }
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} style={{ textAlign: 'center' }}>
                <Icon size={32} color="var(--secondary)" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  {metric.num}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {metric.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
          Ready to Elevate National Capacity?
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Join scientists, trainers, and administrators across India's Earth Systems organizations.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary btn-lg">
            Launch Portal <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            Documentation
          </Link>
        </div>
      </section>

    </div>
  );
}
