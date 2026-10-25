"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { endpoints, ApiError, type Person, type ThreadMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, Avatar, Spinner, errorText } from "@/components/ui";

export default function ThreadPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (loading || !user) return <div className="space-y-4" aria-busy="true"><div className="skeleton h-12 w-1/2" /><div className="skeleton h-64" /></div>;
  return <Thread key={`${user.id}:${id}`} id={id} />;
}

function Thread({ id }: { id: string }) {
  // `messages` is kept oldest -> newest for display; the API returns newest first.
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [other, setOther] = useState<Person | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [older, setOlder] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const sendLock = useRef(false);
  const stick = useRef(true); // only auto-scroll for new messages, not when loading older ones

  const load = useCallback(async () => {
    try {
      const page = await endpoints.thread(id);
      setMessages([...page.data].reverse());
      setOther(page.other);
      setCursor(page.nextCursor);
      setState("ready");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) setState("missing");
      else { setError(errorText(e)); setState("error"); }
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { if (stick.current) bottom.current?.scrollIntoView({ block: "end" }); }, [messages]);

  async function loadOlder() {
    if (!cursor || older) return;
    setOlder(true); stick.current = false;
    try {
      const page = await endpoints.thread(id, cursor);
      setMessages((p) => [...[...page.data].reverse(), ...p]);
      setCursor(page.nextCursor);
    } catch (e) { setError(errorText(e)); }
    finally { setOlder(false); }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sendLock.current) return; // no double submit
    if (content.length > 500) return setError("Keep it under 500 characters.");
    sendLock.current = true; setSending(true); setError(null);
    try {
      const m = await endpoints.sendInThread(id, content);
      stick.current = true;
      setMessages((p) => [...p, m]);
      setText("");
    } catch (err) { setError(errorText(err)); }
    finally { sendLock.current = false; setSending(false); }
  }

  if (state === "loading") return <div className="space-y-3" aria-busy="true"><div className="skeleton h-14" /><div className="skeleton h-64" /></div>;
  if (state === "missing")
    return (
      <div className="glass mx-auto max-w-md p-9 text-center">
        <h1 className="text-3xl font-semibold">Conversation not found</h1>
        <Link href="/conversations" className="btn btn-primary mt-6">Back to conversations</Link>
      </div>
    );
  if (state === "error") return <div className="space-y-3"><Alert>{error}</Alert><button className="btn btn-ghost" onClick={() => { setState("loading"); setError(null); load(); }}>Try again</button></div>;

  return (
    <section className="flex flex-col gap-4">
      <header className="glass flex items-center gap-3 p-4">
        <Link href="/conversations" className="btn btn-ghost btn-sm" aria-label="Back to conversations">‹</Link>
        {other && <Avatar name={other.name} src={other.avatarUrl} size={40} />}
        <h1 className="truncate text-xl font-semibold">{other?.name ?? "Conversation"}</h1>
      </header>

      <div className="glass flex max-h-[60dvh] min-h-[40dvh] flex-col gap-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Messages">
        {cursor && <button className="btn btn-ghost btn-sm self-center" onClick={loadOlder} disabled={older}>{older ? <Spinner /> : "Load older messages"}</button>}
        {messages.length === 0 && <p className="m-auto text-sm muted">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.mine ? "bg-[var(--accent)] text-[var(--on-accent)]" : "border border-[var(--border)] bg-[var(--surface-strong)]"}`}>
              <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
              <time dateTime={m.createdAt} className="mt-1 block text-[11px] opacity-70">
                {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </time>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {error && <Alert>{error}</Alert>}
      <form onSubmit={send} className="glass flex items-end gap-2 p-3">
        <label htmlFor="reply" className="sr-only">Your reply</label>
        <textarea id="reply" className="input !min-h-[2.75rem] flex-1" rows={2} maxLength={600} value={text} placeholder="Write a message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
        <button className="btn btn-primary" disabled={sending || !text.trim()}>{sending ? <Spinner label="Sending" /> : "Send"}</button>
      </form>
      <p className="text-center text-xs muted">{text.length}/500 · Enter to send, Shift+Enter for a new line</p>
    </section>
  );
}
