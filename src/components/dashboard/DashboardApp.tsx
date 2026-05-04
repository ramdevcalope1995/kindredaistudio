"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Boxes,
  ChevronDown,
  Code2,
  Gift,
  Home,
  LayoutGrid,
  Mic,
  PanelLeft,
  Plus,
  Search,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { PreviewIDE } from "@/components/PreviewIDE";

interface User {
  id: string;
  email: string;
  name: string | null;
}

const projects = [
  { title: "Claude Companion Chat", edited: "Edited 31 minutes ago" },
  { title: "Kindred AI Studio", edited: "Edited 4 hours ago" },
];

export function DashboardApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState(searchParams.get("prompt") ?? "");
  const [loadingUser, setLoadingUser] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [ideOpen, setIdeOpen] = useState(false);
  const ranInitialPrompt = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/signin");
        return;
      }
      const data = (await res.json()) as { user: User };
      setUser(data.user);
      setLoadingUser(false);
    };

    void loadUser();
  }, [router]);

  const generate = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || generating) return;
      setGenerating(true);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content }] }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { code: string | null };
        if (data.code) {
          setActiveCode(data.code);
          setIdeOpen(true);
        }
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setGenerating(false);
      }
    },
    [generating],
  );

  useEffect(() => {
    if (!user || ranInitialPrompt.current) return;
    const initial = searchParams.get("prompt");
    if (!initial) return;
    ranInitialPrompt.current = true;
    void generate(initial);
  }, [generate, searchParams, user]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void generate(prompt);
  };

  if (loadingUser) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#090909] text-sm font-black text-white/55">
        Loading workspace...
      </main>
    );
  }

  const displayName = user?.name || user?.email.split("@")[0] || "Builder";

  return (
    <main className="h-dvh overflow-hidden bg-[#090909] text-white">
      <div className="grid h-full lg:grid-cols-[336px_1fr]">
        <aside className="hidden h-dvh overflow-hidden border-r border-white/8 bg-[#080808] p-5 lg:flex lg:flex-col">
          <div className="mb-7 flex items-center justify-between">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff3d65] via-[#7c6cff] to-[#ff7a18] font-black">
              L
            </div>
            <PanelLeft className="size-4 text-white/65" />
          </div>

          <button className="mb-4 flex h-11 items-center justify-between rounded-xl border border-white/12 bg-white/[0.06] px-3 text-left">
            <span className="flex items-center gap-3 font-black">
              <span className="grid size-7 place-items-center rounded-lg bg-[#dc3107] text-sm">
                R
              </span>
              {displayName}&apos;s Lovable
            </span>
            <ChevronDown className="size-4 text-white/70" />
          </button>

          <nav className="space-y-1 text-[15px] font-black">
            <SideItem active icon={<Home />} label="Home" />
            <SideItem icon={<Search />} label="Search" shortcut="Ctrl K" />
            <SideItem icon={<Sparkles />} label="Resources" />
            <SideItem icon={<Boxes />} label="Connectors" />
          </nav>

          <div className="mt-8 space-y-1 text-[15px] font-black">
            <p className="mb-3 px-2 text-sm text-white/45">Projects</p>
            <SideItem icon={<LayoutGrid />} label="All projects" />
            <SideItem icon={<Star />} label="Starred" />
            <SideItem icon={<Users />} label="Created by me" />
            <SideItem icon={<Users />} label="Shared with me" />
          </div>

          <div className="mt-6">
            <p className="mb-3 px-2 text-sm font-black text-white/45">Recents</p>
            <p className="px-2 text-sm font-bold text-white/70">Claude Companion Chat</p>
          </div>

          <div className="mt-auto space-y-3">
            <Promo icon={<Gift />} title="Share Lovable" copy="100 credits per paid referral" />
            <Promo icon={<Zap />} title="Upgrade to Pro" copy="Unlock more features" accent />
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#294d99] to-[#ff6238] text-xs font-black">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="rounded-lg px-3 py-2 text-xs font-black text-white/55 hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <section className="h-dvh min-w-0 overflow-y-auto p-3 md:p-4">
          <div className="min-h-full overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#171717_0%,#263f80_28%,#f06be5_54%,#ff2d7b_76%,#ff6b18_100%)]">
            <div className="flex min-h-[500px] flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-black/18 px-4 py-3 text-sm font-black shadow-xl shadow-black/20">
                <span className="rounded-full bg-[#1f67ff] px-3 py-1">New</span>
                Try the Lovable mobile app
                <ArrowUp className="size-4 rotate-90" />
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Let&apos;s build something, {displayName.toUpperCase()}
              </h1>

              <form
                onSubmit={submit}
                className="mt-10 w-full max-w-[840px] rounded-[34px] border border-black/45 bg-[#242421] p-4 text-left shadow-2xl shadow-black/30"
              >
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent px-3 py-2 text-lg font-bold text-white outline-none placeholder:text-white/45"
                  placeholder="Ask Lovable to analyze my"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full text-white/65 hover:bg-white/10"
                  >
                    <Plus className="size-5" />
                  </button>
                  <div className="ml-auto flex items-center gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm font-black text-white/75"
                    >
                      Build <ChevronDown className="size-4" />
                    </button>
                    <Mic className="size-5 text-white/75" />
                    <button
                      disabled={generating}
                      className="grid size-12 place-items-center rounded-full bg-white/35 text-black transition hover:bg-white disabled:opacity-50"
                    >
                      {generating ? (
                        <Bot className="size-5 animate-pulse" />
                      ) : (
                        <ArrowUp className="size-5" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <section className="mx-auto mb-14 max-w-[calc(100%-48px)] rounded-[28px] bg-[#140c09]/95 p-8 shadow-2xl shadow-black/30 md:p-10">
              <div className="mb-10 flex flex-wrap items-center gap-5 text-base font-black text-white/58">
                <button className="rounded-lg border border-white/20 bg-white/[0.04] px-4 py-3 text-white">
                  My projects
                </button>
                <button>Recently viewed</button>
                <button>Templates</button>
                <button className="ml-auto hidden items-center gap-2 text-white md:flex">
                  Browse all <ArrowUp className="size-4 rotate-90" />
                </button>
              </div>

              <div className="grid gap-8 xl:grid-cols-2">
                {projects.map((project) => (
                  <article key={project.title}>
                    <div className="grid h-56 place-items-center rounded-xl bg-[#15161b] text-white/45">
                      <Code2 className="size-9 opacity-60" />
                    </div>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#294d99] to-[#ff6238] text-xs font-black">
                        {displayName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-black">{project.title}</h2>
                        <p className="mt-1 text-base font-bold text-white/52">{project.edited}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>

      <PreviewIDE code={activeCode} open={ideOpen} onClose={() => setIdeOpen(false)} />
    </main>
  );
}

function SideItem({
  icon,
  label,
  active,
  shortcut,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left ${
        active ? "bg-white/22 text-white" : "text-white/82 hover:bg-white/8"
      }`}
    >
      <span className="grid size-5 place-items-center [&_svg]:size-4">{icon}</span>
      <span>{label}</span>
      {shortcut && (
        <span className="ml-auto rounded-md bg-white/14 px-1.5 py-0.5 text-[10px] text-white/65">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Promo({
  icon,
  title,
  copy,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="min-w-0">
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm font-bold text-white/50">{copy}</p>
      </div>
      <div
        className={`ml-auto grid size-10 place-items-center rounded-full ${accent ? "bg-[#4c45a0]" : "bg-white/8"}`}
      >
        <span className="[&_svg]:size-4">{icon}</span>
      </div>
    </div>
  );
}
