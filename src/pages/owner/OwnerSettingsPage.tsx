import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { Settings, Image as ImageIcon } from "lucide-react";

export function OwnerSettingsPage() {
  const { tenants, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState("General");
  const [isSaving, setIsSaving] = useState(false);

  // Tìm thông tin tenant hiện tại từ danh sách tenants
  const currentTenant = tenants.find(t => t.id === currentUser?.tenantId);
  
  const [settings, setSettings] = useState<any>({
    name: currentTenant?.name || "",
    brandColor: currentTenant?.brandColor || "#724677",
    address: currentTenant?.location || "123 Beauty St, Los Angeles, CA",
    phone: currentTenant?.phone || "(555) 123-4567",
    logoUrl: "",
    googleMapReviewLink: "https://share.google/6wztEGSLM/03G8ZYI2",
    timeSlotInterval: "30",
    minimumLeadTime: "60"
  });

  // Cập nhật settings khi currentTenant thay đổi (khi load xong dữ liệu từ API)
  React.useEffect(() => {
    if (currentTenant) {
      setSettings(prev => ({
        ...prev,
        name: currentTenant.name,
        brandColor: currentTenant.brandColor,
        address: currentTenant.location || prev.address,
        phone: currentTenant.phone || prev.phone
      }));
    }
  }, [currentTenant]);

  const handleSave = async () => {
    if (!currentUser?.tenantId) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tenants/${currentUser.tenantId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          name: settings.name,
          brandColor: settings.brandColor,
          location: settings.address,
          phone: settings.phone
        })
      });

      if (res.ok) {
        alert("Đã lưu cài đặt thành công!");
        // Có thể cần fetch lại tenants ở AppContext ở đây để đồng bộ toàn cục
        window.location.reload(); // Cách đơn giản nhất để sync lại data
      } else {
        alert("Lỗi khi lưu cài đặt.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi hệ thống khi lưu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#1F1F23] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Salon Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure your business details, booking rules, and chatbot.</p>
        </div>
        
        <div className="flex space-x-1 bg-[#151518] border border-[#1F1F23] rounded-lg p-1">
          {["General", "Payments", "Social", "Chatbot"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-[#1A1A1E] text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "General" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* General Information Card */}
          <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#1F1F23] flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">General Information</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">Salon Name</label>
                  <input 
                    type="text" 
                    value={settings.name}
                    onChange={e => setSettings({...settings, name: e.target.value})}
                    className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">Brand Color</label>
                  <div className="flex items-center gap-3 bg-[#0A0A0C] border border-[#1F1F23] rounded-lg p-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all duration-200">
                    <input 
                      type="color" 
                      value={settings.brandColor}
                      onChange={e => setSettings({...settings, brandColor: e.target.value})}
                      className="w-8 h-8 rounded shrink-0 cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={settings.brandColor}
                      onChange={e => setSettings({...settings, brandColor: e.target.value})}
                      className="bg-transparent border-none p-0 text-sm font-mono text-white outline-none w-full uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2">Business Logo</label>
                 <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#0A0A0C] border border-[#1F1F23] flex items-center justify-center shrink-0">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full rounded-lg object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white" style={{ backgroundColor: settings.brandColor, borderRadius: '0.5rem' }}>
                        {settings.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-[#1A1A1E] hover:bg-[#25252B] border border-[#2A2A30] text-indigo-400 font-bold text-sm rounded-lg transition-colors">
                      Choose File
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const reader = new FileReader();
                           reader.onloadend = () => setSettings({...settings, logoUrl: reader.result as string});
                           reader.readAsDataURL(file);
                         }
                      }} />
                    </label>
                    <span className="text-sm text-slate-500">No file chosen</span>
                  </div>
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">Address / Location</label>
                  <input 
                    type="text" 
                    value={settings.address}
                    onChange={e => setSettings({...settings, address: e.target.value})}
                    className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">Business Phone</label>
                  <input 
                    type="text" 
                    value={settings.phone}
                    onChange={e => setSettings({...settings, phone: e.target.value})}
                    className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2">Google Map Review Link</label>
                <input 
                  type="url" 
                  value={settings.googleMapReviewLink}
                  onChange={e => setSettings({...settings, googleMapReviewLink: e.target.value})}
                  className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                />
                <p className="text-[11px] text-slate-500 mt-2 italic font-medium">This link will be used in the step 7 booking confirmation page for customer reviews.</p>
              </div>
            </div>
          </div>

          {/* Booking Rules Card */}
          <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#1F1F23] flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Booking Rules</h2>
            </div>
            <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">Time Slot Interval</label>
                  <select 
                    value={settings.timeSlotInterval}
                    onChange={e => setSettings({...settings, timeSlotInterval: e.target.value})}
                    className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  >
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every 1 hour</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">Distance between available booking times.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">Minimum Lead Time</label>
                  <select 
                    value={settings.minimumLeadTime}
                    onChange={e => setSettings({...settings, minimumLeadTime: e.target.value})}
                    className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                  >
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="120">2 hours before</option>
                    <option value="1440">24 hours before</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">How far in advance customers must book.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : <><Settings className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
