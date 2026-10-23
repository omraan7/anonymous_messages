"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/lib/validations";
import { endpoints } from "@/lib/api";
import { Alert, AuthCard, Divider, Field, Spinner, errorText } from "@/components/ui";
import GoogleButton from "@/components/GoogleButton";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(v: RegisterValues) {
    setError(null);
    try {
      await endpoints.register(v.name, v.email, v.password);
      router.push(`/verify?email=${encodeURIComponent(v.email)}`);
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Get a private link and start receiving honest messages."
      footer={<>Already have an account? <Link href="/login" className="link">Log in</Link></>}
    >
      <GoogleButton />
      <Divider>or</Divider>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Field label="Password" type="password" autoComplete="new-password" hint="8–64 characters" error={errors.password?.message} {...register("password")} />
        <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        {error && <Alert>{error}</Alert>}
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? <><Spinner label="Creating account" /> Creating account…</> : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
