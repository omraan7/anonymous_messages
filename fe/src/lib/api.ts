// The ONE API client. Responsibilities: same-origin cookie auth, uniform errors,
// and transparent single-flight token refresh with loop protection.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public fieldErrors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Opts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
};

export const SESSION_EXPIRED_EVENT = "saraha:session-expired";
const BASE = "/api";

function raw(path: string, opts: Opts = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form; // browser sets the multipart boundary itself
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  return fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
    credentials: "same-origin",
    cache: "no-store",
    signal: opts.signal,
  });
}

// ---- single-flight refresh: N parallel 401s trigger exactly ONE refresh call ----
let inflight: Promise<boolean> | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function refreshSession(): Promise<boolean> {
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await raw("/auth/refresh-token", { method: "POST" });
        if (res.ok) return true;
        // 409 = another tab rotated the token a moment ago; its cookies are already ours.
        if (res.status === 409) {
          await sleep(150);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

async function toError(res: Response): Promise<ApiError> {
  const j = await res.json().catch(() => null);
  const message =
    typeof j?.message === "string" && res.status < 500 ? j.message : "Something went wrong. Please try again.";
  return new ApiError(res.status, message, j?.code, j?.errors);
}

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  let res: Response;
  try {
    res = await raw(path, opts);
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.", "NETWORK");
  }

  // Expired access token -> refresh ONCE -> retry ONCE. Auth endpoints never trigger
  // a refresh, and a failed refresh ends the session, so there is no refresh loop.
  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (await refreshSession()) {
      try {
        res = await raw(path, opts);
      } catch {
        throw new ApiError(0, "Can't reach the server. Check your connection and try again.", "NETWORK");
      }
    }
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------------- typed endpoints ----------------
export type User = {
  id: string;
  name: string;
  email: string;
  publicId: string;
  avatarUrl: string | null;
  provider: "local" | "google";
  isVerified: boolean;
};
export type Message = { id: string; content: string; createdAt: string };
export type MessagePage = { data: Message[]; nextCursor: string | null };

export const endpoints = {
  me: () => api<{ data: User }>("/user/me").then((r) => r.data),
  login: (email: string, password: string) =>
    api<{ data: { user: User } }>("/auth/login", { method: "POST", body: { email, password } }).then((r) => r.data.user),
  google: (idToken: string) =>
    api<{ data: { user: User } }>("/auth/login-google", { method: "POST", body: { idToken } }).then((r) => r.data.user),
  register: (name: string, email: string, password: string) =>
    api<{ message: string }>("/auth/register", { method: "POST", body: { name, email, password } }),
  verifyOtp: (email: string, otp: string) =>
    api<{ message: string }>("/auth/verify-otp", { method: "PATCH", body: { email, otp } }),
  sendOtp: (email: string, purpose: "verify" | "reset") =>
    api<{ message: string }>("/auth/send-otp", { method: "POST", body: { email, purpose } }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api<{ message: string }>("/auth/reset-password", { method: "PATCH", body: { email, otp, newPassword } }),
  changePassword: (password: string, newPassword: string) =>
    api<{ message: string }>("/auth/change-password", { method: "PATCH", body: { password, newPassword } }),
  logout: () => api<{ message: string }>("/auth/logout", { method: "POST" }),
  logoutAll: () => api<{ message: string }>("/auth/logout-all", { method: "POST" }),
  updateName: (name: string) =>
    api<{ data: User }>("/user/me", { method: "PATCH", body: { name } }).then((r) => r.data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("pp", file);
    return api<{ data: User }>("/user/profile-picture", { method: "POST", form }).then((r) => r.data);
  },
  messages: (cursor?: string | null) =>
    api<MessagePage>(`/message?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`),
  deleteMessage: (id: string) => api<{ message: string }>(`/message/${id}`, { method: "DELETE" }),
  sendMessage: (receiver: string, content: string) =>
    api<{ message: string }>("/message", { method: "POST", body: { receiver, content } }),
};
