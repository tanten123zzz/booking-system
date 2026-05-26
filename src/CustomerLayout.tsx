import { Outlet, useParams } from "react-router";
import { PortalSwitcher } from "./components/PortalSwitcher";
import { useAppContext } from "./context/AppContext";

export function CustomerLayout() {
  const { tenantSettings, tenants } = useAppContext();
  const { tenantSlug } = useParams();
  
  const tenant = tenantSlug ? tenants.find(t => t.slug === tenantSlug) : null;
  const brandColor = tenant?.themeColor || tenantSettings.brandColor;
  const tenantName = tenant?.name || tenantSettings.name;

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex items-center justify-center p-4">
      {/* Phone-like Container Wrapper */}
      <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-2xl overflow-hidden relative min-h-[800px] flex flex-col border-[6px] border-slate-800">
        
        {/* Dynamic Theme Bar Placeholder */}
        <div className="absolute top-0 w-full h-1.5" style={{ backgroundColor: brandColor }}></div>
        
        {/* Dynamic Sleek Header */}
        <header className="px-8 pt-10 pb-4">
          <div className="flex justify-between items-center">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-serif text-2xl italic shadow-lg"
              style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}40` }}
            >
              {tenantName.charAt(0)}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{tenantName}</span>
              <div className="w-8 h-0.5 mt-1" style={{ backgroundColor: brandColor }}></div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Outlet */}
        <main className="flex-1 px-8 pb-8 flex flex-col relative z-10 w-full">
          <Outlet />
        </main>

        {/* Notch Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-b-xl z-50"></div>
        
        {/* Bottom Corner Subtle Branding */}
        <div className="absolute bottom-10 -right-8 rotate-90 text-[10px] text-slate-300 font-bold tracking-[0.2em] uppercase pointer-events-none">
          Powered by NailSaaS
        </div>
      </div>
    </div>
  );
}
