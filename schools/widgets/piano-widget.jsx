function PianoWidget({ accent }) {
  const { useState, useCallback, useRef } = React;
  const [pressed, setPressed] = useState({});
  const audioCtx = useRef(null);

  const AUDIO_BASE = null;

  const KEYS = [
    { note: 'C4',  label: 'C', white: true },
    { note: 'Cs4', label: '',  white: false },
    { note: 'D4',  label: 'D', white: true },
    { note: 'Ds4', label: '',  white: false },
    { note: 'E4',  label: 'E', white: true },
    { note: 'F4',  label: 'F', white: true },
    { note: 'Fs4', label: '',  white: false },
    { note: 'G4',  label: 'G', white: true },
    { note: 'Gs4', label: '',  white: false },
    { note: 'A4',  label: 'A', white: true },
    { note: 'As4', label: '',  white: false },
    { note: 'B4',  label: 'B', white: true },
  ];

  const playNote = useCallback((note) => {
    const playOsc = () => {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const FREQS = { C4:261.6, Cs4:277.2, D4:293.7, Ds4:311.1, E4:329.6, F4:349.2, Fs4:370.0, G4:392.0, Gs4:415.3, A4:440.0, As4:466.2, B4:493.9 };
      osc.frequency.value = FREQS[note] || 440;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    };
    if (AUDIO_BASE) {
      const audio = new Audio(AUDIO_BASE + note + '.wav');
      audio.play().catch(playOsc);
    } else {
      playOsc();
    }
    setPressed(p => ({ ...p, [note]: true }));
    setTimeout(() => setPressed(p => ({ ...p, [note]: false })), 200);
  }, []);

  const whites = KEYS.filter(k => k.white);
  const KEY_W = 44, KEY_H = 140, BLACK_W = 28, BLACK_H = 90;

  const blackOffset = (noteIdx) => {
    const whitesBefore = KEYS.slice(0, KEYS.findIndex(k => k.note === KEYS[noteIdx].note)).filter(k => k.white).length;
    return whitesBefore * KEY_W - BLACK_W / 2;
  };

  return (
    <div style={{ overflowX: 'auto', padding: '16px 0' }}>
      <div style={{ position: 'relative', height: KEY_H + 16, width: whites.length * KEY_W, margin: '0 auto', minWidth: 300 }}>
        {/* White keys */}
        {KEYS.map((k, i) => k.white && (
          <div
            key={k.note}
            onMouseDown={() => playNote(k.note)}
            onTouchStart={e => { e.preventDefault(); playNote(k.note); }}
            style={{
              position: 'absolute',
              left: KEYS.slice(0, i).filter(x => x.white).length * KEY_W,
              top: 0,
              width: KEY_W - 2,
              height: KEY_H,
              background: pressed[k.note] ? (accent + '30') : '#fff',
              border: '1px solid #ccc',
              borderRadius: '0 0 6px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 8,
              fontSize: 11,
              fontWeight: 600,
              color: '#888',
              userSelect: 'none',
              transition: 'background 0.08s',
              boxShadow: pressed[k.note] ? 'inset 0 -2px 4px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.15)',
            }}
          >
            {k.label}
          </div>
        ))}
        {/* Black keys */}
        {KEYS.map((k, i) => !k.white && (
          <div
            key={k.note}
            onMouseDown={() => playNote(k.note)}
            onTouchStart={e => { e.preventDefault(); playNote(k.note); }}
            style={{
              position: 'absolute',
              left: blackOffset(i),
              top: 0,
              width: BLACK_W,
              height: BLACK_H,
              background: pressed[k.note] ? '#333' : '#1a1a1a',
              borderRadius: '0 0 4px 4px',
              cursor: 'pointer',
              zIndex: 2,
              userSelect: 'none',
              transition: 'background 0.08s',
              boxShadow: pressed[k.note] ? 'none' : '0 4px 8px rgba(0,0,0,0.4)',
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#aaa' }}>
        Click or tap the keys to play
      </div>
    </div>
  );
}
window.PianoWidget = PianoWidget;
