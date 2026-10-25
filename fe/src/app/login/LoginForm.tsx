"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, verifySchema, type LoginValues, type VerifyValues } from "@/lib/validations";
import { ApiError, endpoints } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, AuthCard, Divider, Field, Spinner, errorText } from "@/components/ui";
import GoogleButton from "@/components/GoogleButton";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [unverified, setUnverified] = useState<string | null>(null);
  // Step 2 (two-step verification). The password is kept ONLY in memory, solely so "Resend code"
  // can repeat step 1 (the backend only issues a login code after a correct password).
  const [step2, setStep2] = useState<{ email: string; password: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const code = useForm<VerifyValues>({ resolver: zodResolver(verifySchema) });

  useEffect(() => { if (!loading && user) router.replace("/"); }, [loading, user, router]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function finish(u: Parameters<typeof setUser>[0]) {
    setUser(u);
    router.replace("/");
    router.refresh();
  }

  async function onSubmit(v: LoginValues) {
    setError(null); setInfo(null); setUnverified(null);
    try {
      const r = await endpoints.login(v.email, v.password);
      if ("twoStep" in r) {
        setStep2({ email: r.email, password: v.password });
        setCooldown(60);
        return;
      }
      finish(r.user);
    } catch (e) {
      if (e instanceof ApiError && e.code === "EMAIL_NOT_VERIFIED") setUnverified(getValues("email"));
      setError(errorText(e));
    }
  }

  async function onCode(v: VerifyValues) {
    if (!step2) return;
    setError(null); setInfo(null);
    try {
      finish(await endpoints.verifyLoginOtp(step2.email, v.otp));
    } catch (e) { setError(errorText(e)); }
  }

  async function resend() {
    if (!step2) return;
    setError(null); setInfo(null);
    try {
      await endpoints.login(step2.email, step2.password);
      setInfo("If a new code was needed, it is on its way. Codes can be re-sent once a minute.");
      setCooldown(60);
    } catch (e) { setError(errorText(e)); }
  }

  function back() {
    setStep2(null); setError(null); setInfo(null); code.reset();
  }

  if (step2)
    return (
      <AuthCard
        title="Two-step verification"
        subtitle={`We emailed a 6-digit login code to ${step2.email}. It expires in 5 minutes.`}
        footer={<button type="button" onClick={back} className="link">Use a different account</button>}
      >
        <form onSubmit={code.handleSubmit(onCode)} className="space-y-4" noValidate>
          <Field label="Login code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" autoFocus
            error={code.formState.errors.otp?.message} {...code.register("otp")} />
          {error && <Alert>{error}</Alert>}
          {info && <Alert kind="success">{info}</Alert>}
          <button type="submit" disabled={code.formState.isSubmitting} className="btn btn-primary w-full">
            {code.formState.isSubmitting ? <><Spinner label="Verifying" /> Verifying…</> : "Verify and log in"}
          </button>
          <button type="button" onClick={resend} disabled={cooldown > 0} className="btn btn-ghost w-full">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      </AuthCard>
    );

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to read your messages."
      footer={<>New here? <Link href="/register" className="link">Create an account</Link></>}
    >
      {params.get("expired") && <Alert kind="info">Your session expired. Please log in again.</Alert>}
      {params.get("verified") && <Alert kind="success">Email verified. You can log in now.</Alert>}
      {params.get("reset") && <Alert kind="success">Password updated. Log in with your new password.</Alert>}

      <GoogleButton />
      <Divider>or</Divider>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        {error && (
          <Alert>
            {error}
            {unverified && <> <Link className="link" href={`/verify?email=${encodeURIComponent(unverified)}`}>Verify now</Link></>}
          </Alert>
        )}
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? <><Spinner label="Logging in" /> Logging in…</> : "Log in"}
        </button>
        <p className="text-center text-sm"><Link href="/forgot-password" className="link">Forgot your password?</Link></p>
      </form>
    </AuthCard>
  );
}
