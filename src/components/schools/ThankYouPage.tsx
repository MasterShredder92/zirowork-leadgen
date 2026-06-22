'use client';

import { useState } from 'react';
import type { School } from '@/lib/schools/getSchool';

const INST_LABEL: Record<string, string> = { piano: 'Piano', guitar: 'Guitar', vocals: 'Voice', drums: 'Drums', violin: 'Violin' };

export default function ThankYouPage({ school, slug }: { school: School; slug: string }) {
  const accent = school.accent || 'var(--color-school-accent-default)';
  const [instrument] = useState(() =>
    typeof window === 'undefined' ? 'music' : (new URLSearchParams(window.location.search).get('instrument') || 'music'),
  );

  const instLabel = INST_LABEL[instrument] || instrument.charAt(0).toUpperCase() + instrument.slice(1);
  const backInstrument = instrument !== 'music' ? instrument : 'piano';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-school-white)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '40px 24px',
    }}>

      {/* School badge */}
      <div style={{
        display: 'inline-block',
        background: accent + '18',
        color: accent,
        padding: '3px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 32,
      }}>
        {school.name}
      </div>

      {/* Checkmark */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'var(--color-status-scheduled)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        boxShadow: '0 8px 32px rgba(34,197,94,0.25)',
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M8 18.5L15 25.5L28 11" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 42px)',
        fontWeight: 800,
        color: 'var(--color-school-ink)',
        letterSpacing: '-0.02em',
        margin: '0 0 12px',
        textAlign: 'center',
      }}>
        You&apos;re in!
      </h1>

      {/* Subheadline */}
      <p style={{
        fontSize: 19,
        color: 'var(--color-school-text-3)',
        margin: '0 0 12px',
        textAlign: 'center',
        lineHeight: 1.5,
        maxWidth: 400,
        fontWeight: 600,
      }}>
        Your {instLabel} lesson request has been received.
      </p>

      {/* Body */}
      <p style={{
        fontSize: 16,
        color: 'var(--color-school-text-6)',
        margin: '0 0 36px',
        textAlign: 'center',
        lineHeight: 1.7,
        maxWidth: 400,
      }}>
        We&apos;ll reach out within the hour during business hours to confirm your match and get your first lesson scheduled.
      </p>

      {/* Phone */}
      {school.phone && (
        <a
          href={'tel:' + school.phone.replace(/\D/g, '')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'var(--color-school-bg-card)',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-school-ink)',
            textDecoration: 'none',
            marginBottom: 32,
            border: '1px solid var(--color-school-bg-subtle)',
          }}
        >
          <span style={{ fontSize: 17 }}>📞</span>
          {school.phone}
        </a>
      )}

      {/* Back link */}
      <a
        href={'/schools/' + slug + '/' + backInstrument}
        style={{
          fontSize: 15,
          color: accent,
          fontWeight: 700,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ← Back to {school.name}
      </a>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        fontSize: 13,
        color: 'var(--color-school-muted-3)',
        textAlign: 'center',
      }}>
        {school.name}{school.city ? ' · ' + school.city : ''}
      </div>

    </div>
  );
}
