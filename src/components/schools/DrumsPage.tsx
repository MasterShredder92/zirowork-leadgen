'use client';

import { Fragment, useState } from 'react';
import DrumsWidget from '@/components/schools/widgets/DrumsWidget';
import type { School, Testimonial, Photo } from '@/lib/schools/getSchool';

export default function DrumsPage({ school, intakeUrl }: { school: School; intakeUrl: string | null }) {
  const accent = school.accent || '#E04D27';
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const STATS = [
    { icon: '👶', label: 'Ages ' + (school.ageMin || 4) + '+' },
    { icon: '📋', label: 'No Contracts' },
    { icon: '🎓', label: (school.teachers?.length || '10') + '+ Teachers' },
    { icon: '🥁', label: 'Private Lessons' },
  ];

  const HERO_STATS = (school.stats && school.stats.length > 0)
    ? school.stats.slice(0, 3)
    : [
        { value: '#1', label: 'Ranked in ' + (school.city || 'Your City') },
        { value: '500+', label: 'Students Enrolled' },
        { value: '1,000+', label: 'Lessons Taught' },
      ];

  const KIDS_BENEFITS = [
    { icon: '🌟', title: 'Confidence', body: 'There is nothing like holding down the beat for a whole song. Drummers learn to lead from behind the kit — and that confidence shows up everywhere else in life.' },
    { icon: '🧠', title: 'Focus & Coordination', body: 'Drumming wires both sides of the brain at once — timing, independence, and control. Kids build focus and motor skills that carry into every classroom.' },
    { icon: '⚡', title: 'Energy Outlet', body: 'All that energy finally has somewhere productive to go. Drums turn restlessness into rhythm — and parents tell us the difference shows up at home, too.' },
  ];

  const ADULT_BENEFITS = [
    { icon: '⏰', title: "It's Never Too Late", body: 'Adults often progress faster than children because motivation is self-driven. Many of our most enthusiastic drummers started in their 40s, 50s, and beyond.' },
    { icon: '🧘', title: 'Stress Relief', body: "Nothing clears a day like hitting things in time. Drumming is one of the most physical, present-moment instruments there is — a full reset, every session." },
    { icon: '🚀', title: 'Real Skills Fast', body: 'Drums reward you early. Most adults are playing a solid beat in their first lesson and along to real songs within weeks — visible progress, every single week.' },
  ];

  const PAIN = [
    { icon: '🥁', title: 'No Drum Kit at Home', body: "You don't need one to start. Practice pads cost less than a pizza, and our studio kits handle the loud part. We'll tell you if and when a kit makes sense." },
    { icon: '🔊', title: 'Worried About the Noise', body: "It's the number one question we get. Practice pads are nearly silent, and electronic kits with headphones keep the whole house happy. There's a quiet path for everyone." },
    { icon: '🤲', title: 'Coordination Feels Impossible', body: "Four limbs doing four different things feels impossible at first — for everyone. Our teachers break it down one limb at a time, and it clicks faster than you'd expect." },
    { icon: '😤', title: 'Lessons That Kill Motivation', body: "We don't drill rudiments in silence for months. Students play beats from real songs they love from day one, while building real technique underneath." },
    { icon: '🎯', title: 'Feeling Lost Without a Clear Path', body: "We set milestones with every student. You'll always know where you are, what you're working toward, and exactly how far you've come." },
  ];

  const TEACHERS = [
    { type: 'The Groove Keeper', icon: '🥁', desc: 'Song-first and steady. Perfect for beginners who want to lock in a beat and play along to real songs from day one.' },
    { type: 'The Song Drummer', icon: '🎵', desc: 'Dynamics, fills, and feel. Perfect for intermediate players ready for fills, dynamics, and playing full songs start to finish.' },
    { type: 'The Technician', icon: '⚙️', desc: 'Precision and discipline. Perfect for serious players chasing speed, independence, and rudiment mastery.' },
  ];

  const STEPS = [
    { n: '01', title: 'Fill Out the Form', body: 'Takes two minutes. Tell us about your student, goals, and schedule. No commitment, no credit card.' },
    { n: '02', title: 'We Find Your Teacher', body: 'We match your student with a teacher who fits their personality, goals, and availability. We handle this part for you.' },
    { n: '03', title: 'Book Your First Session', body: "Show up, play drums, and decide if it's a fit. No pressure either way." },
  ];

  const FAQS = [
    { q: 'Do I need a drum kit to start?', a: "Not at all. Practice pads and our studio kits mean you can start lessons without owning anything. When the time is right, we'll help you choose between an acoustic or electronic kit." },
    { q: 'What about the noise?', a: "Practice pads are nearly silent, and electronic kits with headphones are perfect for apartments and shared walls. Most students do their loud playing at the studio and their quiet practice at home." },
    { q: 'What if my child loses interest?', a: "Lessons are month-to-month — no contracts, no semester commitments, no cancellation penalties. That said, our teachers are matched to keep students motivated, and most kids who start drums don't want to stop." },
    { q: 'Where are your locations?', a: "Our address, hours, and directions are right on this page — scroll down to the location card. Or fill out the form and we'll reach out with everything you need." },
  ];

  const addressFull = [school.address, school.city, school.state].filter(Boolean).join(', ');
  const mapsUrl = school.mapUrl || (addressFull ? 'https://maps.google.com/?q=' + encodeURIComponent(addressFull) : null);

  function renderTestimonial(index: number, dark: boolean) {
    const t: Testimonial | undefined = school.testimonials?.[index];
    const text = t ? (typeof t === 'string' ? t : (t.text || t.quote || '')) : null;
    const author = t && typeof t === 'object' ? t.author : null;
    return (
      <section style={{ padding: '32px 24px 48px', background: dark ? 'linear-gradient(135deg, #0f0e1a 0%, #1a1535 50%, #0d1f4a 100%)' : '#f0f0ee' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ color: '#FFB800', fontSize: 21, flexShrink: 0, marginTop: 2 }}>★★★★★</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, color: dark ? 'rgba(255,255,255,0.85)' : '#333', lineHeight: 1.75, fontStyle: text ? 'italic' : 'normal' }}>
              {text
                ? `"${text}"`
                : <span style={{ color: dark ? 'rgba(255,255,255,0.3)' : '#bbb', fontSize: 15 }}>Testimonial #{index + 1} — added during client onboarding.</span>
              }
            </div>
            {author && (
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: dark ? 'rgba(255,255,255,0.6)' : '#888' }}>— {author}</div>
            )}
            {!text && (
              <div style={{ marginTop: 8, fontSize: 13, color: dark ? 'rgba(255,255,255,0.2)' : '#ccc', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Placeholder</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderPhotoBreak(photoIndex: number, caption: string) {
    const photos = school.photos || [];
    const photo: Photo | undefined = photos[photoIndex];
    const src = photo ? (typeof photo === 'string' ? photo : photo.url) : null;
    return (
      <section style={{ padding: '0 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          {src
            ? (
              <div style={{ borderRadius: 16, overflow: 'hidden', height: 280, position: 'relative' }}>
                <img src={src} alt={school.name + ' studio'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', color: '#fff', fontSize: 15, fontWeight: 600 }}>
                  {caption}
                </div>
              </div>
            )
            : (
              <div style={{ borderRadius: 16, height: 280, background: '#ebebea', border: '2px dashed #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 29 }}>📷</div>
                <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>Studio Photo {photoIndex + 1} — added during onboarding</div>
              </div>
            )
          }
        </div>
      </section>
    );
  }

  const heroTestimonial: Testimonial | undefined = school.testimonials?.[0];
  const heroTestimonialText = heroTestimonial
    ? (typeof heroTestimonial === 'string' ? heroTestimonial : (heroTestimonial.text || heroTestimonial.quote || ''))
    : null;
  const heroTestimonialAuthor = heroTestimonial && typeof heroTestimonial === 'object' ? heroTestimonial.author : null;

  return (
    <Fragment>
      <style>{`
        .swipe-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        @media (max-width: 768px) {
          .swipe-row { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 16px; padding: 4px 24px 16px; margin: 0 -24px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .swipe-row::-webkit-scrollbar { display: none; }
          .swipe-row > * { flex: 0 0 80vw; scroll-snap-align: start; min-width: 0; }
        }
      `}</style>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0f0e1a 0%, #1a1535 50%, #0d1f4a 100%)', color: '#fff', padding: '80px 24px 0' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>

          {/* School name pill */}
          <div style={{ display: 'inline-block', background: accent + '33', color: accent, padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 32 }}>
            {school.name}
          </div>

          {/* Big headline */}
          <h1 style={{ fontSize: 'clamp(52px, 12vw, 110px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 0.95, textTransform: 'uppercase', margin: '0 0 32px' }}>
            <span style={{ display: 'block', color: '#fff', fontWeight: 400 }}>THIS IS WHERE</span>
            <span style={{ display: 'block', color: accent }}>DRUMMERS</span>
            <span style={{ display: 'block', color: '#fff' }}>ARE MADE.</span>
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.6)', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            {school.tagline || ('Private one-on-one sessions for ages ' + (school.ageMin || 5) + ' to adult. Your teacher is already waiting.')}
          </p>

          {/* Primary CTA */}
          <a href={intakeUrl ?? undefined} style={{ display: 'inline-block', padding: '16px 44px', background: accent, color: '#fff', borderRadius: 50, fontSize: 17, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', letterSpacing: '-0.01em' }}>
            Sign Up For Lessons Now →
          </a>

          {/* Inline testimonial card */}
          <div style={{ margin: '40px auto 0', maxWidth: 560, background: 'rgba(255,255,255,0.06)', borderRadius: 14, borderLeft: '3px solid ' + accent, padding: '20px 24px', textAlign: 'left' }}>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontStyle: 'italic' }}>
              {heroTestimonialText
                ? `"${heroTestimonialText}"`
                : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'normal' }}>Testimonial added during client onboarding.</span>
              }
            </div>
            {heroTestimonialAuthor && (
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>— {heroTestimonialAuthor}</div>
            )}
          </div>

          {/* Stats badges row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', margin: '48px 0 0', paddingBottom: 64 }}>
            {HERO_STATS.map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 28px', minWidth: 120, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: accent, lineHeight: 1.1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '18px 24px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '16px 48px', flexWrap: 'wrap' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17 }}>{s.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Play a Beat — Widget */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: accent + '18', color: accent, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Don&apos;t Just Take Our Word For It</div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Play a <span style={{ color: accent }}>beat.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#888', margin: '0 0 40px' }}>
            Eight pads. Real sounds. Go ahead — make some noise.
          </p>
          <DrumsWidget accent={accent} />
        </div>
      </section>

      {/* Why Drums Change Kids */}
      <section style={{ padding: '80px 24px', background: '#f8f8f6' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-block', background: accent + '18', color: accent, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>For Kids</div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Why drums change <span style={{ color: accent }}>kids.</span>
            </h2>
          </div>
          <div className="swipe-row">
            {KIDS_BENEFITS.map((b, i) => (
              <div key={i} style={{ padding: '32px 28px', background: '#fff', borderRadius: 16, border: '1.5px solid #d0d0ce', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: 33, marginBottom: 14 }}>{b.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 15, color: '#666', lineHeight: 1.75 }}>{b.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo break 1 — after Kids, before Adults */}
      {renderPhotoBreak(0, school.name + ' — where the beat begins.')}

      {/* Why Adults Play Drums */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-block', background: accent + '18', color: accent, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>For Adults</div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Why adults play <span style={{ color: accent }}>drums.</span>
            </h2>
          </div>
          <div className="swipe-row">
            {ADULT_BENEFITS.map((b, i) => (
              <div key={i} style={{ padding: '32px 28px', background: '#f8f8f6', borderRadius: 16, border: '1.5px solid #d0d0ce', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: 33, marginBottom: 14 }}>{b.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 15, color: '#666', lineHeight: 1.75 }}>{b.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo break 2 — after Adults, before Pain Points */}
      {renderPhotoBreak(1, 'Real students. Real progress. Real joy.')}

      {/* Pain Points */}
      <section style={{ padding: '80px 24px', background: '#f8f8f6' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              We&apos;ve heard every <span style={{ color: accent }}>one of these.</span>
            </h2>
            <p style={{ fontSize: 16, color: '#888', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Every concern is real. Here&apos;s how we address each one.
            </p>
          </div>
          <div className="swipe-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {PAIN.map((p, i) => (
              <div key={i} style={{ padding: '28px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #d0d0ce', borderLeft: '3px solid ' + accent, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: 29, marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#1a1a1a', lineHeight: 1.3 }}>{p.title}</div>
                <div style={{ fontSize: 15, color: '#666', lineHeight: 1.75 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Archetypes */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Your teacher is already <span style={{ color: accent }}>here.</span>
            </h2>
            <p style={{ fontSize: 16, color: '#888', margin: 0, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
              Every drummer is different. We match you based on your goals, style, and personality.
            </p>
          </div>
          <div className="swipe-row">
            {TEACHERS.map((t, i) => (
              <div key={i} style={{ padding: '32px 28px', background: '#f8f8f6', borderRadius: 16, border: '1.5px solid #d0d0ce', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: accent + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23 }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{t.type}</div>
                  <div style={{ fontSize: 15, color: '#666', lineHeight: 1.75 }}>{t.desc}</div>
                </div>
                <a href={intakeUrl ?? undefined} style={{ marginTop: 'auto', fontSize: 14, fontWeight: 700, color: accent, textDecoration: 'none' }}>
                  This sounds like me →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo break 3 — after Teachers */}
      {renderPhotoBreak(2, 'Your teacher is already here.')}

      {/* Testimonials — What Families Are Saying */}
      <section style={{ padding: '64px 24px 0', background: '#f0f0ee' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            What families are <span style={{ color: accent }}>saying.</span>
          </h2>
        </div>
      </section>

      {/* Testimonial 2 — after teacher archetypes */}
      {renderTestimonial(1, false)}

      {/* Testimonial 3 */}
      {renderTestimonial(2, false)}

      {/* 3 Steps */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              3 steps. <span style={{ color: accent }}>That&apos;s it.</span>
            </h2>
            <p style={{ fontSize: 16, color: '#888', margin: 0 }}>From today to your first lesson in minutes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0, letterSpacing: '0.05em' }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 15, color: '#666', lineHeight: 1.7 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <a href={intakeUrl ?? undefined} style={{ display: 'inline-block', padding: '15px 44px', background: accent, color: '#fff', borderRadius: 50, fontSize: 16, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
              Sign Up Now →
            </a>
          </div>
        </div>
      </section>

      {/* Drums Are Just the Start — cross-instrument */}
      <section style={{ padding: '80px 24px', background: '#f8f8f6' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Drums are just <span style={{ color: accent }}>the start.</span>
          </h2>
          <p style={{ fontSize: 17, color: '#444', lineHeight: 1.85, margin: 0 }}>
            More than one kid? Want to add an instrument down the road? Piano, guitar, voice, and drums — one school, one family, every lesson under one roof.
          </p>
        </div>
      </section>

      {/* FAQ — accordion */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 52px', letterSpacing: '-0.02em' }}>
            Frequently <span style={{ color: accent }}>asked.</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background: '#f8f8f6', borderRadius: 12, border: '1.5px solid #d8d8d6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}
                >
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4 }}>{f.q}</span>
                  <span style={{ fontSize: 25, fontWeight: 300, color: accent, flexShrink: 0, lineHeight: 1 }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', fontSize: 15, color: '#555', lineHeight: 1.75, borderTop: '1px solid #f0f0ee' }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      {school.about && (
        <section style={{ padding: '80px 24px', background: '#f8f8f6' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
              The story behind <span style={{ color: accent }}>the school.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#444', lineHeight: 1.85, margin: 0 }}>{school.about}</p>
            {school.directorName && (
              <div style={{ marginTop: 24, fontSize: 15, fontWeight: 600, color: '#888' }}>— {school.directorName}, {school.name}</div>
            )}
          </div>
        </section>
      )}

      {/* Location Card */}
      {(school.address || school.phone) && (
        <section style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {school.name}
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: '#888', margin: '0 0 32px' }}>
              {school.city}{school.state ? ', ' + school.state : ''}
            </p>
            <div style={{ background: '#f8f8f6', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #d0d0ce', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', height: 200, background: 'linear-gradient(135deg, #e4e4e0 0%, #d8d8d4 100%)', position: 'relative', textDecoration: 'none' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>📍</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>Open in Google Maps</div>
                    {school.address && <div style={{ fontSize: 13, color: '#666' }}>{school.address}</div>}
                  </div>
                </a>
              )}
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', gap: '24px 48px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: mapsUrl ? 28 : 0 }}>
                  {school.address && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Address</div>
                      <div style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>{school.address}</div>
                      {school.city && <div style={{ fontSize: 15, color: '#666' }}>{school.city}{school.state ? ', ' + school.state : ''}</div>}
                    </div>
                  )}
                  {school.phone && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Phone</div>
                      <a href={'tel:' + school.phone.replace(/\D/g, '')} style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', textDecoration: 'none', display: 'block' }}>{school.phone}</a>
                    </div>
                  )}
                  {school.hours && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Hours</div>
                      {typeof school.hours === 'string'
                        ? <div style={{ fontSize: 15, color: '#555', lineHeight: 1.6 }}>{school.hours}</div>
                        : (
                          <div style={{ fontSize: 15, color: '#555', lineHeight: 1.7 }}>
                            {school.hours.weekdays && <div>{school.hours.weekdays}</div>}
                            {school.hours.weekends && <div>{school.hours.weekends}</div>}
                          </div>
                        )
                      }
                    </div>
                  )}
                </div>
                {mapsUrl && (
                  <div style={{ textAlign: 'center' }}>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 28px', background: accent, color: '#fff', borderRadius: 9, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                      Get Directions →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section style={{ padding: '96px 24px', background: accent, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1 }}>
            Your drummer is waiting for you.
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.82)', margin: '0 0 40px', lineHeight: 1.65 }}>
            Your future drummer is one form away. Fair warning — pots and pans are not safe.
          </p>
          <a href={intakeUrl ?? undefined} style={{ display: 'inline-block', padding: '16px 44px', background: '#fff', color: accent, borderRadius: 50, fontSize: 17, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Get Signed Up Now →
          </a>
          <div style={{ marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            {school.phone && <span>{school.phone}</span>}
            {school.phone && school.city && <span> · </span>}
            {school.city && <span>{school.city}{school.state ? ', ' + school.state : ''}</span>}
          </div>
        </div>
      </section>

    </Fragment>
  );
}
