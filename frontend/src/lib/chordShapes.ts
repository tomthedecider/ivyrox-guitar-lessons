// Standard open-position finger charts for the chords Ivyrox tracks mastery
// of. `frets` runs low E -> high e: "x" (muted), 0 (open), or a fret number.
// `barre` marks a first-finger bar across a fret, drawn as a bar behind the
// individual finger dots.
export interface ChordShape {
  frets: (number | "x")[];
  barre?: { fret: number; fromString: number; toString: number };
}

export const CHORD_SHAPES: Record<string, ChordShape> = {
  "E minor": { frets: [0, 2, 2, 0, 0, 0] },
  "E major": { frets: [0, 2, 2, 1, 0, 0] },
  "A minor": { frets: ["x", 0, 2, 2, 1, 0] },
  "A major": { frets: ["x", 0, 2, 2, 2, 0] },
  "D major": { frets: ["x", "x", 0, 2, 3, 2] },
  "D minor": { frets: ["x", "x", 0, 2, 3, 1] },
  "G major": { frets: [3, 2, 0, 0, 3, 3] },
  "C major": { frets: ["x", 3, 2, 0, 1, 0] },
  "F major (barre)": { frets: [1, 3, 3, 2, 1, 1], barre: { fret: 1, fromString: 0, toString: 5 } },
  "B minor (barre)": { frets: ["x", 2, 4, 4, 3, 2], barre: { fret: 2, fromString: 1, toString: 5 } },
  C7: { frets: ["x", 3, 2, 3, 1, 0] },
  G7: { frets: [3, 2, 0, 0, 0, 1] },
  A7: { frets: ["x", 0, 2, 0, 2, 0] },
};

// Standard tuning, low E to high e, in Hz.
const OPEN_STRING_HZ = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

// Pitches of every fretted/open (non-muted) string in a chord, low to high —
// what a clean reference playback of the chord should sound like.
export function getChordFrequencies(chordName: string): number[] {
  const shape = CHORD_SHAPES[chordName.trim()];
  if (!shape) return [];
  return shape.frets
    .map((fret, i) => (fret === "x" ? null : OPEN_STRING_HZ[i] * Math.pow(2, fret / 12)))
    .filter((freq): freq is number => freq !== null);
}
