import { describe, it, expect, beforeEach, vi } from "vitest";

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let calls: string[] = [];
const events: string[] = [];

async function load() {
  vi.resetModules();
  return import("../src/lib/api");
}
beforeEach(() => {
  calls = [];
  events.length = 0;
  // minimal window for the expiry event
  (globalThis as any).window = { dispatchEvent: (e: Event) => events.push(e.type) };
});

describe("api client", () => {
  it("returns data on success and never refreshes", async () => {
    const { api } = await load();
    globalThis.fetch = vi.fn(async (u: any) => { calls.push(u); return json(200, { ok: 1 }); }) as any;
    expect(await api("/user/me")).toEqual({ ok: 1 });
    expect(calls).toEqual(["/api/user/me"]);
  });

  it("on 401 refreshes once then retries once and succeeds", async () => {
    const { api } = await load();
    let first = true;
    globalThis.fetch = vi.fn(async (u: any) => {
      calls.push(u);
      if (u === "/api/auth/refresh-token") return json(200, {});
      if (first) { first = false; return json(401, { message: "expired" }); }
      return json(200, { data: "fresh" });
    }) as any;
    expect(await api("/message")).toEqual({ data: "fresh" });
    expect(calls).toEqual(["/api/message", "/api/auth/refresh-token", "/api/message"]);
  });

  it("5 parallel 401s trigger exactly ONE refresh call (single-flight)", async () => {
    const { api } = await load();
    const seen = new Map<string, number>();
    globalThis.fetch = vi.fn(async (u: any) => {
      calls.push(u);
      if (u === "/api/auth/refresh-token") { await new Promise((r) => setTimeout(r, 20)); return json(200, {}); }
      const n = (seen.get(u) ?? 0) + 1; seen.set(u, n);
      return n === 1 ? json(401, {}) : json(200, { ok: true });
    }) as any;
    await Promise.all(Array.from({ length: 5 }, (_, i) => api(`/r${i}`)));
    expect(calls.filter((c) => c.includes("refresh-token")).length).toBe(1);
  });

  it("NO LOOP: if refresh fails, it gives up, emits session-expired, and throws 401 (no retry storm)", async () => {
    const { api, ApiError, SESSION_EXPIRED_EVENT } = await load();
    globalThis.fetch = vi.fn(async (u: any) => { calls.push(u); return json(401, { message: "nope" }); }) as any;
    await expect(api("/message")).rejects.toBeInstanceOf(ApiError);
    expect(calls).toEqual(["/api/message", "/api/auth/refresh-token"]);
    expect(events).toContain(SESSION_EXPIRED_EVENT);
  });

  it("NO LOOP: refresh succeeds but the retry is still 401 -> exactly one retry, then expired", async () => {
    const { api, SESSION_EXPIRED_EVENT } = await load();
    globalThis.fetch = vi.fn(async (u: any) => { calls.push(u); return u.includes("refresh") ? json(200, {}) : json(401, {}); }) as any;
    await expect(api("/message")).rejects.toMatchObject({ status: 401 });
    expect(calls).toEqual(["/api/message", "/api/auth/refresh-token", "/api/message"]);
    expect(events).toContain(SESSION_EXPIRED_EVENT);
  });

  it("auth endpoints (login) never trigger a refresh on 401", async () => {
    const { endpoints } = await load();
    globalThis.fetch = vi.fn(async (u: any) => { calls.push(u); return json(401, { message: "Invalid email or password" }); }) as any;
    await expect(endpoints.login("a@b.co", "x")).rejects.toMatchObject({ message: "Invalid email or password" });
    expect(calls).toEqual(["/api/auth/login"]);
  });

  it("409 refresh race (another tab won) is treated as success and the request is retried", async () => {
    const { api } = await load();
    let first = true;
    globalThis.fetch = vi.fn(async (u: any) => {
      calls.push(u);
      if (u.includes("refresh")) return json(409, { code: "REFRESH_RACE" });
      if (first) { first = false; return json(401, {}); }
      return json(200, { ok: 1 });
    }) as any;
    expect(await api("/message")).toEqual({ ok: 1 });
  });

  it("network failure becomes a friendly ApiError, 5xx messages are not leaked", async () => {
    const { api } = await load();
    globalThis.fetch = vi.fn(async () => { throw new TypeError("fetch failed"); }) as any;
    await expect(api("/x")).rejects.toMatchObject({ status: 0, code: "NETWORK" });
    globalThis.fetch = vi.fn(async () => json(500, { message: "SQL stack trace here" })) as any;
    await expect(api("/x")).rejects.toMatchObject({ status: 500, message: "Something went wrong. Please try again." });
  });

  it("sends cookies same-origin and uses FormData untouched for uploads", async () => {
    const { endpoints } = await load();
    let init: any;
    globalThis.fetch = vi.fn(async (_u: any, i: any) => { init = i; return json(200, { data: {} }); }) as any;
    await endpoints.uploadAvatar(new File([new Uint8Array([1])], "a.png", { type: "image/png" }));
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).has("pp")).toBe(true);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });
});
