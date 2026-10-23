"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/validations";
import { ApiError, endpoints } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, AuthCard, Divider, Field, Spinner, errorText } from "@/components/ui";
import GoogleButton from "@/components/GoogleButton";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState<string | null>(null);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => { if (!loading && user) router.replace("/"); }, [loading, user, router]);

  async function onSubmit(v: LoginValues) {
    setError(null); setUnverified(null);
    try {
      const u = await endpoints.login(v.email, v.password);
      setUser(u);
      router.replace("/");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === "EMAIL_NOT_VERIFIED") setUnverified(getValues("email"));
      setError(errorText(e));
    }
  }

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
