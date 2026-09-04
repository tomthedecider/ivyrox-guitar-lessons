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
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold tracking-tight">Ivyrox</span>
            <nav className="flex gap-4 text-sm">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-md px-2 py-1 transition ${
                      isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <span>
              {user?.name} · {user?.role === "TEACHER" ? "Teacher" : "Student"}
            </span>
            <button onClick={logout} className="rounded-md px-2 py-1 hover:bg-stone-100">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
