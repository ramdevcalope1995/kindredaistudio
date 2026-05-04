import { useState } from "react";

interface Props {
  code: string | null;
  open: boolean;
  onClose: () => void;
}

type Tab = "preview" | "code" | "console";

export function PreviewIDE({ code, open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("preview");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{
    stdout: string;
    stderr: string;
    error: string | null;
  } | null>(null);

  const runE2B = async () => {
    if (!code) return;
    setRunning(true);
    setOutput(null);
    try {
      // Extract a <script> block to run in E2B as JS, fall back to a noop probe
      const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const js = scriptMatch
        ? scriptMatch[1]
        : "console.log('No <script> block detected — preview is pure HTML/CSS.')";
      const response = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: `// E2B sandbox running extracted JS\ntry {\n${js}\n} catch(e) { console.error(e.message) }`,
          language: "javascript",
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const res = (await response.json()) as {
        stdout: string;
        stderr: string;
        error: string | null;
      };
      setOutput({ stdout: res.stdout, stderr: res.stderr, error: res.error });
    } catch (err) {
      setOutput({ stdout: "", stderr: String(err), error: String(err) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-label="Code preview"
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute inset-x-2 bottom-2 top-12 bg-void rounded-[2rem] shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <header className="h-16 shrink-0 flex items-center px-4 gap-2 border-b border-white/5">
          {(["preview", "code", "console"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide capitalize transition-colors ${
                tab === t ? "bg-white/10 text-white" : "text-white/40"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={onClose}
            className="ml-auto size-9 rounded-full bg-white/10 text-white flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 p-3 overflow-hidden">
          {!code ? (
            <div className="h-full grid place-items-center text-white/40 text-sm font-bold">
              No app yet — describe one to Knead
            </div>
          ) : tab === "preview" ? (
            <iframe
              title="Sandbox preview"
              sandbox="allow-scripts"
              srcDoc={code}
              className="w-full h-full bg-clay rounded-[1.5rem] border-0"
            />
          ) : tab === "code" ? (
            <pre className="w-full h-full overflow-auto bg-[#1E212D] rounded-[1.5rem] p-5 text-[12px] leading-relaxed text-clay/80 font-mono">
              {code}
            </pre>
          ) : (
            <div className="w-full h-full bg-[#1E212D] rounded-[1.5rem] p-5 overflow-auto font-mono text-[12px] flex flex-col gap-3">
              <button
                onClick={runE2B}
                disabled={running}
                className="self-start px-4 py-2 rounded-full bg-mint text-void font-bold text-xs disabled:opacity-50"
              >
                {running ? "Running in E2B…" : "▶ Run JS in E2B sandbox"}
              </button>
              {output && (
                <div className="flex flex-col gap-2 text-clay/80">
                  {output.stdout && (
                    <div>
                      <div className="text-mint font-bold mb-1">stdout</div>
                      <pre className="whitespace-pre-wrap">{output.stdout}</pre>
                    </div>
                  )}
                  {output.stderr && (
                    <div>
                      <div className="text-coral font-bold mb-1">stderr</div>
                      <pre className="whitespace-pre-wrap text-coral/80">{output.stderr}</pre>
                    </div>
                  )}
                  {output.error && (
                    <div>
                      <div className="text-coral font-bold mb-1">error</div>
                      <pre className="whitespace-pre-wrap text-coral/80">{output.error}</pre>
                    </div>
                  )}
                  {!output.stdout && !output.stderr && !output.error && (
                    <div className="text-clay/40">No output.</div>
                  )}
                </div>
              )}
              {!output && !running && (
                <div className="text-clay/40">Tap Run to execute the script in an E2B sandbox.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
