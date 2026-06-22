'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logPageEvent } from '@/lib/schools/logPageEvent';
import type { School } from '@/lib/schools/getSchool';

const INST_ICON: Record<string, string> = { Piano: '🎹', Guitar: '🎸', Vocals: '🎤', Drums: '🥁', Violin: '🎻', Other: '🎵' };
const INSTRUMENTS = ['Piano', 'Guitar', 'Vocals', 'Drums', 'Violin', 'Other'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'];

type NewStudent = { firstName: string; lastName: string; instruments: string[]; bio: string; goals: string };

export default function SignupPage({ school, slug, instrument }: { school: School; slug: string; instrument: string }) {
  const accent = school.accent || 'var(--color-school-accent-default)';

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [student, setStudent] = useState({ firstName: '', lastName: '', age: '' });
  const [experience, setExperience] = useState('');
  const [freeText, setFreeText] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(instrument ? [instrument.charAt(0).toUpperCase() + instrument.slice(1)] : []);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [hasInstrument, setHasInstrument] = useState('');
  const [contact, setContact] = useState({ parentFirstName: '', parentLastName: '', email: '', phone: '', isMilitary: false });
  const [smsConsent, setSmsConsent] = useState(false);
  const [additionalStudents, setAdditionalStudents] = useState<NewStudent[]>([]);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudent>({ firstName: '', lastName: '', instruments: [], bio: '', goals: '' });
  const [referralSource, setReferralSource] = useState('');
  const [matchLoading, setMatchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepKey, setStepKey] = useState(1);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    logPageEvent('signup_view', slug, instrument || null);
  }, [slug, instrument]);

  const TOTAL_STEPS = selectedPath === 'gift' ? 12 : 11;

  const goNext = () => {
    if (currentStep === 1 && selectedPath !== 'gift') { setStepKey(k => k + 1); setCurrentStep(3); return; }
    if (currentStep === 11) {
      setStepKey(k => k + 1);
      setCurrentStep(12);
      setMatchLoading(true);
      setTimeout(() => setMatchLoading(false), 2200);
      return;
    }
    setStepKey(k => k + 1);
    setCurrentStep(s => s + 1);
  };

  const goBack = () => {
    if (currentStep === 3 && selectedPath !== 'gift') { setStepKey(k => k + 1); setCurrentStep(1); return; }
    setStepKey(k => k + 1);
    setCurrentStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data: clientRow } = await supabase.from('clients').select('id').eq('slug', slug).limit(1);
      const clientId = (clientRow?.[0] as { id?: string } | undefined)?.id || null;

      const parentName = selectedPath !== 'self'
        ? [contact.parentFirstName, contact.parentLastName].filter(Boolean).join(' ') || null
        : null;

      const payload = {
        client_id: clientId,
        client_name: school.name,
        student_name: student.firstName + ' ' + student.lastName,
        parent_name: parentName,
        program: selectedInstruments.join(', '),
        email: contact.email.toLowerCase(),
        phone: contact.phone,
        source: referralSource || null,
        age: student.age ? parseInt(student.age) : null,
        page_url: window.location.href,
        stage: 'new',
        sms_consent: smsConsent,
        sms_consent_at: smsConsent ? new Date().toISOString() : null,
        utm: {
          enrollment_type: selectedPath,
          gift_recipient: giftRecipient || null,
          experience_level: experience,
          goals: freeText,
          has_instrument: hasInstrument || null,
          preferred_days: selectedDays,
          is_military: contact.isMilitary,
          instrument_list: selectedInstruments,
          additional_students: additionalStudents,
        },
      };
      const { error: dbError } = await supabase.from('leads').insert([payload]);
      if (dbError) throw dbError;
      window.location.href = '/schools/' + slug + '/thank-you?instrument=' + (selectedInstruments[0]?.toLowerCase() || 'piano');
    } catch {
      setError('Something went wrong. Please try again or call us directly.');
      setSubmitting(false);
    }
  };

  const matchScore = (student.firstName.length * 7 + selectedInstruments.length * 13 + selectedDays.length * 11) % 8 + 91;

  const isKid = selectedPath === 'kid' || selectedPath === 'kids' || selectedPath === 'gift';
  void isKid;
  const studentName = student.firstName || 'them';

  // Styles
  const S = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-school-white)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    } as React.CSSProperties,
    progressWrap: {
      position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 100, background: 'var(--color-school-bg-subtle)',
    } as React.CSSProperties,
    progressFill: {
      height: '100%',
      background: accent,
      transition: 'width 0.35s ease',
      width: ((currentStep / TOTAL_STEPS) * 100) + '%',
    } as React.CSSProperties,
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px 120px',
      maxWidth: 520,
      margin: '0 auto',
      width: '100%',
    } as React.CSSProperties,
    badge: {
      display: 'inline-block',
      background: accent + '18',
      color: accent,
      padding: '3px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 20,
    } as React.CSSProperties,
    headline: {
      fontSize: 'clamp(22px, 4vw, 32px)',
      fontWeight: 800,
      color: 'var(--color-school-ink)',
      marginBottom: 8,
      marginTop: 0,
      letterSpacing: '-0.02em',
      lineHeight: 1.15,
    } as React.CSSProperties,
    sub: {
      fontSize: 16,
      color: 'var(--color-school-text-6)',
      marginBottom: 28,
      marginTop: 0,
      lineHeight: 1.6,
    } as React.CSSProperties,
    pathCard: (selected: boolean): React.CSSProperties => ({
      width: '100%',
      padding: '20px 24px',
      border: '2px solid ' + (selected ? accent : 'var(--color-school-bg-subtle)'),
      borderRadius: 14,
      cursor: 'pointer',
      textAlign: 'left',
      background: selected ? accent + '10' : 'var(--color-school-white)',
      marginBottom: 10,
      transition: 'all 0.15s',
    }),
    pathCardTitle: {
      fontSize: 17,
      fontWeight: 800,
      color: 'var(--color-school-ink)',
      marginBottom: 3,
    } as React.CSSProperties,
    pathCardSub: {
      fontSize: 14,
      color: 'var(--color-school-text-6)',
      margin: 0,
    } as React.CSSProperties,
    pill: (selected: boolean): React.CSSProperties => ({
      padding: '10px 20px',
      borderRadius: 24,
      border: '2px solid ' + (selected ? accent : 'var(--color-school-bg-subtle)'),
      fontSize: 15,
      fontWeight: 600,
      cursor: 'pointer',
      background: selected ? accent + '12' : 'var(--color-school-white)',
      color: selected ? accent : 'var(--color-school-ink)',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }),
    instCard: (selected: boolean): React.CSSProperties => ({
      padding: '18px 12px',
      border: '2px solid ' + (selected ? accent : 'var(--color-school-bg-subtle)'),
      borderRadius: 14,
      cursor: 'pointer',
      textAlign: 'center',
      background: selected ? accent + '10' : 'var(--color-school-white)',
      transition: 'all 0.15s',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }),
    input: {
      width: '100%',
      padding: '13px 16px',
      border: '2px solid var(--color-school-bg-subtle)',
      borderRadius: 10,
      fontSize: 16,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      outline: 'none',
      color: 'var(--color-school-ink)',
      background: 'var(--color-school-white)',
      boxSizing: 'border-box',
    } as React.CSSProperties,
    label: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--color-school-text-3)',
      marginBottom: 6,
      display: 'block',
    } as React.CSSProperties,
    stickyBottom: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '16px 20px',
      background: 'var(--color-school-white)',
      borderTop: '1px solid var(--color-school-bg-subtle)',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 50,
    } as React.CSSProperties,
    btn: (disabled: boolean): React.CSSProperties => ({
      padding: '15px 32px',
      borderRadius: 10,
      fontSize: 16,
      fontWeight: 700,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      width: '100%',
      maxWidth: 480,
      background: disabled ? 'var(--color-school-muted-3)' : accent,
      color: 'var(--color-school-white)',
      opacity: disabled ? 0.7 : 1,
      transition: 'opacity 0.15s',
    }),
    backBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--color-school-text-6)',
      padding: '4px 0',
      marginBottom: 16,
      alignSelf: 'flex-start',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    } as React.CSSProperties,
    fieldGroup: {
      width: '100%',
      marginBottom: 16,
    } as React.CSSProperties,
    textarea: {
      width: '100%',
      padding: '13px 16px',
      border: '2px solid var(--color-school-bg-subtle)',
      borderRadius: 10,
      fontSize: 15,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      outline: 'none',
      color: 'var(--color-school-ink)',
      background: 'var(--color-school-white)',
      resize: 'vertical',
      minHeight: 100,
      boxSizing: 'border-box',
      lineHeight: 1.6,
    } as React.CSSProperties,
    stepFade: {
      opacity: 1,
      animation: 'stepIn 0.2s ease',
      width: '100%',
    } as React.CSSProperties,
  };

  const renderBack = () => currentStep > 1 && (
    <button onClick={goBack} style={S.backBtn}>← Back</button>
  );

  const renderBadge = () => (
    <div style={S.badge}>{school.name}</div>
  );

  // Step 1
  const renderStep1 = () => {
    const paths = [
      { key: 'kid', title: 'For a kid', sub: 'Sign up one child for lessons' },
      { key: 'kids', title: 'For kids (2+)', sub: 'Sign up multiple children' },
      { key: 'self', title: 'For myself', sub: 'I want to learn an instrument' },
      { key: 'gift', title: 'As a gift', sub: 'Give the gift of music' },
    ];
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBadge()}
        <h1 style={S.headline}>Who is this for?</h1>
        <p style={S.sub}>Choose the option that fits best.</p>
        <div style={{ width: '100%' }}>
          {paths.map(p => (
            <button
              key={p.key}
              style={S.pathCard(selectedPath === p.key)}
              onClick={() => { setSelectedPath(p.key); setTimeout(goNext, 120); }}
            >
              <div style={S.pathCardTitle}>{p.title}</div>
              <div style={S.pathCardSub}>{p.sub}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Step 2 — Gift recipient
  const renderStep2 = () => (
    <div style={S.stepFade} key={stepKey}>
      {renderBack()}
      {renderBadge()}
      <h1 style={S.headline}>Who&apos;s the lucky recipient?</h1>
      <p style={S.sub}>We&apos;ll personalize everything for them.</p>
      <div style={{ ...S.fieldGroup }}>
        <label style={S.label}>Recipient&apos;s name</label>
        <input
          style={S.input}
          value={giftRecipient}
          onChange={e => setGiftRecipient(e.target.value)}
          placeholder="e.g. Sarah"
          autoFocus
        />
      </div>
      <div style={S.stickyBottom}>
        <button style={S.btn(!giftRecipient.trim())} disabled={!giftRecipient.trim()} onClick={goNext}>
          Continue →
        </button>
      </div>
    </div>
  );

  // Step 3 — Student basics
  const renderStep3 = () => {
    const isSelf = selectedPath === 'self';
    const valid = student.firstName.trim() && student.lastName.trim();
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>{isSelf ? 'Tell us about yourself.' : 'Tell us about them.'}</h1>
        <p style={S.sub}>{isSelf ? 'A few quick details.' : selectedPath === 'gift' && giftRecipient ? `We're signing up ${giftRecipient}.` : "We'll use this to match the right teacher."}</p>
        <div style={{ ...S.fieldGroup }}>
          <label style={S.label}>{isSelf ? 'Your first name' : 'Student first name'}</label>
          <input
            style={S.input}
            value={student.firstName}
            onChange={e => setStudent(s => ({ ...s, firstName: e.target.value }))}
            placeholder="First name"
            autoFocus
          />
        </div>
        <div style={{ ...S.fieldGroup }}>
          <label style={S.label}>{isSelf ? 'Your last name' : 'Student last name'}</label>
          <input
            style={S.input}
            value={student.lastName}
            onChange={e => setStudent(s => ({ ...s, lastName: e.target.value }))}
            placeholder="Last name"
          />
        </div>
        <div style={{ ...S.fieldGroup }}>
          <label style={S.label}>Age <span style={{ fontWeight: 400, color: 'var(--color-school-muted-2)' }}>(optional)</span></label>
          <input
            style={S.input}
            type="number"
            min="1"
            max="120"
            value={student.age}
            onChange={e => setStudent(s => ({ ...s, age: e.target.value }))}
            placeholder="e.g. 8"
          />
        </div>
        <div style={S.stickyBottom}>
          <button style={S.btn(!valid)} disabled={!valid} onClick={goNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  };

  // Step 4 — Experience + goals
  const renderStep4 = () => {
    const isSelf = selectedPath === 'self';
    const expOptions = ['None', '1-2 years', '2-4 years', '4 years or more'];
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>{isSelf ? 'A bit more about you.' : `A bit more about ${studentName}.`}</h1>
        <p style={S.sub}>Experience level first, then a little context.</p>
        <div style={{ width: '100%', marginBottom: 20 }}>
          <label style={S.label}>Experience level</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {expOptions.map(opt => (
              <button key={opt} style={S.pill(experience === opt)} onClick={() => setExperience(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        {experience && (
          <div style={{ ...S.fieldGroup }}>
            <label style={S.label}>{isSelf ? 'Goals & learning style' : 'Personality, learning style & goals'}</label>
            <textarea
              style={S.textarea}
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder={isSelf
                ? 'Tell us about your goals and how you learn best'
                : `Tell us about ${studentName}'s personality, learning style, and goals`
              }
            />
          </div>
        )}
        <div style={S.stickyBottom}>
          <button style={S.btn(!experience)} disabled={!experience} onClick={goNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  };

  // Step 5 — Instruments
  const renderStep5 = () => {
    const isSelf = selectedPath === 'self';
    const valid = selectedInstruments.length > 0;
    const toggleInst = (inst: string) => {
      setSelectedInstruments(prev =>
        prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
      );
    };
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>{isSelf ? 'What do you want to learn?' : `What does ${studentName} want to learn?`}</h1>
        <p style={S.sub}>Pick all that apply.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginBottom: 8 }}>
          {INSTRUMENTS.map(inst => (
            <button key={inst} style={S.instCard(selectedInstruments.includes(inst))} onClick={() => toggleInst(inst)}>
              <span style={{ fontSize: 29 }}>{INST_ICON[inst]}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-school-ink)' }}>{inst}</span>
            </button>
          ))}
        </div>
        <div style={S.stickyBottom}>
          <button style={S.btn(!valid)} disabled={!valid} onClick={goNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  };

  // Step 6 — Availability
  const renderStep6 = () => {
    const specialOptions = ['Any of These Work', 'None of These Work'];
    const toggleDay = (day: string) => {
      if (specialOptions.includes(day)) {
        setSelectedDays([day]);
        return;
      }
      setSelectedDays(prev => {
        const filtered = prev.filter(d => !specialOptions.includes(d));
        return filtered.includes(day) ? filtered.filter(d => d !== day) : [...filtered, day];
      });
    };
    const valid = selectedDays.length > 0;
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>What days work best?</h1>
        <p style={S.sub}>Select all that apply.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 16 }}>
          {DAYS.map(day => (
            <button key={day} style={S.pill(selectedDays.includes(day))} onClick={() => toggleDay(day)}>
              {day}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
          {specialOptions.map(opt => (
            <button key={opt} style={S.pill(selectedDays.includes(opt))} onClick={() => toggleDay(opt)}>
              {opt}
            </button>
          ))}
        </div>
        <div style={S.stickyBottom}>
          <button style={S.btn(!valid)} disabled={!valid} onClick={goNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  };

  // Step 7 — Has instrument
  const renderStep7 = () => {
    const isSelf = selectedPath === 'self';
    const options = ['Yes', 'No', 'Need Help Purchasing', 'N/A'];
    const selectOption = (opt: string) => {
      setHasInstrument(opt);
      setTimeout(goNext, 300);
    };
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>{isSelf ? 'Do you have an instrument?' : `Does ${studentName} have an instrument?`}</h1>
        <p style={S.sub}>Let us know so we can plan accordingly.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
          {options.map(opt => (
            <button key={opt} style={S.pill(hasInstrument === opt)} onClick={() => selectOption(opt)}>
              {opt}
            </button>
          ))}
        </div>
        {hasInstrument === 'No' && (
          <p style={{ fontSize: 14, color: 'var(--color-school-text-6)', marginTop: 16, lineHeight: 1.6 }}>
            No problem — we can help you find something.
          </p>
        )}
      </div>
    );
  };

  // Step 8 — Location
  const renderStep8 = () => (
    <div style={S.stepFade} key={stepKey}>
      {renderBack()}
      {renderBadge()}
      <h1 style={S.headline}>Your location</h1>
      <p style={S.sub}>Based on the page you came from.</p>
      <div style={{ width: '100%', padding: '24px 28px', background: 'var(--color-school-bg-card)', borderRadius: 16, border: '1px solid var(--color-school-bg-subtle)', marginBottom: 24 }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--color-school-ink)', marginBottom: 6 }}>{school.name}</div>
        <div style={{ fontSize: 16, color: 'var(--color-school-text-4)' }}>{school.city}{school.state ? ', ' + school.state : ''}</div>
      </div>
      <div style={S.stickyBottom}>
        <button style={S.btn(false)} onClick={goNext}>
          That&apos;s my location →
        </button>
      </div>
    </div>
  );

  // Step 9 — Contact
  const renderStep9 = () => {
    const isSelf = selectedPath === 'self';
    const isGift = selectedPath === 'gift';
    const emailOk = contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
    const parentValid = isSelf || (contact.parentFirstName.trim() && contact.parentLastName.trim());
    const valid = emailOk && contact.phone.trim() && parentValid;
    const handleEmailBlur = () => {
      if (contact.email && !emailOk) setEmailError('Please enter a valid email address.');
      else setEmailError('');
    };
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>{isGift ? "Who should we contact about this gift?" : "How do we reach you?"}</h1>
        <p style={S.sub}>We&apos;ll be in touch within the hour.</p>
        {!isSelf && (
          <>
            <div style={S.fieldGroup}>
              <label style={S.label}>Parent / Guardian first name</label>
              <input
                style={S.input}
                value={contact.parentFirstName}
                onChange={e => setContact(c => ({ ...c, parentFirstName: e.target.value }))}
                placeholder="First name"
                autoFocus
              />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Parent / Guardian last name</label>
              <input
                style={S.input}
                value={contact.parentLastName}
                onChange={e => setContact(c => ({ ...c, parentLastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
          </>
        )}
        <div style={S.fieldGroup}>
          <label style={S.label}>Email</label>
          <input
            style={{ ...S.input, borderColor: emailError ? 'var(--color-school-accent-default)' : 'var(--color-school-bg-subtle)' }}
            type="email"
            value={contact.email}
            onChange={e => { setContact(c => ({ ...c, email: e.target.value })); setEmailError(''); }}
            onBlur={handleEmailBlur}
            placeholder="you@example.com"
          />
          {emailError && <div style={{ fontSize: 13, color: 'var(--color-school-accent-default)', marginTop: 4 }}>{emailError}</div>}
        </div>
        <div style={S.fieldGroup}>
          <label style={S.label}>Phone</label>
          <input
            style={S.input}
            type="tel"
            value={contact.phone}
            onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
            placeholder="(555) 000-0000"
          />
        </div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
          <input
            type="checkbox"
            id="sms-consent"
            checked={smsConsent}
            onChange={e => setSmsConsent(e.target.checked)}
            style={{ marginTop: 2, accentColor: accent, flexShrink: 0, cursor: 'pointer' }}
          />
          <label htmlFor="sms-consent" style={{ fontSize: 13, color: 'var(--color-school-text-6)', lineHeight: 1.5, cursor: 'pointer' }}>
            I consent to receive text messages from ZiroWork on behalf of {school.name} about my lesson inquiry, including follow-ups and booking reminders, at the number provided. Message frequency varies. Msg & data rates may apply. Reply HELP for help or STOP to cancel.{' '}
            <a href="/privacy" target="_blank" style={{ color: accent, textDecoration: 'underline' }}>Privacy Policy</a>
            {' | '}
            <a href="/terms" target="_blank" style={{ color: accent, textDecoration: 'underline' }}>Terms</a>
          </label>
        </div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--color-school-bg-card)', borderRadius: 10, marginBottom: 16, cursor: 'pointer' }}
          onClick={() => setContact(c => ({ ...c, isMilitary: !c.isMilitary }))}>
          <div style={{
            width: 42, height: 24, borderRadius: 12, background: contact.isMilitary ? accent : 'var(--color-school-muted-4)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 2, left: contact.isMilitary ? 20 : 2,
              width: 20, height: 20, borderRadius: '50%', background: 'var(--color-school-white)',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-school-ink)' }}>Military family?</span>
        </div>
        <div style={S.stickyBottom}>
          <button style={S.btn(!valid)} disabled={!valid} onClick={goNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  };

  // Step 10 — Additional students
  const renderStep10 = () => {
    const isSelf = selectedPath === 'self';
    const canAddMore = additionalStudents.length < 3;
    const toggleNewInst = (inst: string) => {
      setNewStudent(s => ({
        ...s,
        instruments: s.instruments.includes(inst) ? s.instruments.filter(i => i !== inst) : [...s.instruments, inst],
      }));
    };
    const addStudent = () => {
      if (!newStudent.firstName.trim()) return;
      setAdditionalStudents(prev => [...prev, { ...newStudent }]);
      setNewStudent({ firstName: '', lastName: '', instruments: [], bio: '', goals: '' });
      setAddingStudent(false);
    };
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>
          {isSelf
            ? 'Is there anyone else in your family interested in lessons?'
            : `Is ${studentName} the only one joining?`}
        </h1>
        <p style={S.sub}>{isSelf ? 'Add them now to save time.' : 'Or does someone else want lessons too?'}</p>

        {additionalStudents.length > 0 && (
          <div style={{ width: '100%', marginBottom: 16 }}>
            {additionalStudents.map((s, i) => (
              <div key={i} style={{ padding: '14px 18px', background: 'var(--color-school-bg-card)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--color-school-bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-school-ink)' }}>{s.firstName} {s.lastName}</div>
                {s.instruments.length > 0 && (
                  <div style={{ fontSize: 14, color: 'var(--color-school-text-6)', marginTop: 2 }}>{s.instruments.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {!addingStudent ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              style={{ ...S.pathCard(false), textAlign: 'center' }}
              onClick={goNext}
            >
              <div style={S.pathCardTitle}>Just {isSelf ? 'me' : studentName}</div>
              <div style={S.pathCardSub}>Continue to the next step</div>
            </button>
            {canAddMore && (
              <button
                style={{ ...S.pathCard(false), textAlign: 'center' }}
                onClick={() => setAddingStudent(true)}
              >
                <div style={S.pathCardTitle}>Add Another Student</div>
                <div style={S.pathCardSub}>Sign up a sibling or family member</div>
              </button>
            )}
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <div style={S.fieldGroup}>
              <label style={S.label}>First name</label>
              <input
                style={S.input}
                value={newStudent.firstName}
                onChange={e => setNewStudent(s => ({ ...s, firstName: e.target.value }))}
                placeholder="First name"
                autoFocus
              />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Last name</label>
              <input
                style={S.input}
                value={newStudent.lastName}
                onChange={e => setNewStudent(s => ({ ...s, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Instrument(s)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {INSTRUMENTS.map(inst => (
                  <button key={inst} style={S.instCard(newStudent.instruments.includes(inst))} onClick={() => toggleNewInst(inst)}>
                    <span style={{ fontSize: 23 }}>{INST_ICON[inst]}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-school-ink)' }}>{inst}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Personality, learning style & goals</label>
              <textarea
                style={S.textarea}
                value={newStudent.goals}
                onChange={e => setNewStudent(s => ({ ...s, goals: e.target.value }))}
                placeholder="Tell us a bit about this student"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ ...S.btn(false), background: 'var(--color-school-bg-subtle)', color: 'var(--color-school-text-3)' }}
                onClick={() => setAddingStudent(false)}
              >
                Cancel
              </button>
              <button
                style={S.btn(!newStudent.firstName.trim())}
                disabled={!newStudent.firstName.trim()}
                onClick={addStudent}
              >
                Add Student
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 11 — Referral
  const renderStep11 = () => {
    const options = ['Facebook / Instagram', 'Google', 'Signage / Driving By', 'Referral', 'Other'];
    const select = (opt: string) => {
      setReferralSource(opt);
      setTimeout(goNext, 200);
    };
    return (
      <div style={S.stepFade} key={stepKey}>
        {renderBack()}
        {renderBadge()}
        <h1 style={S.headline}>One last thing.</h1>
        <p style={S.sub}>How did you hear about us?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
          {options.map(opt => (
            <button key={opt} style={S.pill(referralSource === opt)} onClick={() => select(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Step 12 — Match
  const renderStep12 = () => {
    if (matchLoading) {
      return (
        <div style={{ ...S.stepFade, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 60 }} key={stepKey}>
          <div style={{ width: 44, height: 44, border: '3px solid var(--color-school-bg-subtle)', borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 24 }} />
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-school-ink)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
            Finding your perfect match...
          </p>
          <p style={{ fontSize: 14, color: 'var(--color-school-muted)', marginTop: 8, textAlign: 'center' }}>we take this very seriously.</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }
    return (
      <div style={{ ...S.stepFade, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 20 }} key={stepKey}>
        {renderBadge()}
        <div style={{ fontSize: 65, fontWeight: 800, color: accent, lineHeight: 1, marginBottom: 4 }}>
          {matchScore}%
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-school-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
          compatibility
        </div>
        <h1 style={{ ...S.headline, textAlign: 'center' }}>We found your match.</h1>
        <p style={{ fontSize: 16, color: 'var(--color-school-text-3)', lineHeight: 1.7, maxWidth: 400, marginBottom: 8 }}>
          We&apos;re reaching out ASAP — expect to hear from us within the hour during business hours.
        </p>
        {school.offer && (
          <div style={{ display: 'inline-block', background: accent + '12', color: accent, padding: '6px 16px', borderRadius: 20, fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
            ✓ {school.offer}
          </div>
        )}
        <div style={{ width: '100%', padding: '20px 24px', background: 'var(--color-school-bg-card)', borderRadius: 14, border: '1px solid var(--color-school-bg-subtle)', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-school-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Your enrollment</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-school-ink)', marginBottom: 4 }}>{student.firstName} {student.lastName}</div>
          {selectedInstruments.length > 0 && (
            <div style={{ fontSize: 15, color: 'var(--color-school-text-4)' }}>{selectedInstruments.join(', ')}</div>
          )}
          <div style={{ fontSize: 14, color: 'var(--color-school-muted)', marginTop: 4 }}>{school.name}</div>
        </div>
        {error && (
          <div style={{ width: '100%', padding: '12px 16px', background: 'var(--color-school-error-bg)', border: '1px solid var(--color-school-error-border)', borderRadius: 10, fontSize: 15, color: 'var(--color-school-error-text)', marginBottom: 16 }}>
            {error}
          </div>
        )}
        <button
          style={{ ...S.btn(submitting), maxWidth: 480, width: '100%' }}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Complete Enrollment →'}
        </button>
        <p style={{ fontSize: 13, color: 'var(--color-school-muted-2)', marginTop: 12 }}>
          {school.phone && (
            <a href={'tel:' + school.phone.replace(/\D/g, '')} style={{ color: 'var(--color-school-muted)', textDecoration: 'none' }}>
              {school.phone}
            </a>
          )}
        </p>
      </div>
    );
  };

  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
    8: renderStep8,
    9: renderStep9,
    10: renderStep10,
    11: renderStep11,
    12: renderStep12,
  };

  const renderCurrentStep = stepRenderers[currentStep] || renderStep1;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes stepIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus, textarea:focus { border-color: ${accent} !important; }
      `}</style>

      {/* Progress bar */}
      <div style={S.progressWrap}>
        <div style={S.progressFill} />
      </div>

      {/* Main content */}
      <div style={S.content}>
        {renderCurrentStep()}
      </div>
    </div>
  );
}
