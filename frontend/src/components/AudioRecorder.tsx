import { useRef, useState } from "react";
import { api } from "../api/client";

// Never hardcode a mimeType — audio/webm throws NotSupportedError on
// Safari/iOS, which needs audio/mp4 instead. Probe and fall back to the
// browser default if nothing on the list matches.
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

type State = "idle" | "recording" | "recorded" | "uploading" | "done";

export default function AudioRecorder({ assignmentId, onUploaded }: { assignmentId: string; onUploaded: () => void }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");

  if (typeof MediaRecorder === "undefined") {
    return <p className="text-xs text-dim">Recording isn't supported in this browser.</p>;
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType ?? "audio/webm";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        setPreviewUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Microphone access was denied."
          : name === "NotFoundError"
            ? "No microphone found on this device."
            : "Couldn't start recording."
      );
      setState("idle");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState("idle");
  }

  async function upload() {
    if (chunksRef.current.length === 0) return;
    setState("uploading");
    setError(null);
    try {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      const ext = mimeTypeRef.current.includes("mp4") ? "m4a" : mimeTypeRef.current.includes("aac") ? "aac" : "webm";
      const formData = new FormData();
      formData.append("audio", blob, `practice.${ext}`);
      await api.upload(`/assignments/${assignmentId}/recording`, formData);
      setState("done");
      onUploaded();
    } catch {
      setError("Upload failed — try again.");
      setState("recorded");
    }
  }

  if (state === "done") {
    return <p className="text-sm text-gold">Recording saved ✓</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-magenta">{error}</p>}
      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-chip hover:text-ink"
        >
          ● Record practice
        </button>
      )}
      {state === "recording" && (
        <button
          type="button"
          onClick={stopRecording}
          className="rounded-lg border border-magenta px-3 py-1.5 text-sm font-medium text-magenta"
        >
          ■ Stop recording
        </button>
      )}
      {(state === "recorded" || state === "uploading") && previewUrl && (
        <div className="flex flex-wrap items-center gap-2">
          <audio controls src={previewUrl} className="h-8" />
          <button
            type="button"
            onClick={reRecord}
            disabled={state === "uploading"}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-chip hover:text-ink disabled:opacity-50"
          >
            Re-record
          </button>
          <button
            type="button"
            onClick={upload}
            disabled={state === "uploading"}
            className="rounded-lg bg-[image:var(--grad)] px-3 py-1.5 text-sm font-medium text-accent-ink shadow-[0_0_16px_oklch(0.72_0.19_345_/_35%)] transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
          >
            {state === "uploading" ? "Uploading…" : "Save recording"}
          </button>
        </div>
      )}
    </div>
  );
}
