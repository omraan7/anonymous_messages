"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { endpoints, type IncomingRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { REQUESTS_CHANGED } from "@/lib/events";
import { Alert, Avatar, Spinner, errorText } from "@/components/ui";

export default function RequestsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (loading || !user) return <div className="space-y-4" aria-busy="true"><div className="skeleton h-12 w-1/2" /><div className="skeleton h-32" /></div>;
  return <RequestList key={user.id} />;
}

function RequestList() {
  const [items, setItems] = useState<IncomingRequest[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Record<string, string>>({}); // requestId -> conversationId
  const lock = useRef(false);

  const load = useCallback(async () => {
    if (lock.current) return;
    lock.current = true;
    try { setItems(await endpoints.incomingRequests()); setState("ready"); }
    catch (e) { setError(errorText(e)); setState("error"); }
    finally { lock.current = false; }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function answer(r: IncomingRequest, action: "accept" | "decline") {
    if (busy.has(r.id)) return; // no double clicks
    setBusy((s) => new Set(s).add(r.id)); setError(null);
    try {
      if (action === "accept") {
        const { conversationId } = await endpoints.acceptRequest(r.id);
        setAccepted((a) => ({ ...a, [r.id]: conversationId }));
      } else {
        await endpoints.declineRequest(r.id);
        setItems((p) => p.filter((x) => x.id !== r.id));
      }
      window.dispatchEvent(new Event(REQUESTS_CHANGED)); // refresh the nav badge
    } catch (e) { setError(errorText(e)); load(); }
    finally { setBusy((s) => { const n = new Set(s); n.delete(r.id); return n; }); }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-4xl font-semibold">Requests</h1>
        <p className="mt-2 muted">People you wrote to who would like to know it was you. You decide — nothing is shared unless you accept.</p>
      </header>
      {error && <Alert>{error}</Alert>}
      {state === "loading" ? (
        <div className="space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="skeleton h-32" />)}</div>
      ) : state === "error" ? (
        <button className="btn btn-ghost" onClick={() => { setState("loading"); setError(null); load(); }}>Try again</button>
      ) : items.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>No requests</p>
          <p className="mt-1 text-sm muted">When someone asks who sent them a message, it will show up here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="glass rise p-5">
              <div className="flex items-center gap-3">
                <Avatar name={r.requester.name} src={r.requester.avatarUrl} size={40} />
                <p><strong>{r.requester.name}</strong> wants to know that you sent them this message:</p>
              </div>
              <blockquote className="mt-3 whitespace-pre-wrap break-words border-l-2 border-[var(--accent)] pl-4 leading-relaxed">{r.message.content}</blockquote>
              {accepted[r.id] ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="alert alert-success !py-1">You are now visible to {r.requester.name}</span>
                  <Link href={`/conversations/${accepted[r.id]}`} className="btn btn-primary btn-sm">Open conversation</Link>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-primary btn-sm" disabled={busy.has(r.id)} onClick={() => answer(r, "accept")}>
                    {busy.has(r.id) ? <Spinner /> : "Yes, reveal me"}
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={busy.has(r.id)} onClick={() => answer(r, "decline")}>No, stay anonymous</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
