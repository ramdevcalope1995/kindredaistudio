# Lovable Clone

A Next.js + Node.js app for a Lovable-style vibe coding experience. It includes a landing page, email/password auth, a protected dashboard, AI code generation, voice features, and a separate Node/Express backend.

## Requirements

- Node.js 18.18 or newer
- npm
- Docker Desktop, for local PostgreSQL
- Git

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://ramdev:Admin123$@localhost:5432/localsql"
SESSION_SECRET="replace-with-a-long-random-secret"

ANTHROPIC_API_KEY="your-anthropic-key"
ELEVENLABS_API_KEY="your-elevenlabs-key"
DEEPGRAM_API_KEY="your-deepgram-key"
E2B_API_KEY="your-e2b-key"
```

Start PostgreSQL:

```bash
docker compose up -d
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The backend runs at:

```text
http://localhost:4000
```

## Auth

Users can sign up or sign in with email and password. Passwords are hashed with bcrypt and stored in PostgreSQL. The backend creates the `users` table automatically on first auth request.

Landing page chat prompts redirect users to sign in or sign up, then continue into the dashboard.

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

```text
src/app/(root)            Landing page
src/app/(auth)            Sign in and sign up pages
src/app/(dashboard)       Protected dashboard route
src/components/landing    Landing page UI
src/components/auth       Auth UI
src/components/dashboard  Dashboard UI
src/server/index.ts       Node/Express backend
```

## CLI Package

The standalone scaffold CLI lives in:

```text
create-my-next-app-cli
```

Before publishing it, update `TEMPLATE_REPO_URL` in:

```text
create-my-next-app-cli/bin/cli.js
```

Then publish that package to npm so users can run:

```bash
npx create-my-next-app my-project
```

## Production Notes

- Use a strong `SESSION_SECRET`.
- Use a managed PostgreSQL database and update `DATABASE_URL`.
- Never commit real API keys.
- Set `BACKEND_URL` for the Next.js API proxy if the backend is not running on `http://localhost:4000`.
