"use client";

import { useEffect, useState } from "react";

export default function ShareLink({ publicId }: { publicId: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(`${window.location.origin}/u/${publicId}`), [publicId]);

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { document.getElementById("share-url")?.focus(); (document.getElementById("share-url") as HTMLInputElement | null)?.select(); }
  }
  return (
    <div className="glass p-5">
      <label htmlFor="share-url" className="label">Your private link</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="share-url" readOnly value={url} className="input" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" onClick={copy} className="btn btn-primary sm:w-32">{copied ? "Copied ✓" : "Copy link"}</button>
      </div>
      <p className="mt-2 text-xs muted" aria-live="polite">{copied ? "Link copied to clipboard." : "Post it anywhere. Senders stay anonymous."}</p>
    </div>
  );
}
