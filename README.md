# Saraha Clone

A full-stack Saraha clone built with Express, MongoDB, Redis, and Next.js.

The project supports anonymous messaging, authentication, session management, optional two-step verification, Google sign-in, message reveal requests, and private conversations.

## Tech Stack

- **Backend:** Express 5, MongoDB, Mongoose
- **Frontend:** Next.js 15
- **Caching & Session Tracking:** Redis
- **Authentication:** JWT, refresh tokens, Google Identity Services
- **Testing:** Backend and frontend test suites

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB
- Redis (optional for local development)

### 1. Start the Backend

```bash
cd be
npm install
npm run dev
```

The backend runs at `http://localhost:4000`.

### 2. Start the Frontend

Open another terminal:

```bash
cd fe
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

The frontend sends API requests through `/api/*`, which Next.js proxies to the backend. This keeps browser requests on the frontend origin and allows session cookies to work as first-party cookies.

## Authentication & Sessions

- Access tokens are JWTs that expire after 15 minutes.
- Refresh tokens are randomly generated and stored as HMAC hashes in MongoDB.
- Refresh tokens rotate on use, with a short grace period to handle concurrent requests.
- Each access token is tied to a session that is checked on every request.
- Redis is used to cache session status, with MongoDB as the fallback.
- Logging out revokes the current session.
- Password changes and resets revoke other active sessions.
- Logging into another account in the same browser retires the previous account's session.

## Two-Step Verification

Two-step verification can be enabled from the user's settings.

When enabled, password-based login requires an additional six-digit code sent by email. The session is created only after the code is verified.

Google sign-in does not use this additional step.

## Anonymous Messages & Reveal Requests

Recipients can request to find out who sent a message.

- The sender can accept or decline the request.
- Accepting reveals the sender's identity to the recipient and opens a private conversation.
- Declining does not reveal the sender's identity.
- Anonymous messages from visitors without an account can also receive reveal requests, but their identity cannot be revealed.
- Messages from the other person are added to a conversation only after they accept the relevant request.

Conversations include the sender's messages to the recipient and replies from both sides.

## Google Sign-In Setup

The frontend uses Google Identity Services to obtain an ID token. The backend verifies the token before signing the user in.

To configure Google sign-in:

1. Open the Google Cloud Console.
2. Create or select an OAuth client ID for a web application.
3. Add your frontend URL under **Authorized JavaScript origins**.
4. Set the following environment variables:

**Backend (`be`):**

```env
WEB_CLIENT_ID=your_google_client_id
```

**Frontend (`fe`):**

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

For local development, add `http://localhost:3000` as an authorized JavaScript origin. Add your production frontend origin when deploying.

No redirect URI or client secret is required for this sign-in flow.

## Running Tests

### Backend

```bash
cd be
npm test
```

The backend tests require a dedicated test database, the required Redis configuration, and both JWT secrets.

**Important:** Use a disposable test database and Redis instance. The test suite deletes users and messages, so never run it against production data.

### Frontend

```bash
cd fe
npm test
```

## Deployment

### Backend

The Express backend is designed to run as a long-lived server. Suitable options include Render, Railway, Fly.io, or a virtual machine.

Configure the following for production:

- `FRONTEND_ORIGINS`: the exact frontend origin or origins allowed by the backend.
- `NODE_ENV=production`: enables secure cookies, so HTTPS is required.
- `TRUST_PROXY=1`: configure this when running behind a trusted reverse proxy.
- `BACKEND_URL`: set this in the frontend environment to the backend's public URL.

Use a managed Redis instance or another properly secured Redis deployment. Set `REDIS_TLS=true` when required by your Redis provider.

### File Uploads

Uploads currently use local disk storage. This works on servers or containers with persistent storage, but it is not suitable for Vercel serverless deployments.

For serverless hosting, replace the local storage implementation with an object-storage provider that supports the same `save`, `remove`, and `publicUrl` interface.

The frontend can be deployed to Vercel, while the backend runs on a separate hosting service.

## Project Structure

```text
.
├── be/    # Express API, authentication, database and storage
└── fe/    # Next.js frontend
```

