import { useEffect, useRef, useState } from "react";

type Status = "idle" | "recording" | "transcribing";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(7).fill(0.3));
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const stop = async () => {
    if (recRef.current && recRef.current.state !== "inactive") {
      recRef.current.stop();
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    audioCtxRef.current?.close().catch(() => {});
  };

  useEffect(() => () => void stop(), []);

  const tick = () => {
    const a = analyserRef.current;
    if (!a) return;
    const data = new Uint8Array(a.frequencyBinCount);
    a.getByteFrequencyData(data);
    const bins = 7;
    const step = Math.floor(data.length / bins);
    const next = Array.from({ length: bins }, (_, i) => {
      let s = 0;
      for (let j = 0; j < step; j++) s += data[i * step + j];
      return Math.max(0.2, Math.min(1, s / step / 180));
    });
    setLevels(next);
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    if (disabled || status !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1000) {
          setStatus("idle");
          setSeconds(0);
          return;
        }
        setStatus("transcribing");
        try {
          const res = await fetch("/api/stt", {
            method: "POST",
            headers: { "content-type": mime },
            body: blob,
          });
          const json = (await res.json()) as { transcript?: string };
          if (json.transcript) onTranscript(json.transcript);
        } catch (err) {
          console.error("STT failed", err);
        } finally {
          setStatus("idle");
          setSeconds(0);
        }
      };
      recRef.current = rec;

      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      rec.start();
      setStatus("recording");
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      tick();
    } catch (err) {
      console.error("mic error", err);
      alert("Microphone permission denied");
    }
  };

  const handleClick = () => (status === "recording" ? stop() : start());
  const isRec = status === "recording";

  return (
    <div className="h-20 bg-clay rounded-[2rem] p-2 flex items-center gap-2 border border-white shadow-[var(--shadow-squish)] transition-all hover:shadow-[0_8px_16px_-2px_rgba(138,120,242,0.2)]">
      <div className="flex items-center justify-center h-full px-4 gap-1.5 flex-1 min-w-0">
        {status === "transcribing" ? (
          <div className="flex items-center gap-2 text-ink/60 font-bold text-sm">
            <div className="size-4 rounded-full border-2 border-t-grape border-ink/10 animate-spin" />
            <span className="hidden sm:inline">Transcribing…</span>
            <span className="sm:hidden">…</span>
          </div>
        ) : isRec ? (
          <>
            {levels.map((lv, i) => {
              const colors = ["bg-mint", "bg-mint", "bg-grape", "bg-grape", "bg-coral", "bg-coral", "bg-mint"];
              return (
                <div
                  key={i}
                  className={`w-2.5 rounded-full ${colors[i]} transition-all duration-75`}
                  style={{ height: `${Math.round(lv * 48)}px` }}
                />
              );
            })}
            <span className="ml-3 text-xs font-bold text-ink/50 tabular-nums">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </>
        ) : (
          <span className="text-sm font-bold text-ink/40">🎤 Tap to speak…</span>
        )}
      </div>
      <button
        onClick={handleClick}
        disabled={disabled || status === "transcribing"}
        aria-label={isRec ? "Stop recording" : "Start recording"}
        className={`size-16 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-50 ${
          isRec 
            ? "bg-coral shadow-coral animate-pulse scale-110" 
            : "bg-mint shadow-mint hover:scale-105"
        }`}
      >
        {isRec ? (
          <div className="size-5 bg-white rounded-md animate-pulse" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-7 text-white" fill="currentColor">
            <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
            <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.92V20H8a1 1 0 100 2h8a1 1 0 100-2h-3v-2.08A7 7 0 0019 11z" />
          </svg>
        )}
      </button>
    </div>
  );
}
