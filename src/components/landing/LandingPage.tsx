"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Code2, Layers3, LockKeyhole, Sparkles } from "lucide-react";

export function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const submitPrompt = (event: FormEvent) => {
    event.preventDefault();
    const next = prompt.trim();
    if (!next) return;
    router.push(`/signin?prompt=${encodeURIComponent(next)}`);
  };

  return (
    <main className="min-h-dvh bg-[#080808] text-white">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/8 bg-[#080808]/82 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3 font-black">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff3d65] via-[#7c6cff] to-[#ff7a18]">
              L
            </span>
            Lovable Clone
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="hidden text-sm font-bold text-white/65 sm:inline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black"
            >
              Start building
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden px-5 pb-28 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(95,121,255,0.5),transparent_34%),linear-gradient(180deg,#151515_0%,#234dbe_34%,#f26fe6_65%,#ff2e7d_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#080808] to-transparent" />
        <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col items-center justify-center text-center">
          <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
            Build software by chatting with your stack.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-white/70">
            Prompt a full app, preview it live, edit the code, and keep the creative loop moving.
          </p>
          <form
            onSubmit={submitPrompt}
            className="mt-10 w-full max-w-3xl rounded-[30px] border border-black/40 bg-[#242422] p-4 text-left shadow-2xl shadow-black/40"
          >
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              className="w-full resize-none bg-transparent px-3 py-2 text-lg font-bold text-white outline-none placeholder:text-white/42"
              placeholder="Ask Lovable Clone to build a habit tracker with charts..."
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white/45">
                <Sparkles className="size-4" />
                Build mode
              </div>
              <button className="grid size-12 place-items-center rounded-full bg-white text-black transition hover:scale-105">
                <ArrowRight className="size-5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-20 md:grid-cols-3">
        {[
          [
            "Prompt to product",
            "Describe screens, data, and interactions. The builder returns working app code.",
          ],
          [
            "Live preview",
            "Inspect the generated interface in an iframe before you decide what to change next.",
          ],
          [
            "Secure workspace",
            "Email/password accounts keep future projects ready for persistence.",
          ],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-7">
            <Code2 className="mb-8 size-7 text-[#ff5ea8]" />
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/55">{copy}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-5 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              A dashboard made for vibe coding.
            </h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-white/58">
              Projects, generated previews, prompts, and code sit in one focused workspace.
            </p>
          </div>
          <div className="rounded-[32px] bg-gradient-to-br from-[#1d1d1d] to-[#111] p-4 shadow-2xl shadow-black/50">
            <div className="rounded-[24px] bg-[linear-gradient(160deg,#253a63,#7f7dff_42%,#fb4fa9_70%,#ff6c19)] p-6">
              <div className="rounded-3xl bg-[#17100e]/92 p-6">
                <div className="mb-5 flex gap-3 text-sm font-black text-white/70">
                  <span className="rounded-lg border border-white/15 px-3 py-2 text-white">
                    My projects
                  </span>
                  <span className="px-3 py-2">Recently viewed</span>
                  <span className="px-3 py-2">Templates</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-36 rounded-2xl bg-[#15161b]" />
                  <div className="h-36 rounded-2xl bg-[#15161b]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-24 md:grid-cols-2">
        <div>
          <Layers3 className="mb-6 size-8 text-[#7c8cff]" />
          <h2 className="text-4xl font-black tracking-tight">From idea to editable code.</h2>
        </div>
        <p className="text-lg font-semibold leading-8 text-white/58">
          Generated apps are self-contained HTML previews with runnable scripts, so you can test the
          feeling before deep implementation.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-28">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.05] p-8 md:p-12">
          <LockKeyhole className="mb-8 size-8 text-[#23c88f]" />
          <h2 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Accounts first, builds second.
          </h2>
          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/58">
            Landing-page prompts intentionally route through sign in or sign up, then continue
            inside the dashboard.
          </p>
        </div>
      </section>
    </main>
  );
}
