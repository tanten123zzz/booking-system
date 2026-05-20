import { Link } from "react-router";
import { Shield, Scissors, UserCircle } from "lucide-react";

export function PortalSwitcher() {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#1A1A1E] border border-[#1F1F23] rounded-xl shadow-2xl p-2 flex gap-2">
      <Link 
        to="/super-admin" 
        className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
      >
        <Shield size={14} /> Super Admin
      </Link>
      <Link 
        to="/owner/dashboard" 
        className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        <Scissors size={14} /> Owner
      </Link>
      <Link 
        to="/booking" 
        className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
      >
        <UserCircle size={14} /> Booking
      </Link>
    </div>
  );
}
