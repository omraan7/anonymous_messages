"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ShareLink from "@/components/ShareLink";
import MessageList from "@/components/MessageList";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);

  if (loading || !user)
    return <div className="space-y-4" aria-busy="true"><div className="skeleton h-12 w-2/3" /><div className="skeleton h-28" /><div className="skeleton h-24" /></div>;

  return (
    <section className="space-y-8">
      <header className="rise">
        <h1 className="text-4xl font-semibold">Hello, {user.name.split(" ")[0]}</h1>
        <p className="mt-2 muted">Here is what people have been telling you.</p>
      </header>
      <ShareLink publicId={user.publicId} />
      <div>
        <h2 className="mb-3 text-xl font-semibold">Inbox</h2>
        <MessageList key={user.id} />
      </div>
    </section>
  );
}
