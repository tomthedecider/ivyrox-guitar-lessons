import { useEffect, useRef, useState } from "react";

const MIN_BPM = 40;
const MAX_BPM = 240;
const STEP = 5;

// Self-correcting scheduler: each tick re-measures against performance.now()
// rather than trusting setInterval's drift, so tempo stays accurate over a
// multi-minute practice session.
export default function Metronome({ initialBpm = 80 }: { initialBpm?: number }) {
  const [bpm, setBpm] = useState(() => Math.min(MAX_BPM, Math.max(MIN_BPM, initialBpm)));
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextTickRef = useRef(0);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const AudioContextCtor =
    typeof window !== "undefined" ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;

  if (!AudioContextCtor) {
    return <p className="text-xs text-dim">Metronome isn't supported in this browser.</p>;
  }

  function click() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  function scheduleNext() {
    nextTickRef.current += 60000 / bpmRef.current;
    const delay = Math.max(0, nextTickRef.current - performance.now());
    timerRef.current = window.setTimeout(() => {
      click();
      scheduleNext();
    }, delay);
  }

  function start() {
    audioCtxRef.current = new AudioContextCtor!();
    nextTickRef.current = performance.now();
    setPlaying(true);
    click();
    scheduleNext();
  }

  function stop() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setPlaying(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-chip px-3 py-2">
      <button
        type="button"
        onClick={() => setBpm((b) => Math.max(MIN_BPM, b - STEP))}
        className="h-6 w-6 shrink-0 rounded-md text-muted hover:bg-card hover:text-ink"
        aria-label="Decrease tempo"
      >
        −
      </button>
      <span className="w-16 shrink-0 text-center text-sm font-medium tabular-nums">{bpm} BPM</span>
      <button
        type="button"
        onClick={() => setBpm((b) => Math.min(MAX_BPM, b + STEP))}
        className="h-6 w-6 shrink-0 rounded-md text-muted hover:bg-card hover:text-ink"
        aria-label="Increase tempo"
      >
        +
      </button>
      <button
        type="button"
        onClick={playing ? stop : start}
        className={
          playing
            ? "rounded-lg border border-magenta px-3 py-1.5 text-sm font-medium text-magenta"
            : "rounded-lg bg-[image:var(--grad)] px-3 py-1.5 text-sm font-medium text-accent-ink shadow-[0_0_16px_oklch(0.72_0.19_345_/_35%)] transition hover:brightness-110"
        }
      >
        {playing ? "■ Stop" : "▶ Metronome"}
      </button>
    </div>
  );
}
