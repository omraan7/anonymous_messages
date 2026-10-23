"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "./ui";

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav aria-label="Main" className="glass mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Saraha<span style={{ color: "var(--accent)" }}>.</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {loading ? (
            <span className="skeleton h-9 w-28" aria-hidden />
          ) : user ? (
            <>
              <Link href="/" className="btn btn-ghost btn-sm hidden sm:inline-flex">Inbox</Link>
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
      </nav>
    </header>
  );
}
