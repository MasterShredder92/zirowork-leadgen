function GuitarWidget({ accent }) {
  const { useState } = React;
  const [active, setActive] = useState(null);
  const AUDIO_BASE = null;

  const CHORDS = [
    { name: 'C',  fingers: '032010', color: '#818CF8' },
    { name: 'G',  fingers: '320003', color: '#22C55E' },
    { name: 'Am', fingers: '002210', color: '#F97316' },
    { name: 'F',  fingers: '133211', color: '#EC4899' },
    { name: 'D',  fingers: 'xx0232', color: '#F59E0B' },
    { name: 'Em', fingers: '022000', color: '#06B6D4' },
  ];

  const play = (chord) => {
    setActive(chord.name);
    setTimeout(() => setActive(null), 800);
    const audio = new Audio(AUDIO_BASE + 'chord_' + chord.name + '.wav');
    audio.play().catch(() => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const CHORD_FREQS = {
        C: [261.6, 329.6, 392.0, 523.3],
        G: [196.0, 246.9, 293.7, 392.0],
        Am: [220.0, 261.6, 329.6, 440.0],
        F: [174.6, 220.0, 261.6, 349.2],
        D: [146.8, 220.0, 293.7, 370.0],
        Em: [164.8, 196.0, 246.9, 329.6],
      };
      const freqs = CHORD_FREQS[chord.name] || [261.6, 329.6, 392.0];
      freqs.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.5);
        }, i * 40);
      });
    });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 500, margin: '0 auto' }}>
        {CHORDS.map(chord => (
          <button
            key={chord.name}
            onClick={() => play(chord)}
            style={{
              padding: '24px 16px',
              background: active === chord.name ? chord.color : '#f7f7f5',
              border: `2px solid ${active === chord.name ? chord.color : '#e5e5e3'}`,
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
              transform: active === chord.name ? 'scale(0.95)' : 'scale(1)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div style={{ fontSize: 29, fontWeight: 800, color: active === chord.name ? '#fff' : '#1a1a1a', marginBottom: 4 }}>
              {chord.name}
            </div>
            <div style={{ fontSize: 11, color: active === chord.name ? 'rgba(255,255,255,0.7)' : '#aaa', fontWeight: 500, letterSpacing: '0.05em' }}>
              CHORD
            </div>
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#aaa' }}>
        Tap a chord to hear how it sounds
      </div>
    </div>
  );
}
window.GuitarWidget = GuitarWidget;
