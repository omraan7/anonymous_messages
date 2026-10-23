import { env } from "../config/env.js";

export const ACCESS_COOKIE = "sa_at";
export const REFRESH_COOKIE = "sa_rt";

const base = () => ({
  httpOnly: true,
  secure: env.isProd,
  domain: env.cookieDomain,
});

// Access cookie: sent to every API call.
const accessOpts = () => ({
  ...base(),
  sameSite: "lax",
  path: "/",
  maxAge: env.accessTtlSec * 1000,
});
// Refresh cookie: Strict + scoped to the auth endpoints only, so it is never
// attached to message/profile requests and is not sent on cross-site navigations.
const refreshOpts = () => ({
  ...base(),
  sameSite: "strict",
  path: `${env.apiPrefix}/auth`,
  maxAge: env.refreshTtlSec * 1000,
});

export function setSessionCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, accessOpts());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshOpts());
}

export function clearSessionCookies(res) {
  const { maxAge: _a, ...a } = accessOpts();
  const { maxAge: _r, ...r } = refreshOpts();
  res.clearCookie(ACCESS_COOKIE, a);
  res.clearCookie(REFRESH_COOKIE, r);
}
