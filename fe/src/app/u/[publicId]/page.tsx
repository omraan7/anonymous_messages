import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import SendMessageForm from "./SendMessageForm";

const BACKEND = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");
type Profile = { publicId: string; name: string; avatarUrl: string | null };

async function getProfile(id: string): Promise<Profile | null> {
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(id)) return null;
  const res = await fetch(`${BACKEND}/api/user/public/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("backend unavailable");
  return (await res.json()).data;
}

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).publicId).catch(() => null);
  return { title: p ? `Send ${p.name} an anonymous message` : "Profile not found", robots: { index: false } };
}

export default async function PublicProfile({ params }: { params: Promise<{ publicId: string }> }) {
  const profile = await getProfile((await params).publicId);
  if (!profile) notFound();
  return (
    <section className="glass rise mx-auto max-w-xl p-7 sm:p-9">
      <div className="flex items-center gap-4">
        <Avatar name={profile.name} src={profile.avatarUrl} size={64} />
        <div>
          <h1 className="text-3xl font-semibold">{profile.name}</h1>
          <p className="text-sm muted">Send an honest message — they will never know it was you.</p>
        </div>
      </div>
      <SendMessageForm receiver={profile.publicId} />
      <p className="mt-6 border-t border-[var(--border)] pt-4 text-center text-sm muted">
        Want your own link? <Link href="/register" className="link">Create one free</Link>
      </p>
    </section>
  );
}
