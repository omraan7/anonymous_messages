"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { endpoints } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { REQUESTS_CHANGED } from "@/lib/events";
import { Avatar } from "./ui";

const TABS = [
  { href: "/", label: "Inbox" },
  { href: "/requests", label: "Requests" },
  { href: "/conversations", label: "Chats" },
];

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [pending, setPending] = useState(0);

  const refreshCount = useCallback(() => {
    if (!user) return setPending(0);
    endpoints.pendingCount().then(setPending).catch(() => {}); // a failing badge must never break navigation
  }, [user]);

  // Refetch when the account changes, on every route change, and after answering a request.
  useEffect(() => { refreshCount(); }, [refreshCount, pathname]);
  useEffect(() => {
    window.addEventListener(REQUESTS_CHANGED, refreshCount);
    return () => window.removeEventListener(REQUESTS_CHANGED, refreshCount);
  }, [refreshCount]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav aria-label="Main" className="glass mx-auto max-w-3xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Saraha<span style={{ color: "var(--accent)" }}>.</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {loading ? (
              <span className="skeleton h-9 w-28" aria-hidden />
            ) : user ? (
              <>
                <Link href="/settings" className="btn btn-ghost btn-sm" aria-label="Settings">
                  <Avatar name={user.name} src={user.avatarUrl} size={24} />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
                <button type="button" onClick={logout} className="btn btn-ghost btn-sm">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>

        {user && (
          <ul className="mt-2 flex gap-1 border-t border-[var(--border)] pt-2">
            {TABS.map((t) => (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={isActive(t.href) ? "page" : undefined}
                  className={`btn btn-sm w-full ${isActive(t.href) ? "btn-primary" : "btn-ghost"}`}
                >
                  {t.label}
                  {t.href === "/requests" && pending > 0 && (
                    <span
                      className="grid min-w-5 place-items-center rounded-full bg-[var(--danger)] px-1.5 text-[11px] font-bold leading-5 text-[var(--bg)]"
                      aria-label={`${pending} pending`}
                    >
                      {pending > 9 ? "9+" : pending}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
