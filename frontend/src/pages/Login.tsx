import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? "Wrong email or password." : "Something went wrong.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-card p-8 shadow-[0_0_40px_oklch(0.66_0.2_300_/_12%)]">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Ivyrox</h1>
          <p className="text-sm text-muted">Sign in to your guitar lesson space.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-line bg-chip px-3 py-2 text-ink outline-none focus:border-violet"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-chip px-3 py-2 text-ink outline-none focus:border-violet"
          />
        </div>

        {error && <p className="text-sm text-magenta">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[image:var(--grad)] px-3 py-2 font-medium text-accent-ink shadow-[0_0_20px_oklch(0.72_0.19_345_/_30%)] transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
