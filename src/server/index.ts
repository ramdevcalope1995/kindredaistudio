import bcrypt from "bcryptjs";
import cors from "cors";
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Pool } from "pg";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const GenerateInput = z.object({
  messages: z.array(MessageSchema).min(1),
});

const TTSInput = z.object({
  text: z.string().min(1).max(2000),
  voiceId: z.string().default("EXAVITQu4vr4xnSDxMaL"),
});

const SandboxInput = z.object({
  code: z.string().min(1),
  language: z.enum(["python", "javascript"]).default("python"),
});

const AuthInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().max(80).optional(),
});

const SYSTEM_PROMPT = `You are Knead, a playful AI app builder. The user describes ideas, often via voice.

When the user wants you to BUILD or MODIFY a UI/component/app, respond with a single self-contained HTML document that runs in an iframe sandbox. Use inline <style> with vibrant pastel colors (coral #FF6B6B, grape #8A78F2, mint #4ECDC4, clay #F4F0EB) and rounded, squishy aesthetics. Include all JS inline. Make it interactive and beautiful.

Wrap the HTML in a fenced code block tagged 'html'. Before the code block, give a SHORT (1-2 sentences) friendly description of what you built. After the block, optionally suggest one tiny next tweak.

For pure conversation (greetings, questions, clarifications), respond in plain text without any code block. Keep responses concise - they may be spoken aloud.`;

const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
const cookieName = "knead_session";
const sessionMaxAgeMs = 1000 * 60 * 60 * 24 * 7;

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

// Create HTTP server and attach Socket.IO
// Initialize Sentry error monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN || '', // Will not initialize if no DSN provided
  integrations: [
    // Enable HTTP instrumentation (recommended)
    new Sentry.Integrations.Http({ tracing: true }),
    // Enable Express tracing
    new Tracing.Integrations.Express({ app }),
    // Automatically instrument Node.js standard library modules
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  environment: process.env.NODE_ENV || 'development',
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.sentry.io", clientOrigin.replace(/^https?:\/\//, '')],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(cors({ origin: clientOrigin, credentials: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Socket.IO real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId: string, userId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
    
    // Notify room about current collaborators
    const room = io.sockets.adapter.rooms.get(roomId);
    const currentUsers = room ? Array.from(room) : [];
    io.to(socket.id).emit('room-users', { roomId, users: currentUsers.length });
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { socketId: socket.id });
  });

  socket.on('code-change', (data: { roomId: string; userId: string; code: string; timestamp: number }) => {
    socket.to(data.roomId).emit('code-update', data);
  });

  socket.on('cursor-move', (data: { roomId: string; userId: string; position: { x: number; y: number }; timestamp: number }) => {
    socket.to(data.roomId).emit('cursor-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// More restrictive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post(
  "/api/auth/signup",
  authLimiter,
  express.json({ limit: "128kb" }),
  asyncHandler(async (req, res) => {
    const data = AuthInput.parse(req.body);
    await initDb();

    const passwordHash = await bcrypt.hash(data.password, 12);
    try {
      const result = await getPool().query<{ id: string; email: string; name: string | null }>(
        `insert into users (email, password_hash, name)
         values ($1, $2, $3)
         returning id, email, name`,
        [data.email.toLowerCase(), passwordHash, data.name || null],
      );
      setSessionCookie(res, result.rows[0].id);
      res.status(201).json({ user: result.rows[0] });
    } catch (err) {
      if (isUniqueViolation(err)) throw new HttpError(409, "Email is already registered");
      throw err;
    }
  }),
);

app.post(
  "/api/auth/login",
  authLimiter,
  express.json({ limit: "128kb" }),
  asyncHandler(async (req, res) => {
    const data = AuthInput.parse(req.body);
    await initDb();

    const result = await getPool().query<{
      id: string;
      email: string;
      name: string | null;
      password_hash: string;
    }>("select id, email, name, password_hash from users where email = $1", [
      data.email.toLowerCase(),
    ]);

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    setSessionCookie(res, user.id);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  }),
);

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get(
  "/api/auth/me",
  asyncHandler(async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new HttpError(401, "Not authenticated");
    res.json({ user });
  }),
);

app.get(
  "/api/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new HttpError(401, "Not authenticated");
    await initDb();

    // Get user's projects from database
    const result = await getPool().query<{
      id: string;
      title: string;
      user_id: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, title, user_id, created_at, updated_at 
       FROM projects 
       WHERE user_id = $1 
       ORDER BY updated_at DESC LIMIT 10`,
      [user.id],
    );

    const projects = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      edited: `Edited ${formatTimeAgo(new Date(row.updated_at))}`
    }));

    res.json({ projects });
  }),
);

app.post(
  "/api/projects",
  requireAuth,
  express.json({ limit: "128kb" }),
  asyncHandler(async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new HttpError(401, "Not authenticated");
    const { title } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new HttpError(400, "Title is required");
    }
    
    await initDb();
    
    const result = await getPool().query<{
      id: string;
      title: string;
      user_id: string;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO projects (title, user_id) 
       VALUES ($1, $2) 
       RETURNING id, title, user_id, created_at, updated_at`,
      [title.trim(), user.id],
    );

    const project = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      edited: `Edited ${formatTimeAgo(new Date(result.rows[0].updated_at))}`
    };

    res.status(201).json({ project });
  }),
);

// Rate limiting for API generation endpoints
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each authenticated user to 10 requests per minute
  message: 'Too many generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use the authenticated user ID as the key
    return (req as any).user?.id || req.ip || 'unknown';
  },
});

