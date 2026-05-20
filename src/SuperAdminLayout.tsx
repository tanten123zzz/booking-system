import { NavLink, Outlet, Navigate } from "react-router";
import { 
  Building2, 
  MessageSquare, 
  Settings, 
  Database,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { PortalSwitcher } from "./components/PortalSwitcher";
import { useAppContext } from "./context/AppContext";

export function SuperAdminLayout() {
  const { currentUser, logout } = useAppContext();

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: "Tenants (Salons)", path: "/super-admin/tenants", icon: Building2 },
    { name: "SMS & API Config", path: "/super-admin/twilio", icon: MessageSquare },
    { name: "Global Settings", path: "/super-admin/settings", icon: Settings },
    { name: "Database Backups", path: "/super-admin/database", icon: Database },
  ];

  return (
    <div className="h-screen w-full bg-[#0F0F12] text-slate-300 font-sans flex overflow-hidden">
      <PortalSwitcher />
      {/* Sidebar */}
      <aside className="w-64 bg-[#111114] border-r border-[#1F1F23] flex flex-col">
        <div className="p-6 border-b border-[#1F1F23] flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            <ShieldAlert size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 py-4 flex flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-sm transition-colors rounded-none ${
                    isActive 
                      ? "bg-[#1A1A1E] text-indigo-400 border-l-2 border-indigo-500 font-bold" 
                      : "text-slate-400 hover:bg-[#1A1A1E] border-l-2 border-transparent font-medium"
                  }`
                }
              >
                <Icon size={16} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1F1F23]">
          <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 mb-4">
            <div className="text-[10px] text-slate-500 uppercase mb-2">System Health</div>
            <div className="flex gap-1 h-1">
              <div className="flex-1 bg-emerald-500 rounded-full"></div>
              <div className="flex-1 bg-emerald-500 rounded-full"></div>
              <div className="flex-1 bg-emerald-500 rounded-full"></div>
              <div className="flex-1 bg-amber-500 rounded-full"></div>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white w-full transition-colors">
            <LogOut size={16} />
            Logout System
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-[#0F0F12]">
        {/* Topbar */}
        <header className="h-16 border-b border-[#1F1F23] px-8 flex items-center justify-between bg-[#111114]">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-white tracking-wide">IT Operations Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[11px] font-bold text-slate-400">System Status: <span className="text-emerald-400">All Green</span></div>
            <div className="w-8 h-8 rounded-full bg-indigo-500 font-bold text-white flex items-center justify-center text-sm">IT</div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 text-slate-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
