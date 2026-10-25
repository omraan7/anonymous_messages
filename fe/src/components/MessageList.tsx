"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { endpoints, type Message } from "@/lib/api";
import { Alert, Avatar, Spinner, errorText } from "./ui";

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Rendered with key={user.id} by the parent, so switching accounts remounts it and
// no message from the previous account can survive in state.
export default function MessageList() {
  const [items, setItems] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState<Set<string>>(new Set());
  const busy = useRef(false);

  const load = useCallback(async (next?: string | null) => {
    if (busy.current) return; // no duplicate requests
    busy.current = true;
    setError(null);
    try {
      const page = await endpoints.messages(next);
      setItems((prev) => (next ? [...prev, ...page.data] : page.data));
      setCursor(page.nextCursor);
      setState("ready");
    } catch (e) {
      setError(errorText(e));
      if (!next) setState("error");
    } finally { busy.current = false; setMore(false); }
  }, []);

  useEffect(() => { load(null); }, [load]);

  async function remove(id: string) {
    const snapshot = items;
    setItems((p) => p.filter((m) => m.id !== id)); // optimistic
    try { await endpoints.deleteMessage(id); }
    catch (e) { setItems(snapshot); setError(errorText(e)); }
  }

  async function askWho(id: string) {
    if (asking.has(id)) return; // no duplicate requests
    setAsking((s) => new Set(s).add(id));
    setError(null);
    try {
      const status = await endpoints.requestReveal(id);
      setItems((p) => p.map((m) => (m.id === id ? { ...m, reveal: status } : m)));
    } catch (e) { setError(errorText(e)); }
    finally { setAsking((s) => { const n = new Set(s); n.delete(id); return n; }); }
  }

  if (state === "loading")
    return <div className="space-y-3" aria-busy="true" aria-label="Loading messages">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>;
  if (state === "error")
    return <div className="space-y-3"><Alert>{error}</Alert><button className="btn btn-ghost" onClick={() => { setState("loading"); load(null); }}>Try again</button></div>;

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      {items.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>No messages yet</p>
          <p className="mt-1 text-sm muted">Share your link above — anything people send will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="glass rise p-5">
              {m.from && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <Avatar name={m.from.name} src={m.from.avatarUrl} size={28} />
                  <span>From <strong>{m.from.name}</strong></span>
                </div>
              )}
              {/* React escapes this text; message content is never rendered as HTML */}
              <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs muted">
                <time dateTime={m.createdAt}>{fmt(m.createdAt)}</time>
                <div className="flex flex-wrap items-center gap-2">
                  {m.reveal === "none" && (
                    <button className="btn btn-ghost btn-sm" disabled={asking.has(m.id)} onClick={() => askWho(m.id)}>
                      {asking.has(m.id) ? <><Spinner /> Asking…</> : "Who sent this?"}
                    </button>
                  )}
                  {m.reveal === "pending" && <span className="alert alert-info !py-1" role="status">Request sent — waiting for an answer</span>}
                  {m.reveal === "declined" && <span className="alert alert-info !py-1" role="status">They chose to stay anonymous</span>}
                  {m.reveal === "accepted" && m.conversationId && (
                    <Link href={`/conversations/${m.conversationId}`} className="btn btn-primary btn-sm">Open conversation</Link>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(m.id)} aria-label={`Delete message from ${fmt(m.createdAt)}`}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button className="btn btn-ghost w-full" disabled={more} onClick={() => { setMore(true); load(cursor); }}>
          {more ? <><Spinner /> Loading…</> : "Load older messages"}
        </button>
      )}
    </div>
  );
}
