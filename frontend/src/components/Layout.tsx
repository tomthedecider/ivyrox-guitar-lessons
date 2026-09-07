import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const studentLinks = [
  { to: "/", label: "Assignments", end: true },
  { to: "/library", label: "Library" },
  { to: "/progress", label: "Progress" },
];

const teacherLinks = [
  { to: "/", label: "Weekly Overview", end: true },
  { to: "/assign", label: "Assign" },
  { to: "/catalog", label: "Catalog" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const links = user?.role === "TEACHER" ? teacherLinks : studentLinks;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="shrink-0 border-b border-line-soft bg-bg">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="shrink-0 font-display text-lg font-bold tracking-tight">Ivyrox</span>
            <div className="flex min-w-0 items-center gap-2 text-sm text-dim">
              <span className="truncate">
                {user?.name} · {user?.role === "TEACHER" ? "Teacher" : "Student"}
              </span>
              <button onClick={logout} className="shrink-0 rounded-md px-2 py-1 text-muted hover:text-ink">
                Sign out
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 text-sm">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 font-medium transition ${
                    isActive
                      ? "bg-[image:var(--grad)] text-accent-ink shadow-[0_0_18px_oklch(0.66_0.2_300_/_40%)]"
                      : "text-muted hover:bg-chip hover:text-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
