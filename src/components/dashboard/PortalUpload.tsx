"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

type UploadRow = {
  id: string;
  file_name: string;
  description: string;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function previewUploads(): UploadRow[] {
  const day = 86400000;
  return [
    { id: "p1", file_name: "fall-2026-pricing.pdf", description: "Updated tuition", created_at: new Date(Date.now() - 2 * day).toISOString() },
    { id: "p2", file_name: "teacher-schedule.xlsx", description: "New Tue/Thu slots", created_at: new Date(Date.now() - 5 * day).toISOString() },
    { id: "p3", file_name: "logo.png", description: "For the landing page", created_at: new Date(Date.now() - 9 * day).toISOString() },
  ];
}

export default function PortalUpload({ tenantId, userId }: { tenantId: string; userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRow[]>(() => tenantId === "preview" ? previewUploads() : []);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-fetch the real upload history after a successful upload.
  function loadUploads() {
    if (tenantId === "preview") return;
    supabase
      .from("client_uploads")
      .select("id, file_name, description, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setUploads(data as UploadRow[]); });
  }

  useEffect(() => {
    if (tenantId === "preview") return;
    supabase
      .from("client_uploads")
      .select("id, file_name, description, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setUploads(data as UploadRow[]); });
  }, [tenantId]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file || !desc.trim()) return;
    setUploading(true);
    setSuccess(false);

    if (tenantId === "preview") {
      setFile(null);
      setDesc("");
      setUploading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      return;
    }

    const path = `${tenantId}/${Date.now()}-${file.name}`;

    const { error: storageErr } = await supabase.storage
      .from("client-uploads")
      .upload(path, file);

    if (storageErr) {
      setUploading(false);
      alert("Upload failed: " + storageErr.message);
      return;
    }

    await supabase.from("client_uploads").insert({
      tenant_id: tenantId,
      user_id: userId,
      file_name: file.name,
      file_path: path,
      description: desc.trim(),
    });

    setFile(null);
    setDesc("");
    setUploading(false);
    setSuccess(true);
    loadUploads();
    setTimeout(() => setSuccess(false), 4000);
  }

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "32px 36px", overflowY: "auto", height: "100%", animation: "fadeIn 0.2s ease" },
    heading: { fontSize: 23, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--t1)", marginBottom: 4 },
    sub: { fontSize: 14, color: "var(--t3)", marginBottom: 28 },
    dropzone: {
      border: `1px dashed ${dragging ? "var(--accent)" : "var(--bmed)"}`,
      borderRadius: 10, padding: "36px 24px", textAlign: "center",
      background: dragging ? "var(--accent-bg)" : "var(--bg)",
      cursor: "pointer", transition: "all 0.15s ease", marginBottom: 16,
    },
    dropIcon: {
      marginBottom: 10, lineHeight: 0, display: "flex", justifyContent: "center",
      color: dragging ? "var(--accent)" : "var(--t4)",
    },
    dropText: { fontSize: 14, color: "var(--t2)", marginBottom: 4 },
    dropSub: { fontSize: 12, color: "var(--t4)" },
    fileName: {
      display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
      background: "var(--accent-bg)", color: "var(--accent)",
      fontSize: 13, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
    },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 5 },
    textarea: {
      width: "100%", padding: "10px 12px",
      background: "var(--bg)", border: "1px solid var(--bmed)",
      borderRadius: 7, fontSize: 14, color: "var(--t1)",
      resize: "vertical", minHeight: 72, outline: "none",
      fontFamily: "inherit", marginBottom: 14,
    },
    btn: {
      padding: "9px 20px", background: "var(--accent)", color: "#fff",
      border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600,
      cursor: uploading || !file || !desc.trim() ? "not-allowed" : "pointer",
      opacity: uploading || !file || !desc.trim() ? 0.5 : 1,
      fontFamily: "inherit",
    },
    successBanner: {
      marginTop: 12, padding: "10px 14px", borderRadius: 7,
      background: "#D1F4E8", color: "#034636", fontSize: 13, fontWeight: 600,
    },
    historyHead: { fontSize: 14, fontWeight: 700, color: "var(--t1)", marginTop: 32, marginBottom: 12 },
    historyItem: {
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 0", borderBottom: "1px solid var(--border)",
    },
    fileIcon: {
      width: 32, height: 32, background: "var(--accent-bg)",
      borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    },
    histName: { fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 2 },
    histDesc: { fontSize: 13, color: "var(--t3)" },
    histDate: { fontSize: 12, color: "var(--t4)", marginLeft: "auto", flexShrink: 0, paddingTop: 2 },
  };

  return (
    <div style={s.page}>
      <div style={s.heading}>Upload</div>
      <div style={s.sub}>Send us files and tell us what they are — we&apos;ll take it from there</div>

      <div
        style={s.dropzone}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div style={s.dropIcon}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M20 11.5l-8 8a5 5 0 01-7-7l8.5-8.5a3.5 3.5 0 015 5L9.5 18a1.75 1.75 0 01-2.5-2.5l7.5-7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={s.dropText}>Drop a file here or click to browse</div>
        <div style={s.dropSub}>PDF, image, spreadsheet, doc — anything works</div>
        {file && <div style={s.fileName}>✓ {file.name}</div>}
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
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
        {uploading ? "Uploading…" : "Send to ZiroWork"}
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
}
