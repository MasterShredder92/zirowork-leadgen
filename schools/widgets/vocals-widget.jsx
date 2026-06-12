function VocalsWidget({ accent }) {
  const { useState, useRef, useEffect } = React;
  const [state, setState] = useState('idle'); // idle | recording | recorded | playing
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const blobRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const [bars, setBars] = useState(Array(20).fill(4));

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        stream.getTracks().forEach(t => t.stop());
        setState('recorded');
        clearInterval(timerRef.current);
        setSeconds(0);
      };
      mr.start();
      mediaRef.current = mr;
      setState('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

      const animate = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const b = Array.from({ length: 20 }, (_, i) => {
          const v = data[Math.floor(i * data.length / 20)] || 0;
          return Math.max(4, Math.round((v / 255) * 60));
        });
        setBars(b);
        if (mediaRef.current?.state === 'recording') requestAnimationFrame(animate);
        else setBars(Array(20).fill(4));
      };
      requestAnimationFrame(animate);
    } catch {
      alert('Microphone access is required to record. Please allow it and try again.');
    }
  };

  const stop = () => mediaRef.current?.stop();

  const play = () => {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    audioRef.current = new Audio(url);
    audioRef.current.play();
    setState('playing');
    audioRef.current.onended = () => setState('recorded');
  };

  const reset = () => {
    audioRef.current?.pause();
    blobRef.current = null;
    setState('idle');
    setBars(Array(20).fill(4));
    setSeconds(0);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Waveform bars */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 72, marginBottom: 24 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            width: 6, height: h, borderRadius: 3,
            background: state === 'recording' ? accent : (state === 'playing' ? '#22C55E' : '#e5e5e3'),
            transition: state === 'recording' ? 'height 0.08s' : 'height 0.3s, background 0.3s',
          }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
        {state === 'idle' && (
          <button onClick={start} style={{ padding: '12px 28px', background: accent, color: '#fff', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            Record your voice
          </button>
        )}
        {state === 'recording' && (
          <button onClick={stop} style={{ padding: '12px 28px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fff', display: 'inline-block' }} />
            Stop · {seconds}s
          </button>
        )}
        {(state === 'recorded' || state === 'playing') && (
          <>
            <button onClick={play} disabled={state === 'playing'} style={{ padding: '12px 24px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: state === 'playing' ? 'default' : 'pointer', opacity: state === 'playing' ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {state === 'playing' ? '▶ Playing...' : '▶ Play back'}
            </button>
            <button onClick={reset} style={{ padding: '12px 24px', background: '#f7f7f5', color: '#555', border: '1px solid #e5e5e3', borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Re-record
            </button>
          </>
        )}
      </div>
      <div style={{ marginTop: 16, fontSize: 14, color: '#aaa' }}>
        {state === 'idle' && 'Hear how your voice sounds. No account needed.'}
        {state === 'recording' && 'Recording in progress — sing anything!'}
        {state === 'recorded' && 'Nice! Play it back to hear yourself.'}
        {state === 'playing' && 'Listen to your recording...'}
      </div>
    </div>
  );
}
window.VocalsWidget = VocalsWidget;
