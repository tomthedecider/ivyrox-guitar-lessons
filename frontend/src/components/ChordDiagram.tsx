import { CHORD_SHAPES } from "../lib/chordShapes";

const STRING_X = [4, 13.6, 23.2, 32.8, 42.4, 52];
const WIDTH = 56;
const NUT_Y = 14;
const FRET_HEIGHT = 14;
const FRET_COUNT = 4;
const MARKER_Y = 8;
const HEIGHT = NUT_Y + FRET_HEIGHT * FRET_COUNT;

// Small fretboard diagram for a chord name. Falls back to a placeholder
// outline (same footprint, so grid layouts don't reflow) for any chord not
// in the lookup table — chordName is a free string in the database even
// though today's UI only ever produces the known seeded set.
export default function ChordDiagram({ chordName }: { chordName: string }) {
  const shape = CHORD_SHAPES[chordName.trim()];

  if (!shape) {
    return (
      <svg width={WIDTH} height={HEIGHT + MARKER_Y} viewBox={`0 0 ${WIDTH} ${HEIGHT + MARKER_Y}`} className="shrink-0">
        <rect
          x={2}
          y={MARKER_Y + 2}
          width={WIDTH - 4}
          height={HEIGHT - 4}
          rx={4}
          className="fill-none stroke-line"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  return (
    <svg width={WIDTH} height={HEIGHT + MARKER_Y} viewBox={`0 0 ${WIDTH} ${HEIGHT + MARKER_Y}`} className="shrink-0">
      {shape.frets.map((f, i) => (
        <text key={`m-${i}`} x={STRING_X[i]} y={MARKER_Y} textAnchor="middle" fontSize="7" className="fill-dim">
          {f === "x" ? "×" : f === 0 ? "o" : ""}
        </text>
      ))}
      <line x1={STRING_X[0]} y1={NUT_Y} x2={STRING_X[5]} y2={NUT_Y} className="stroke-ink" strokeWidth={2.5} />
      {Array.from({ length: FRET_COUNT }).map((_, i) => (
        <line
          key={`fret-${i}`}
          x1={STRING_X[0]}
          y1={NUT_Y + (i + 1) * FRET_HEIGHT}
          x2={STRING_X[5]}
          y2={NUT_Y + (i + 1) * FRET_HEIGHT}
          className="stroke-line"
          strokeWidth={1}
        />
      ))}
      {STRING_X.map((x, i) => (
        <line key={`str-${i}`} x1={x} y1={NUT_Y} x2={x} y2={NUT_Y + FRET_COUNT * FRET_HEIGHT} className="stroke-line" strokeWidth={1} />
      ))}
      {shape.barre && (
        <rect
          x={STRING_X[shape.barre.fromString] - 4}
          y={NUT_Y + (shape.barre.fret - 0.5) * FRET_HEIGHT - 4}
          width={STRING_X[shape.barre.toString] - STRING_X[shape.barre.fromString] + 8}
          height={8}
          rx={4}
          className="fill-violet"
        />
      )}
      {shape.frets.map((f, i) =>
        typeof f === "number" && f > 0 ? (
          <circle key={`dot-${i}`} cx={STRING_X[i]} cy={NUT_Y + (f - 0.5) * FRET_HEIGHT} r={4} className="fill-magenta" />
        ) : null
      )}
    </svg>
  );
}
