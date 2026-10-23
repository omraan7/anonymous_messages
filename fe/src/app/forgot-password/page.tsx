"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotSchema, resetSchema, type ForgotValues, type ResetValues } from "@/lib/validations";
import { endpoints } from "@/lib/api";
import { Alert, AuthCard, Field, Spinner, errorText } from "@/components/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const a = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });
  const b = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  async function sendCode(v: ForgotValues) {
    setError(null);
    try { await endpoints.sendOtp(v.email, "reset"); setEmail(v.email.trim().toLowerCase()); }
    catch (e) { setError(errorText(e)); }
  }
  async function reset(v: ResetValues) {
    setError(null);
    try { await endpoints.resetPassword(email!, v.otp, v.newPassword); router.replace("/login?reset=1"); }
    catch (e) { setError(errorText(e)); }
  }

  const footer = <Link href="/login" className="link">Back to log in</Link>;
  if (!email)
    return (
      <AuthCard title="Reset your password" subtitle="Enter your email and we'll send a code if an account exists." footer={footer}>
        <form onSubmit={a.handleSubmit(sendCode)} className="space-y-4" noValidate>
          <Field label="Email" type="email" autoComplete="email" error={a.formState.errors.email?.message} {...a.register("email")} />
          {error && <Alert>{error}</Alert>}
          <button className="btn btn-primary w-full" disabled={a.formState.isSubmitting}>
            {a.formState.isSubmitting ? <><Spinner /> Sending…</> : "Send code"}
          </button>
        </form>
      </AuthCard>
    );
  const e = b.formState.errors;
  return (
    <AuthCard title="Choose a new password" subtitle="If an account exists for that address, a code has been sent." footer={footer}>
      <form onSubmit={b.handleSubmit(reset)} className="space-y-4" noValidate>
        <Field label="Code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} error={e.otp?.message} {...b.register("otp")} />
        <Field label="New password" type="password" autoComplete="new-password" error={e.newPassword?.message} {...b.register("newPassword")} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" error={e.confirmPassword?.message} {...b.register("confirmPassword")} />
        {error && <Alert>{error}</Alert>}
        <button className="btn btn-primary w-full" disabled={b.formState.isSubmitting}>
          {b.formState.isSubmitting ? <><Spinner /> Updating…</> : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}
