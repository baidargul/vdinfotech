"use client";

import { useEffect, useRef, useState } from "react";

export type AdvancedLinkValue = {
  href: string;
  target: "_blank" | null;
  rel: string | null;
  download: string | null;
};

type LinkMode = "external" | "internal" | "download";
type Target = { title: string; url: string; type: string };
type DownloadFile = { id: string; name: string; url: string; size: number; mimeType: string };

function modeFromHref(href: string): LinkMode {
  if (/^\/download\/[a-f0-9]{24}$/.test(href)) return "download";
  if (/^\/(?!\/)/.test(href)) return "internal";
  return "external";
}

function readableSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AdvancedLinkDialog({
  initialValue,
  postId,
  onApply,
  onClose,
  onRemove,
}: {
  initialValue: AdvancedLinkValue;
  postId?: string;
  onApply: (value: AdvancedLinkValue) => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  const initialMode = modeFromHref(initialValue.href);
  const [mode, setMode] = useState<LinkMode>(initialMode);
  const [href, setHref] = useState(initialMode === "external" ? initialValue.href : "");
  const [newTab, setNewTab] = useState(initialValue.href ? initialValue.target === "_blank" : true);
  const [error, setError] = useState("");
  const [internalQuery, setInternalQuery] = useState("");
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(
    initialMode === "internal" ? { title: "Current internal link", url: initialValue.href, type: "Selected" } : null,
  );
  const [fileQuery, setFileQuery] = useState("");
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<DownloadFile | null>(
    initialMode === "download" ? { id: initialValue.href.split("/").pop() || "", name: initialValue.download || "Linked file", url: initialValue.href, size: 0, mimeType: "" } : null,
  );
  const [uploading, setUploading] = useState(false);
  const [newUpload, setNewUpload] = useState<DownloadFile | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== "internal") return;
    let ignore = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/link-targets?q=${encodeURIComponent(internalQuery)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load link destinations.");
        if (!ignore) setTargets(result.targets);
      } catch (requestError) {
        if (!ignore) setError(requestError instanceof Error ? requestError.message : "Could not load link destinations.");
      } finally {
        if (!ignore) setTargetsLoading(false);
      }
    }, 250);
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [internalQuery, mode]);

  useEffect(() => {
    if (mode !== "download") return;
    let ignore = false;
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: fileQuery, ...(postId ? { postId } : {}) });
        const response = await fetch(`/api/files?${params}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load files.");
        if (!ignore) {
          setFiles(result.files);
          const current = result.files.find((file: DownloadFile) => file.url === initialValue.href);
          if (current) setSelectedFile(current);
        }
      } catch (requestError) {
        if (!ignore) setError(requestError instanceof Error ? requestError.message : "Could not load files.");
      } finally {
        if (!ignore) setFilesLoading(false);
      }
    }, 250);
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [fileQuery, initialValue.href, mode, postId]);

  const removeTemporaryUpload = async () => {
    if (newUpload) await fetch(`/api/files/${newUpload.id}`, { method: "DELETE" }).catch(() => undefined);
  };

  const cancel = () => {
    void removeTemporaryUpload();
    onClose();
  };

  const apply = () => {
    setError("");
    if (mode === "external") {
      let normalized = href.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) normalized = `mailto:${normalized}`;
      else if (!/^(https?:\/\/|mailto:)/i.test(normalized)) normalized = `https://${normalized}`;
      try {
        const url = new URL(normalized);
        if (!["http:", "https:", "mailto:"].includes(url.protocol)) throw new Error();
      } catch {
        setError("Enter a valid website URL or email address.");
        return;
      }
      void removeTemporaryUpload();
      onApply({
        href: normalized,
        target: newTab && !normalized.startsWith("mailto:") ? "_blank" : null,
        rel: newTab && !normalized.startsWith("mailto:") ? "noopener noreferrer" : null,
        download: null,
      });
      return;
    }
    if (mode === "internal") {
      if (!selectedTarget) { setError("Select an internal destination."); return; }
      void removeTemporaryUpload();
      onApply({ href: selectedTarget.url, target: null, rel: null, download: null });
      return;
    }
    if (!selectedFile) { setError("Upload or select a file."); return; }
    if (newUpload && selectedFile.id !== newUpload.id) void removeTemporaryUpload();
    onApply({ href: selectedFile.url, target: null, rel: null, download: selectedFile.name });
  };

  const upload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      if (newUpload) await removeTemporaryUpload();
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/files", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "File upload failed.");
      setNewUpload(result);
      setSelectedFile(result);
      setFiles((current) => [result, ...current.filter((item) => item.id !== result.id)]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const selectMode = (nextMode: LinkMode) => {
    setMode(nextMode);
    setError("");
    if (nextMode === "internal") setTargetsLoading(true);
    if (nextMode === "download") setFilesLoading(true);
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); cancel(); return; }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return <div className="link-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) cancel(); }}>
    <section ref={dialogRef} className="link-dialog advanced-link-dialog" role="dialog" aria-modal="true" aria-labelledby="link-dialog-title" onKeyDown={handleDialogKeyDown}>
      <div className="link-dialog-heading"><div><span>Advanced link</span><h2 id="link-dialog-title">Choose a destination</h2></div><button type="button" onClick={cancel} aria-label="Close link dialog">×</button></div>
      <div className="link-dialog-tabs" role="tablist" aria-label="Link type" onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const order: LinkMode[] = ["external", "internal", "download"];
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = order[(order.indexOf(mode) + direction + order.length) % order.length];
        selectMode(next);
        requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus());
      }}>
        {(["external", "internal", "download"] as LinkMode[]).map((tab) => <button key={tab} data-tab={tab} role="tab" aria-selected={mode === tab} className={mode === tab ? "is-active" : ""} type="button" onClick={() => selectMode(tab)}>{tab === "external" ? "External site" : tab === "internal" ? "Internal page" : "Download file"}</button>)}
      </div>

      <div className="link-dialog-panel" role="tabpanel">
        {mode === "external" && <><label><span>Website URL or email</span><input autoFocus type="text" value={href} onChange={(event) => { setHref(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); apply(); } }} placeholder="https://example.com" /></label><label className="link-toggle"><input type="checkbox" checked={newTab} onChange={(event) => setNewTab(event.target.checked)} /><span><strong>Open in a new tab</strong><small>Recommended for external websites</small></span></label></>}
        {mode === "internal" && <><label><span>Search pages and published posts</span><input autoFocus type="search" value={internalQuery} onChange={(event) => { setInternalQuery(event.target.value); setTargetsLoading(true); setError(""); }} placeholder="Search by page or post title" /></label><div className="link-picker-list">{targetsLoading ? <p>Loading destinations...</p> : targets.length ? targets.map((target) => <button className={selectedTarget?.url === target.url ? "is-selected" : ""} type="button" key={target.url} onClick={() => setSelectedTarget(target)}><span><strong>{target.title}</strong><small>{target.type}</small></span><code>{target.url}</code></button>) : <p>No matching destinations found.</p>}</div></>}
        {mode === "download" && <><button className="file-upload-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? "Uploading file..." : "+ Upload a new file"}<small>PDF, Office, TXT, CSV or ZIP · max 20 MB</small></button><input ref={fileInputRef} hidden type="file" accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv,.zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} /><label><span>Or choose an uploaded file</span><input type="search" value={fileQuery} onChange={(event) => { setFileQuery(event.target.value); setFilesLoading(true); setError(""); }} placeholder="Search your files" /></label><div className="link-picker-list file-picker-list">{filesLoading ? <p>Loading files...</p> : files.length ? files.map((file) => <button className={selectedFile?.id === file.id ? "is-selected" : ""} type="button" key={file.id} onClick={() => setSelectedFile(file)}><span><strong>{file.name}</strong><small>{readableSize(file.size)}</small></span><code>Download</code></button>) : <p>No reusable files found.</p>}</div></>}
      </div>

      {error && <p className="link-dialog-error" role="alert">{error}</p>}
      <div className="link-dialog-actions">{initialValue.href && <button className="link-remove" type="button" onClick={() => { void removeTemporaryUpload(); onRemove(); }}>Remove link</button>}<button type="button" onClick={cancel}>Cancel</button><button className="link-apply" type="button" onClick={apply}>Apply link</button></div>
    </section>
  </div>;
}
