window.PortalUpload = function PortalUpload({ tenantId, userId }) {
  const [file, setFile] = React.useState(null);
  const [desc, setDesc] = React.useState('');
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploads, setUploads] = React.useState([]);
  const [success, setSuccess] = React.useState(false);
  const inputRef = React.useRef();

  React.useEffect(() => { loadUploads(); }, []);

  async function loadUploads() {
    const { data } = await window.sb
      .from('client_uploads')
      .select('id, file_name, description, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setUploads(data);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file || !desc.trim()) return;
    setUploading(true);
    setSuccess(false);

    const path = `${tenantId}/${Date.now()}-${file.name}`;

    const { error: storageErr } = await window.sb.storage
      .from('client-uploads')
      .upload(path, file);

    if (storageErr) {
      setUploading(false);
      alert('Upload failed: ' + storageErr.message);
      return;
    }

    await window.sb.from('client_uploads').insert({
      tenant_id: tenantId,
      user_id: userId,
      file_name: file.name,
      file_path: path,
      description: desc.trim(),
    });

    setFile(null);
    setDesc('');
    setUploading(false);
    setSuccess(true);
    loadUploads();
    setTimeout(() => setSuccess(false), 4000);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const s = {
    page: { padding: '32px 36px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.2s ease' },
    heading: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--t1)', marginBottom: 4 },
    sub: { fontSize: 13, color: 'var(--t3)', marginBottom: 28 },
    dropzone: {
      border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--bmed)'}`,
      borderRadius: 10, padding: '36px 24px', textAlign: 'center',
      background: dragging ? 'var(--accent-bg)' : 'var(--surface)',
      cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 16,
    },
    dropIcon: { fontSize: 28, marginBottom: 10, lineHeight: 1 },
    dropText: { fontSize: 13, color: 'var(--t2)', marginBottom: 4 },
    dropSub: { fontSize: 11, color: 'var(--t4)' },
    fileName: {
      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
      background: 'var(--accent-bg)', color: 'var(--accent)',
      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
    },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 5 },
    textarea: {
      width: '100%', padding: '10px 12px',
      background: 'var(--bg)', border: '1px solid var(--bmed)',
      borderRadius: 7, fontSize: 13, color: 'var(--t1)',
      resize: 'vertical', minHeight: 72, outline: 'none',
      fontFamily: 'inherit', marginBottom: 14,
    },
    btn: {
      padding: '9px 20px', background: 'var(--accent)', color: '#fff',
      border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
      cursor: uploading || !file || !desc.trim() ? 'not-allowed' : 'pointer',
      opacity: uploading || !file || !desc.trim() ? 0.5 : 1,
      fontFamily: 'inherit',
    },
    successBanner: {
      marginTop: 12, padding: '10px 14px', borderRadius: 7,
      background: '#D1F4E8', color: '#034636', fontSize: 12, fontWeight: 600,
    },
    historyHead: { fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 32, marginBottom: 12 },
    historyItem: {
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    },
    fileIcon: {
      width: 32, height: 32, background: 'var(--accent-bg)',
      borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    histName: { fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 },
    histDesc: { fontSize: 12, color: 'var(--t3)' },
    histDate: { fontSize: 11, color: 'var(--t4)', marginLeft: 'auto', flexShrink: 0, paddingTop: 2 },
  };

  return (
    <div style={s.page}>
      <div style={s.heading}>Upload</div>
      <div style={s.sub}>Send us files and tell us what they are — we'll take it from there</div>

      <div
        style={s.dropzone}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <div style={s.dropIcon}>📎</div>
        <div style={s.dropText}>Drop a file here or click to browse</div>
        <div style={s.dropSub}>PDF, image, spreadsheet, doc — anything works</div>
        {file && <div style={s.fileName}>✓ {file.name}</div>}
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files[0])}
        />
      </div>

      <label style={s.label}>What is this?</label>
      <textarea
        style={s.textarea}
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="e.g. Updated pricing for fall 2026, new teacher schedule, our logo for the landing page…"
      />

      <button style={s.btn} onClick={handleUpload} disabled={uploading || !file || !desc.trim()}>
        {uploading ? 'Uploading…' : 'Send to ZiroWork'}
      </button>

      {success && <div style={s.successBanner}>✓ Uploaded — ZiroWork will review and update your profile</div>}

      {uploads.length > 0 && (
        <>
          <div style={s.historyHead}>Previous uploads</div>
          {uploads.map(u => (
            <div key={u.id} style={s.historyItem}>
              <div style={s.fileIcon}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="var(--accent)" strokeWidth="1.5"/>
                  <path d="M4 5h6M4 7.5h6M4 10h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={s.histName}>{u.file_name}</div>
                <div style={s.histDesc}>{u.description}</div>
              </div>
              <div style={s.histDate}>{formatDate(u.created_at)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
