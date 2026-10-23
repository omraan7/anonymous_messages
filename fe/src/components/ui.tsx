import { forwardRef, useId } from "react";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={inputId} className="label">{label}</label>
      <input ref={ref} id={inputId} className="input" aria-invalid={!!error} aria-describedby={describedBy} {...rest} />
      {error ? (
        <p id={`${inputId}-err`} className="field-error" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-xs muted">{hint}</p>
      ) : null}
    </div>
  );
});

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
  );
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  const style = { width: size, height: size, fontSize: size * 0.4 };
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt="" width={size} height={size} style={style} className="shrink-0 rounded-full border border-[var(--border)] object-cover" />;
  return (
    <span aria-hidden style={style} className="grid shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] font-semibold">
      {initials}
    </span>
  );
}

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="glass rise mx-auto w-full max-w-md p-7 sm:p-9">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm muted">{subtitle}</p>}
      <div className="mt-7 space-y-5">{children}</div>
      {footer && <div className="mt-7 border-t border-[var(--border)] pt-5 text-center text-sm muted">{footer}</div>}
    </div>
  );
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-widest muted" role="separator">
      <span className="h-px flex-1 bg-[var(--border)]" />
      {children}
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}
