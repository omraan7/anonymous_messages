import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Saraha — honest messages, anonymously", template: "%s · Saraha" },
  description: "Share your link and receive honest, anonymous messages.",
};
export const viewport: Viewport = { themeColor: "#0b1020", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--surface-strong)] focus:px-4 focus:py-2">
          Skip to content
        </a>
        <AuthProvider>
          <NavBar />
          <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:pt-12">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
