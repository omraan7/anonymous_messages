"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifySchema, type VerifyValues } from "@/lib/validations";
import { endpoints } from "@/lib/api";
import { Alert, AuthCard, Field, Spinner, errorText } from "@/components/ui";

export default function VerifyForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyValues>({ resolver: zodResolver(verifySchema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(v: VerifyValues) {
    setError(null);
    try {
      await endpoints.verifyOtp(email, v.otp);
      router.replace("/login?verified=1");
    } catch (e) { setError(errorText(e)); }
  }
  async function resend() {
    setError(null); setInfo(null);
    try {
      await endpoints.sendOtp(email, "verify");
      setInfo("If that address needs verification, a new code is on its way.");
      setCooldown(60);
    } catch (e) { setError(errorText(e)); }
  }

  if (!email) return <AuthCard title="Verify your email"><Alert>Missing email. <Link className="link" href="/register">Start again</Link></Alert></AuthCard>;

  return (
    <AuthCard title="Check your inbox" subtitle={`We sent a 6-digit code to ${email}. It expires in 5 minutes.`}
      footer={<Link href="/login" className="link">Back to log in</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" error={errors.otp?.message} {...register("otp")} />
        {error && <Alert>{error}</Alert>}
        {info && <Alert kind="success">{info}</Alert>}
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? <><Spinner label="Verifying" /> Verifying…</> : "Verify email"}
        </button>
        <button type="button" onClick={resend} disabled={cooldown > 0} className="btn btn-ghost w-full">
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </form>
    </AuthCard>
  );
}
