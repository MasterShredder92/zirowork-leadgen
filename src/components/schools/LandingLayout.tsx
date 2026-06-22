'use client';

import { useState } from 'react';
import type { School } from '@/lib/schools/getSchool';

export default function LandingLayout({
  school,
  intakeUrl,
  instrument,
  children,
}: {
  school: School;
  intakeUrl: string | null;
  instrument?: string;
  children: React.ReactNode;
}) {
  const accent = school.accent || 'var(--color-school-accent-default)';
  const [menuOpen, setMenuOpen] = useState(false);
  void menuOpen;
  void setMenuOpen;
  void instrument;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", color: 'var(--color-school-ink)' }}>

      {/* Sticky nav */}
      <nav style={{ position: 'sticky', top: 0, background: 'var(--color-school-white)', borderBottom: '1px solid var(--color-school-bg-subtle)', zIndex: 100, padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {school.logo
            ? <img src={school.logo} alt={school.name} style={{ height: 36, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'block' }} />
            : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, border: '2px dashed var(--color-school-muted-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-school-muted-2)', fontWeight: 600, flexShrink: 0 }}>LOGO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-school-ink)', letterSpacing: '-0.02em' }}>{school.name}</div>
              </div>
          }
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {school.phone && (
              <a href={'tel:' + school.phone.replace(/\D/g, '')} style={{ fontSize: 15, color: 'var(--color-school-text-3)', textDecoration: 'none', display: 'none', fontWeight: 500 }}
                className="nav-phone">
                {school.phone}
              </a>
            )}
            <a href={intakeUrl ?? undefined} style={{ padding: '9px 22px', background: accent, color: 'var(--color-school-white)', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              Get Started →
            </a>
          </div>
        </div>
      </nav>

      {/* Page content */}
      {children}

      {/* Footer */}
      <footer style={{ background: 'var(--color-school-footer-bg)', color: 'var(--color-school-white)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-school-white)' }}>{school.name}</div>
            {school.phone && <a href={'tel:' + school.phone.replace(/\D/g, '')} style={{ fontSize: 14, color: 'var(--color-school-text-4)', textDecoration: 'none' }}>{school.phone}</a>}
            {school.city && <span style={{ fontSize: 14, color: 'var(--color-school-text-3)' }}>{school.city}{school.state ? ', ' + school.state : ''}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--color-school-text-2)' }}>© 2025 {school.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-school-text-2)' }}>
              <a href="/privacy" target="_blank" style={{ color: 'var(--color-school-text-4)', textDecoration: 'none' }}>Privacy Policy</a>
              {' · '}
              <a href="/terms" target="_blank" style={{ color: 'var(--color-school-text-4)', textDecoration: 'none' }}>Terms</a>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-school-text-1)' }}>Powered by <span style={{ color: 'var(--color-school-text-3)', fontWeight: 600 }}>ZiroWork</span></div>
            <a href={intakeUrl ?? undefined} style={{ padding: '8px 18px', background: accent, color: 'var(--color-school-white)', borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Get Started →
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
