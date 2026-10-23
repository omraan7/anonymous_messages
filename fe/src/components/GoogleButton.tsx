"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { endpoints } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, errorText } from "./ui";

type GoogleId = {
  initialize: (cfg: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
};
declare global {
  interface Window { google?: { accounts: { id: GoogleId } } }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// "Continue with Google" via Google Identity Services. The browser only obtains a
// Google-signed ID token; the BACKEND verifies it (signature, audience, email_verified)
// and starts the normal session. Nothing the browser says about identity is trusted.
export default function GoogleButton() {
  const router = useRouter();
  const { setUser } = useAuth();
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.google) setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !CLIENT_ID || !holder.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async ({ credential }) => {
        if (!credential) return setError("Google sign-in was cancelled.");
        setError(null);
        try {
          const user = await endpoints.google(credential);
          setUser(user);
          router.replace("/");
          router.refresh();
        } catch (e) {
          setError(errorText(e));
        }
      },
    });
    window.google.accounts.id.renderButton(holder.current, {
      type: "standard", theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 320, logo_alignment: "center",
    });
  }, [ready, router, setUser]);

  if (!CLIENT_ID) return null; // not configured: hide rather than show a broken button

  return (
    <div className="space-y-3">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={holder} className="flex min-h-11 justify-center" aria-label="Continue with Google" />
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
