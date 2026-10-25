"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { endpoints, type ConversationSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, Avatar, errorText } from "@/components/ui";

export default function ConversationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (loading || !user) return <div className="space-y-4" aria-busy="true"><div className="skeleton h-12 w-1/2" /><div className="skeleton h-24" /></div>;
  return <List key={user.id} />;
}

function List() {
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { endpoints.conversations().then(setItems).catch((e) => setError(errorText(e))); }, []);
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-4xl font-semibold">Conversations</h1>
        <p className="mt-2 muted">Private threads with people who agreed to be identified.</p>
      </header>
      {error && <Alert>{error}</Alert>}
      {!items && !error ? (
        <div className="space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : items && items.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>No conversations yet</p>
          <p className="mt-1 text-sm muted">A conversation starts once someone accepts a “Who sent this?” request.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items?.map((c) => (
            <li key={c.id}>
              <Link href={`/conversations/${c.id}`} className="glass rise flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface-strong)]">
                <Avatar name={c.other.name} src={c.other.avatarUrl} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.other.name}</p>
                  <p className="text-xs muted">Last activity {new Date(c.lastMessageAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <span aria-hidden className="muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