app.post(
  "/api/generate",
  requireAuth,
  generateLimiter,
  express.json({ limit: "1mb" }),
  asyncHandler(async (req, res) => {
    const data = GenerateInput.parse(req.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new HttpError(500, "ANTHROPIC_API_KEY not configured");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: data.messages,
      }),
    });

    if (!response.ok) {
      throw new HttpError(response.status, `Claude API error: ${await response.text()}`);
    }

    const json = (await response.json()) as { content: Array<{ type: string; text?: string }> };
    const text = json.content
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("");

    const htmlMatch = text.match(/```html\n([\s\S]*?)```/);
    const code = htmlMatch ? htmlMatch[1].trim() : null;
    const prose = htmlMatch ? text.replace(htmlMatch[0], "").trim() : text.trim();

    res.json({ prose, code });
  }),
);

app.post(
  "/api/tts",
  requireAuth,
  express.json({ limit: "256kb" }),
  asyncHandler(async (req, res) => {
    const data = TTSInput.parse(req.body);
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new HttpError(500, "ELEVENLABS_API_KEY not configured");

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${data.voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!response.ok) {
      throw new HttpError(response.status, `ElevenLabs error: ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.json({ audio: Buffer.from(arrayBuffer).toString("base64") });
  }),
);

app.post(
  "/api/sandbox",
  requireAuth,
  express.json({ limit: "1mb" }),
  asyncHandler(async (req, res) => {
    const data = SandboxInput.parse(req.body);
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) throw new HttpError(500, "E2B_API_KEY not configured");

    const { Sandbox } = await import("@e2b/code-interpreter");
    const sandbox = await Sandbox.create({ apiKey });
    try {
      const exec = await sandbox.runCode(data.code, { language: data.language });
      res.json({
        stdout: exec.logs.stdout.join(""),
        stderr: exec.logs.stderr.join(""),
        error: exec.error ? `${exec.error.name}: ${exec.error.value}` : null,
        results: exec.results.map((result) => ({ text: result.text ?? null })),
      });
    } finally {
      await sandbox.kill().catch(() => {});
    }
  }),
);

app.post(
  "/api/stt",
  requireAuth,
  express.raw({ limit: "10mb", type: "*/*" }),
  asyncHandler(async (req, res) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) throw new HttpError(500, "DEEPGRAM_API_KEY not configured");

    const audio = req.body as Buffer;
    if (!audio.byteLength) throw new HttpError(400, "No audio");

    const contentType = req.header("content-type") ?? "audio/webm";
    const audioBody = audio.buffer.slice(
      audio.byteOffset,
      audio.byteOffset + audio.byteLength,
    ) as ArrayBuffer;
    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          authorization: `Token ${apiKey}`,
          "content-type": contentType,
        },
        body: audioBody,
      },
    );

    if (!response.ok) {
      throw new HttpError(response.status, `Deepgram error: ${await response.text()}`);
    }

    const json = (await response.json()) as {
      results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
    };
    const transcript = json.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
    res.json({ transcript });
  }),
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    res.status(400).send(err.issues.map((issue) => issue.message).join(", "));
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).send(err.message);
    return;
  }

  console.error(err);
  res.status(500).send(err instanceof Error ? err.message : "Internal server error");
});

// Sentry error handler (must be before other error middleware)
app.use(Sentry.Handlers.errorHandler());

httpServer.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

httpServer.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new HttpError(500, "DATABASE_URL not configured");
    pool = new Pool({ connectionString });
  }
  return pool;
}

async function initDb() {
  initPromise ??= getPool()
    .query(
      `
      create extension if not exists pgcrypto;

      create table if not exists users (
        id uuid primary key default gen_random_uuid(),
        email text not null unique,
        password_hash text not null,
        name text,
        created_at timestamptz not null default now()
      );

      create table if not exists projects (
        id uuid primary key default gen_random_uuid(),
        title text not null,
        user_id uuid not null references users(id) on delete cascade,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      -- Trigger to update the updated_at column
      create or replace function update_updated_at_column()
      returns trigger as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$ language plpgsql;

      create trigger update_projects_updated_at
        before update on projects
        for each row
        execute function update_updated_at_column();

      create index if not exists idx_projects_user_id on projects(user_id);
      create index if not exists idx_projects_updated_at on projects(updated_at);
    `,
    )
    .then(() => undefined);
  return initPromise;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) throw new HttpError(401, "Not authenticated");
    // Attach user to request for other middlewares
    (req as any).user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function getAuthenticatedUser(req: Request) {
  const token = readCookie(req, cookieName);
  const payload = verifySessionToken(token);
  if (!payload) return null;
  await initDb();

  const result = await getPool().query<{ id: string; email: string; name: string | null }>(
    "select id, email, name from users where id = $1",
    [payload.userId],
  );
  return result.rows[0] ?? null;
}

function setSessionCookie(res: Response, userId: string) {
  const expires = Date.now() + sessionMaxAgeMs;
  const token = createSessionToken(userId, expires);
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeMs,
    path: "/",
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(cookieName, { path: "/" });
}

function createSessionToken(userId: string, expires: number) {
  const body = `${userId}.${expires}`;
  return `${body}.${sign(body)}`;
}

function verifySessionToken(token: string | null) {
  if (!token) return null;
  const [userId, expires, signature] = token.split(".");
  if (!userId || !expires || !signature || Number(expires) < Date.now()) return null;

  const body = `${userId}.${expires}`;
  if (!safeEqual(signature, sign(body))) return null;
  return { userId };
}

function sign(value: string) {
  const secret =
    process.env.SESSION_SECRET ?? process.env.ANTHROPIC_API_KEY ?? "dev-session-secret";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function readCookie(req: Request, name: string) {
  const cookie = req.header("cookie");
  if (!cookie) return null;
  const match = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function isUniqueViolation(err: unknown) {
  return typeof err === "object" && err !== null && "code" in err && err.code === "23505";
}
