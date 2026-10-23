"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, nameSchema, type ChangePasswordValues, type NameValues } from "@/lib/validations";
import { endpoints } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, Avatar, Field, Spinner, errorText } from "@/components/ui";

const MAX = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function AvatarCard() {
  const { user, setUser } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (!TYPES.includes(file.type)) return setMsg({ kind: "error", text: "Choose a JPEG, PNG, GIF or WebP image." });
    if (file.size > MAX) return setMsg({ kind: "error", text: "Image must be 2MB or smaller." });
    setMsg(null); setPreview(URL.createObjectURL(file)); setBusy(true);
    try { setUser(await endpoints.uploadAvatar(file)); setMsg({ kind: "success", text: "Profile picture updated." }); }
    catch (err) { setMsg({ kind: "error", text: errorText(err) }); }
    finally { setBusy(false); setPreview(null); }
  }
  if (!user) return null;
  return (
    <section className="glass p-6" aria-labelledby="pp">
      <h2 id="pp" className="text-xl font-semibold">Profile picture</h2>
      <div className="mt-4 flex items-center gap-5">
        <Avatar name={user.name} src={preview ?? user.avatarUrl} size={80} />
        <div className="space-y-2">
          <input ref={input} type="file" accept={TYPES.join(",")} className="sr-only" onChange={onPick} aria-label="Upload profile picture" />
          <button className="btn btn-ghost" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <><Spinner label="Uploading" /> Uploading…</> : user.avatarUrl ? "Change picture" : "Upload picture"}
          </button>
          <p className="text-xs muted">JPEG, PNG, GIF or WebP · up to 2MB</p>
        </div>
      </div>
      {msg && <div className="mt-4"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
    </section>
  );
}

function NameCard() {
  const { user, setUser } = useAuth();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<NameValues>({ resolver: zodResolver(nameSchema), defaultValues: { name: user?.name ?? "" } });
  async function onSubmit(v: NameValues) {
    setMsg(null);
    try { const u = await endpoints.updateName(v.name); setUser(u); reset({ name: u.name }); setMsg({ kind: "success", text: "Name updated." }); }
    catch (e) { setMsg({ kind: "error", text: errorText(e) }); }
  }
  return (
    <section className="glass p-6" aria-labelledby="nm">
      <h2 id="nm" className="text-xl font-semibold">Display name</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <Field label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <button className="btn btn-primary" disabled={isSubmitting || !isDirty}>{isSubmitting ? "Saving…" : "Save name"}</button>
      </form>
    </section>
  );
}

function PasswordCard() {
  const { user } = useAuth();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });
  async function onSubmit(v: ChangePasswordValues) {
    setMsg(null);
    try { await endpoints.changePassword(v.password, v.newPassword); reset(); setMsg({ kind: "success", text: "Password changed. Your other devices were signed out." }); }
    catch (e) { setMsg({ kind: "error", text: errorText(e) }); }
  }
  if (user?.provider === "google")
    return <section className="glass p-6"><h2 className="text-xl font-semibold">Password</h2><p className="mt-2 text-sm muted">You sign in with Google. To add a password, use “Forgot your password?” on the login page.</p></section>;
  return (
    <section className="glass p-6" aria-labelledby="pw">
      <h2 id="pw" className="text-xl font-semibold">Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <Field label="Current password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <Field label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Update password"}</button>
      </form>
    </section>
  );
}

function SessionsCard() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function all() {
    setBusy(true); setErr(null);
    try { await endpoints.logoutAll(); setUser(null); router.replace("/login"); router.refresh(); }
    catch (e) { setErr(errorText(e)); setBusy(false); }
  }
  return (
    <section className="glass p-6">
      <h2 className="text-xl font-semibold">Sessions</h2>
      <p className="mt-2 text-sm muted">Sign out of every browser and device, including this one.</p>
      {err && <div className="mt-3"><Alert>{err}</Alert></div>}
      <button className="btn btn-danger mt-4" disabled={busy} onClick={all}>{busy ? "Signing out…" : "Sign out everywhere"}</button>
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (loading || !user) return <div className="space-y-4" aria-busy="true"><div className="skeleton h-12 w-1/2" /><div className="skeleton h-40" /></div>;
  return (
    <div className="space-y-6" key={user.id}>
      <h1 className="text-4xl font-semibold">Settings</h1>
      <p className="muted">Signed in as {user.email}</p>
      <AvatarCard /><NameCard /><PasswordCard /><SessionsCard />
    </div>
  );
}
