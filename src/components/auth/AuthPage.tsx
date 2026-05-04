"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Mode = "signin" | "signup";

export function AuthPage({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pendingPrompt = useMemo(() => searchParams.get("prompt") ?? "", [searchParams]);
  const isSignup = mode === "signup";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) throw new Error(await res.text());

      const promptQuery = pendingPrompt ? `?prompt=${encodeURIComponent(pendingPrompt)}` : "";
      router.push(`/dashboard${promptQuery}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#090909] text-white">
      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_420px]">
        <section>
          <Link href="/" className="mb-16 inline-flex items-center gap-3 text-lg font-black">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff3d65] via-[#7c6cff] to-[#ff7a18]">
              L
            </span>
            Lovable Clone
          </Link>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
            Sign in, then build at full speed.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-white/58">
            Your prompts, previews, generated code, and future projects live behind a secure
            account.
          </p>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40">
          <h2 className="text-2xl font-black">{isSignup ? "Create account" : "Welcome back"}</h2>
          <p className="mt-2 text-sm font-semibold text-white/50">
            {pendingPrompt
              ? "Finish this step to continue your prompt."
              : "Use email and password to continue."}
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            {isSignup && (
              <label className="text-sm font-bold text-white/70">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#151515] px-4 text-white outline-none ring-[#6b7cff] transition focus:ring-2"
                  placeholder="Ramdev"
                />
              </label>
            )}
            <label className="text-sm font-bold text-white/70">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#151515] px-4 text-white outline-none ring-[#6b7cff] transition focus:ring-2"
                placeholder="you@example.com"
              />
            </label>
            <label className="text-sm font-bold text-white/70">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                minLength={8}
                required
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#151515] px-4 text-white outline-none ring-[#6b7cff] transition focus:ring-2"
                placeholder="At least 8 characters"
              />
            </label>

            {error && (
              <div className="rounded-xl bg-[#ff3d65]/15 px-4 py-3 text-sm font-bold text-[#ff8aa2]">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="mt-2 h-12 rounded-xl bg-white font-black text-black transition hover:bg-white/90 disabled:opacity-60"
            >
              {loading ? "Working..." : isSignup ? "Sign up" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-white/50">
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <Link
              href={`${isSignup ? "/signin" : "/signup"}${pendingPrompt ? `?prompt=${encodeURIComponent(pendingPrompt)}` : ""}`}
              className="text-white underline underline-offset-4"
            >
              {isSignup ? "Sign in" : "Create one"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
