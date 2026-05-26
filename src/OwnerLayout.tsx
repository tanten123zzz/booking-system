import React, { useState } from "react";
import { NavLink, Outlet, Navigate, useParams } from "react-router";
import { Users, Scissors, Calendar, LogOut, CodeSquare, Settings, UserCircle, List, Tag, Bell, Clock } from "lucide-react";
import { PortalSwitcher } from "./components/PortalSwitcher";
import { useAppContext } from "./context/AppContext";

export function OwnerLayout() {
  const { currentUser, logout, tenantSettings, tenants } = useAppContext();
  const { tenantSlug } = useParams();
  const [showNotifications, setShowNotifications] = useState(false);

  const tenant = tenantSlug ? tenants.find(t => t.slug === tenantSlug) : null;

  if (!currentUser || !currentUser.token || currentUser.role !== 'OWNER' || (tenant && currentUser.tenantId !== tenant.id)) {
    return <Navigate to={`/${tenantSlug || 'login'}/login`} replace />;
  }

  const basePath = `/${tenantSlug}/admin`;

  const navItems = [
    { name: "Dashboard", path: `${basePath}/dashboard`, icon: CodeSquare },
    { name: "Calendar", path: `${basePath}/calendar`, icon: Calendar },
    { name: "Appointments", path: `${basePath}/bookings`, icon: List },
    { name: "Customers", path: `${basePath}/customers`, icon: UserCircle },
    { name: "Services", path: `${basePath}/services`, icon: Scissors },
    { name: "Staff", path: `${basePath}/staff`, icon: Users },
    { name: "Messages", path: `${basePath}/messages`, icon: Bell },
    { name: "Working Hours", path: `${basePath}/working-hours`, icon: Clock },
    { name: "Promotions", path: `${basePath}/promotions`, icon: Tag },
    { name: "Settings", path: `${basePath}/settings`, icon: Settings },
  ];

  const notifications = [
    { id: 1, type: 'Appointment', title: 'New Appointment', text: 'A new customer just booked an appointment.', time: 'Few minutes ago', read: false },
    { id: 2, type: 'Update', title: 'App Update', text: 'SMS Marketing feature is now available.', time: '2 hours ago', read: false },
    { id: 3, type: 'Maintenance', title: 'System Maintenance', text: 'Scheduled for tonight 2AM - 4AM.', time: '1 day ago', read: true },
  ];

  return (
    <div className="h-screen w-full bg-[#0F0F12] text-slate-300 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111114] border-r border-[#1F1F23] flex flex-col">
        <div className="p-6 border-b border-[#1F1F23] flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg"
            style={{ backgroundColor: tenant?.themeColor || tenantSettings.brandColor, boxShadow: `0 4px 14px 0 ${tenant?.themeColor || tenantSettings.brandColor}40` }}
          >
            {tenant ? tenant.name.charAt(0).toUpperCase() : tenantSettings.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">{tenant ? tenant.name : tenantSettings.name}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded w-fit mt-1 text-center border border-emerald-500/20">Active</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 px-2">Management</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 text-sm transition-colors rounded-lg ${
                    isActive 
                      ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 font-medium" 
                      : "text-slate-400 hover:bg-[#1A1A1E]"
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
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white w-full transition-colors">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-[#0F0F12]">
        <header className="h-16 border-b border-[#1F1F23] px-8 flex items-center justify-between bg-[#111114]">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">Owner Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-[#1A1A1E] rounded-full transition-colors"
                onBlur={() => setTimeout(() => setShowNotifications(false), 200)}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#111114]"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A1E] border border-[#27272A] rounded-xl shadow-xl z-50 overflow-hidden" onMouseDown={(e) => e.preventDefault()}>
                  <div className="flex items-center justify-between p-4 border-b border-[#27272A]">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Mark all as read</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b border-[#27272A] last:border-b-0 hover:bg-[#27272A] transition-colors cursor-pointer ${!n.read ? 'bg-[#111114]/50' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                            n.type === 'Appointment' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            n.type === 'Update' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          }`}>
                            {n.type}
                          </span>
                          <span className="text-xs text-slate-500">{n.time}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-2">{n.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-[#27272A] text-center">
                    <button className="text-sm text-blue-400 hover:text-blue-300 font-medium w-full">View all notifications</button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Online</div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 text-slate-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
