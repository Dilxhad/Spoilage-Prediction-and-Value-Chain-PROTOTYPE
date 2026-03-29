// src/components/Navbar.jsx
import { NavLink } from "react-router-dom";

const links = [
  { to: "/",          label: "Dashboard", icon: "📊" },
  { to: "/batches",   label: "Batches",   icon: "📦" },
  { to: "/analytics", label: "Analytics", icon: "📈" },
  { to: "/predict",   label: "Predict",   icon: "🔮" },
];

export default function Navbar() {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">AgroWatch</p>
            <p className="text-xs text-gray-400">Value Chain Monitor</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Powered by XGBoost</p>
        <p className="text-xs text-gray-400">FastAPI + React</p>
      </div>
    </aside>
  );
}
