"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema, type MessageValues } from "@/lib/validations";
import { endpoints } from "@/lib/api";
import { Alert, Spinner, errorText } from "@/components/ui";

export default function SendMessageForm({ receiver }: { receiver: string }) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const lock = useRef(false);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<MessageValues>({ resolver: zodResolver(messageSchema), defaultValues: { message: "" } });
  const len = watch("message")?.length ?? 0;

  async function onSubmit(v: MessageValues) {
    if (lock.current) return; // blocks double submits
    lock.current = true; setError(null);
    try { await endpoints.sendMessage(receiver, v.message); setSent(true); reset(); }
    catch (e) { setError(errorText(e)); }
    finally { lock.current = false; }
  }

  if (sent)
    return (
      <div className="mt-7 space-y-4">
        <Alert kind="success">Sent anonymously. Thank you for being honest.</Alert>
        <button className="btn btn-ghost w-full" onClick={() => setSent(false)}>Send another</button>
      </div>
    );
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
      <div>
        <label htmlFor="msg" className="label">Your message</label>
        <textarea id="msg" className="input" maxLength={600} placeholder="Say something honest…" aria-invalid={!!errors.message} aria-describedby="msg-count" {...register("message")} />
        <div className="mt-1 flex justify-between text-xs">
          <span className="field-error m-0" role="alert">{errors.message?.message}</span>
          <span id="msg-count" className={len > 500 ? "text-[var(--danger)]" : "muted"}>{len}/500</span>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      <button className="btn btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? <><Spinner label="Sending" /> Sending…</> : "Send anonymously"}
      </button>
    </form>
  );
}
