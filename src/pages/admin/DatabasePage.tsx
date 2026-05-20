import { Database, Download, UploadCloud, RefreshCw, TriangleAlert } from "lucide-react";

export function DatabasePage() {
  const stats = [
    { label: "TENANTS", value: "2" },
    { label: "BOOKINGS", value: "10" },
    { label: "CUSTOMERS", value: "24" },
    { label: "SERVICES", value: "9" },
    { label: "STAFF", value: "6" },
    { label: "COUPONS", value: "1" },
    { label: "REWARDS", value: "10" },
    { label: "CONFIG", value: "1" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status & Stats */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="bg-[#151518] rounded-xl border border-[#1F1F23] overflow-hidden flex-1">
            <div className="p-5 border-b border-[#1F1F23] bg-[#1A1A1E] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Database Connection</h2>
              </div>
              <button className="text-[11px] text-indigo-400 font-semibold hover:underline uppercase flex items-center gap-1">
                <RefreshCw size={12} /> Sync
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-[11px] text-slate-500 mb-6 italic">
                MySQL Database is currently Active and automatically replicated across nodes.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(stat => (
                  <div key={stat.label} className="bg-[#0A0A0C] border border-[#1F1F23] rounded-lg p-4">
                    <div className="text-[10px] font-bold text-slate-500 mb-1 tracking-widest uppercase">{stat.label}</div>
                    <div className="text-2xl font-mono text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-[#151518] rounded-xl border border-[#1F1F23] p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="text-indigo-400" size={16} />
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Database Utility</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="p-4 bg-[#0A0A0C] border border-[#1F1F23] rounded-lg text-xs font-semibold text-slate-300 hover:bg-[#1A1A1E] hover:text-white transition-all flex flex-col items-center gap-3">
                <Download className="text-indigo-400" size={20} />
                <span className="uppercase tracking-widest text-[10px]">Export JSON</span>
              </button>
              <button className="p-4 bg-[#0A0A0C] border border-[#1F1F23] rounded-lg text-xs font-semibold text-slate-300 hover:bg-[#1A1A1E] hover:text-white transition-all flex flex-col items-center gap-3">
                <UploadCloud className="text-emerald-400" size={20} />
                <span className="uppercase tracking-widest text-[10px]">Restore DB</span>
              </button>
            </div>

            <div className="p-4 bg-rose-500/5 rounded-lg border border-rose-500/10">
              <div className="flex gap-2 items-center mb-1 text-rose-400">
                <TriangleAlert size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Danger Zone</span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-relaxed italic">
                Restoring data will irreversibly overwrite all tenant records. Backup prior to restore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
