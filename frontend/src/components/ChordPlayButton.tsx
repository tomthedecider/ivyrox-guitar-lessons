import { useRef } from "react";
import { getChordFrequencies } from "../lib/chordShapes";

// Plays a clean reference strum of the chord (Web Audio, no sample assets)
// so the student can compare her own tone against it. Lives inside the
// same <label> as the mastery checkbox, so clicks must not toggle it.
export default function ChordPlayButton({ chordName }: { chordName: string }) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const frequencies = getChordFrequencies(chordName);

  const AudioContextCtor =
    typeof window !== "undefined"
      ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;

  if (!AudioContextCtor || frequencies.length === 0) return null;

  function play(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContextCtor!();
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    frequencies.forEach((freq, i) => {
      const start = now + i * 0.03; // gentle low-to-high strum stagger
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.4);
    });
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Play ${chordName}`}
      title={`Play ${chordName}`}
      className="rounded-md p-1 text-dim hover:bg-card hover:text-cyan"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 6a8.5 8.5 0 0 1 0 12" />
      </svg>
    </button>
  );
}
