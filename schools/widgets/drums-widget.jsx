function DrumsWidget({ accent }) {
  const { useState } = React;
  const [flash, setFlash] = useState({});
  const AUDIO_BASE = null;

  const PADS = [
    { id: 'crash',   label: 'Crash',    emoji: '💥', file: 'crash.wav',    color: '#F59E0B' },
    { id: 'hihat',   label: 'Hi-Hat',   emoji: '🔔', file: 'hihat.wav',    color: '#818CF8' },
    { id: 'ride',    label: 'Ride',     emoji: '🎵', file: 'ride.wav',     color: '#06B6D4' },
    { id: 'tom1',    label: 'Tom 1',    emoji: '🥁', file: 'tom1.wav',     color: '#EC4899' },
    { id: 'snare',   label: 'Snare',    emoji: '💢', file: 'snare.wav',    color: accent || '#E04D27' },
    { id: 'tom2',    label: 'Tom 2',    emoji: '🥁', file: 'tom2.wav',     color: '#F97316' },
    { id: 'floortom',label: 'Floor Tom',emoji: '🥁', file: 'floortom.wav', color: '#8B5CF6' },
    { id: 'kick',    label: 'Kick',     emoji: '💣', file: 'kick.wav',     color: '#22C55E' },
  ];

  const FALLBACK_FREQS = {
    crash: { f: 800, type: 'sawtooth', dur: 0.8 },
    hihat: { f: 1200, type: 'square',  dur: 0.15 },
    ride:  { f: 900,  type: 'sawtooth',dur: 0.5 },
    tom1:  { f: 180,  type: 'sine',    dur: 0.3 },
    snare: { f: 220,  type: 'square',  dur: 0.2 },
    tom2:  { f: 140,  type: 'sine',    dur: 0.35 },
    floortom: { f: 100, type: 'sine',  dur: 0.4 },
    kick:  { f: 60,   type: 'sine',    dur: 0.5 },
  };

  const hit = (pad) => {
    setFlash(f => ({ ...f, [pad.id]: true }));
    setTimeout(() => setFlash(f => ({ ...f, [pad.id]: false })), 150);

    const audio = new Audio(AUDIO_BASE + pad.file);
    audio.play().catch(() => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const fb = FALLBACK_FREQS[pad.id] || { f: 200, type: 'sine', dur: 0.3 };
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = fb.f;
      osc.type = fb.type;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fb.dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + fb.dur);
    });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 520, margin: '0 auto' }}>
        {PADS.map(pad => (
          <button
            key={pad.id}
            onClick={() => hit(pad)}
            onTouchStart={e => { e.preventDefault(); hit(pad); }}
            style={{
              aspectRatio: '1',
              background: flash[pad.id] ? pad.color : '#1a1a1a',
              border: `2px solid ${flash[pad.id] ? pad.color : '#333'}`,
              borderRadius: 12,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.08s',
              transform: flash[pad.id] ? 'scale(0.93)' : 'scale(1)',
              boxShadow: flash[pad.id] ? `0 0 20px ${pad.color}66` : 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <span style={{ fontSize: 22 }}>{pad.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: flash[pad.id] ? '#fff' : '#999', letterSpacing: '0.04em' }}>{pad.label}</span>
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#aaa' }}>
        Tap the pads to play. Kick is the big one in the bottom right.
      </div>
    </div>
  );
}
window.DrumsWidget = DrumsWidget;
