# Saraha clone

`be/` Express 5 + MongoDB + Redis · `fe/` Next.js 15. The browser talks only to the Next origin (`/api/*` is proxied to the backend), so session cookies are first-party.

## Run locally
```bash
# backend (needs MongoDB; Redis optional)
cd be && cp .env.example .env   # fill in values
npm install && npm run dev      # http://localhost:4000

# frontend
cd fe && cp .env.example .env.local
npm install && npm run dev      # http://localhost:3000
```
Tests: `cd be && npm test` (needs `MONGODB_URI`, `REDIS_*`, both JWT secrets pointing at a **throwaway** DB/Redis — it deletes all users/messages!) · `cd fe && npm test`.

## Auth model
* Access token: JWT, 15 min, HS256, `iss`/`aud` checked, cookie `sa_at` (HttpOnly, SameSite=Lax).
* Refresh token: 32 random bytes, cookie `sa_rt` (HttpOnly, SameSite=Strict, Path=`/api/auth`). Only an HMAC is stored (MongoDB `sessions`). Rotated on every refresh with an atomic compare-and-set. Replaying a rotated token after a 10 s grace window revokes the whole session.
* Every access token carries a session id; each request checks the session is alive: Redis marker `saraha:v1:sess:<userId>:<sid>` (TTL ≤ 60 s), falling back to MongoDB on a miss or any Redis error. **Redis can never authenticate anyone by itself.**
* Logout revokes the session and deletes the marker. Password reset/change revokes other sessions.
* One browser = one active account; logging into another account retires the previous session.

## Google sign-in
Frontend gets a Google ID token (Google Identity Services); backend verifies signature/audience/`email_verified`, identity = Google `sub`. Linking policy: a verified local account with the same verified email is linked; an *unverified* local account has its password wiped first (anti pre-registration hijack).
Setup: Google Cloud Console → OAuth client (Web) → add **Authorized JavaScript origins** (`http://localhost:3000`, your prod origin). No redirect URI/secret is needed. Put the client ID in `WEB_CLIENT_ID` (be) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (fe).

## Deployment notes
* **Uploads use local disk** — fine for a VM/container with a persistent volume, **not** for Vercel/serverless. For those, add an object-storage driver with the same `save/remove/publicUrl` API as `be/src/lib/storage/local.js`.
* Express is a long-running server; host it on Render/Railway/Fly/VM (or adapt for serverless). Set `FRONTEND_ORIGINS` to the exact frontend origin, `NODE_ENV=production` (enables Secure cookies, requires HTTPS), `TRUST_PROXY=1`.
* Frontend (Vercel is fine): set `BACKEND_URL` to the backend's public URL.
* Managed Redis usually needs `REDIS_TLS=true`.









===
get all message 
request sender to know who send the message
create conversation between sender and receiver
2-step verification