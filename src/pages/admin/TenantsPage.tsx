import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAppContext, Tenant } from "../../context/AppContext";
import { Plus, Link2, Pencil, Info, X, Check, Save, Download } from "lucide-react";

export function TenantsPage() {
  const { logout, tenants: globalTenants, updateTenant: updateGlobalTenant, addTenant: addGlobalTenant } = useAppContext();
  const [realTenants, setRealTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [infoTenant, setInfoTenant] = useState<any | null>(null);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<any>({
    name: "",
    slug: "",
    adminEmail: "",
    password: "TempPass123!",
    createdDate: new Date().toLocaleDateString(),
    status: 'ACTIVE',
    brandColor: "#724677",
    location: "",
    phone: "",
    logoUrl: "",
    paymentMethods: ['Pay in Store']
  });

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Parse paymentMethods từ JSON string
        const parsedData = data.map((t: any) => ({
          ...t,
          location: t.location || "",
          phone: t.phone || "",
          paymentMethods: typeof t.paymentMethods === 'string' 
            ? JSON.parse(t.paymentMethods) 
            : (Array.isArray(t.paymentMethods) ? t.paymentMethods : ['Pay in Store'])
        }));
        setRealTenants(parsedData);
      }
    } catch (err) {
      console.error("Fetch tenants error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    // Sanitize slug and ensure all fields are present
    const sanitizedData = {
      ...formData,
      slug: formData.slug.replace(/^\/+/, '').replace(/\/+$/, '').trim().toLowerCase(),
      status: formData.status || 'ACTIVE',
      location: formData.location || "",
      phone: formData.phone || "",
      logoUrl: formData.logoUrl || "",
      brandColor: formData.brandColor || "#724677"
    };

    console.log("[Frontend] Sending Data:", sanitizedData);

    try {
      const url = editingId ? `/api/tenants/${editingId}` : '/api/tenants';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save tenant');
      }

       if (editingId) {
        updateGlobalTenant(editingId, data);
      } else {
        addGlobalTenant(data);
      }

      await fetchTenants();
      setIsAdding(false);
      setEditingId(null);
      resetForm();
      alert(editingId ? "Cập nhật salon thành công!" : "Đã tạo salon mới thành công!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (name: string) => {
    // Chuyển đổi tên tiệm thành slug: viết thường, bỏ dấu, thay khoảng trắng bằng gạch ngang
    const slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD') // Tách dấu
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
      .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
      .replace(/[\s_-]+/g, '-') // Thay khoảng trắng bằng -
      .replace(/^-+|-+$/g, ''); // Xóa gạch ngang ở đầu/cuối
    
    setFormData(prev => ({ 
      ...prev, 
      name, 
      slug: editingId ? prev.slug : slug 
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      adminEmail: "",
      createdDate: new Date().toLocaleDateString(),
      status: 'Active',
      brandColor: "#724677",
      location: "",
      phone: "",
      logoUrl: "",
      paymentMethods: ['Pay in Store']
    });
  };

  const editTenant = (t: Tenant) => {
    setFormData({
      ...t,
      // Đảm bảo các trường luôn có giá trị để không bị lỗi crash
      location: t.location || "",
      phone: t.phone || "",
      paymentMethods: Array.isArray(t.paymentMethods) ? t.paymentMethods : ['Pay in Store'],
      password: "••••••••" // Hiển thị placeholder cho mật khẩu đã có
    });
    setEditingId(t.id);
    setIsAdding(true);
    setError(""); // Xóa lỗi cũ nếu có
  };

  const togglePaymentMethod = (method: string) => {
    setFormData(prev => {
      const exists = prev.paymentMethods.includes(method);
      if (exists) {
        return { ...prev, paymentMethods: prev.paymentMethods.filter(m => m !== method) };
      }
      return { ...prev, paymentMethods: [...prev.paymentMethods, method] };
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 text-white">
      <div className="flex justify-between items-center bg-[#151518] p-6 rounded-2xl border border-[#1F1F23]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage salons, generate booking links, and handle subscriptions.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAdding(!isAdding); setEditingId(null); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
        >
          {isAdding && !editingId ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding && !editingId ? "Cancel" : "New Tenant"}
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-[#1F1F23]">
            <h2 className="text-lg font-bold">{editingId ? "Edit Tenant (Salon)" : "Create New Tenant (Salon)"}</h2>
          </div>
          <form className="p-6 space-y-6" onSubmit={handleCreate}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium animate-in shake duration-300">
                Lỗi: {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Salon Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g., Star Nails"
                  className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., star-nails"
                  className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Admin Email *</label>
                <input
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="owner@starnails.com"
                  className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Admin Password *</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Theme Color (Hex)</label>
                <div className="flex bg-[#0A0A0C] border border-[#1F1F23] rounded-lg focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden">
                  <input
                    type="color"
                    value={formData.brandColor}
                    onChange={e => setFormData({ ...formData, brandColor: e.target.value })}
                    className="w-10 h-10 p-0 border-0 bg-transparent shrink-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brandColor}
                    onChange={e => setFormData({ ...formData, brandColor: e.target.value })}
                    className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>
               <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2">Logo</label>
                  <div className="flex items-center gap-3 bg-[#0A0A0C] border border-[#1F1F23] rounded-lg p-1.5 focus-within:border-indigo-500">
                     <label className="cursor-pointer px-4 py-1.5 bg-[#1A1A1E] hover:bg-[#25252B] border border-[#2A2A30] text-white font-medium text-xs rounded-md transition-colors shrink-0">
                      Choose File
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const reader = new FileReader();
                           reader.onload = (event) => {
                             const img = new Image();
                             img.onload = () => {
                               const canvas = document.createElement('canvas');
                               const MAX_SIZE = 300;
                               let width = img.width;
                               let height = img.height;
                               
                               if (width > height && width > MAX_SIZE) {
                                 height *= MAX_SIZE / width;
                                 width = MAX_SIZE;
                               } else if (height > MAX_SIZE) {
                                 width *= MAX_SIZE / height;
                                 height = MAX_SIZE;
                               }
                               
                               canvas.width = width;
                               canvas.height = height;
                               const ctx = canvas.getContext('2d');
                               ctx?.drawImage(img, 0, 0, width, height);
                               
                               // Nén logo thành JPEG chất lượng 80% (rất nhẹ, thường < 50KB)
                               const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                               setFormData({ ...formData, logoUrl: compressedBase64 });
                             };
                             img.src = event.target?.result as string;
                           };
                           reader.readAsDataURL(file);
                         }
                      }} />
                    </label>
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} className="w-8 h-8 rounded object-cover border border-[#1F1F23]" alt="Preview" />
                    ) : (
                      <span className="text-xs text-slate-500 truncate">No file chosen</span>
                    )}
                  </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., 123 Beauty Ave"
                  className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., (555) 123-4567"
                  className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                />
              </div>

               <div className="lg:col-span-1 bg-[#1A1A1E]/50 border border-[#1F1F23] rounded-xl p-4">
                 <div className="flex items-center gap-2 mb-3">
                   <Info className="w-4 h-4 text-indigo-400" />
                   <h3 className="text-xs font-bold text-indigo-400 tracking-wider">IT SYSTEM ACCOUNT</h3>
                 </div>
                 <div className="space-y-4">
                   <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Username (Default)</label>
                      <input type="text" disabled defaultValue={`it${formData.slug.replace(/[^a-zA-Z0-9]/g, '')}`} className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded text-xs px-2 py-1.5 text-slate-400 cursor-not-allowed" />
                   </div>
                   <div>
                     <div className="flex justify-between items-end mb-1">
                        <label className="block text-[10px] text-slate-400">Generated IT Password</label>
                        <button type="button" className="text-[10px] text-indigo-400 hover:text-indigo-300">Regenerate</button>
                     </div>
                     <input type="text" readOnly defaultValue="KMTYUXXWZN!" className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded text-xs px-2 py-1.5 text-white" />
                   </div>
                 </div>
               </div>
            </div>

            <div className="pt-4">
              <label className="block text-xs font-bold text-slate-400 mb-3">Accepted Payment Methods</label>
              <div className="flex flex-wrap gap-4">
                {['Pay in Store', 'Credit Card', 'PayPal'].map(method => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#1F1F23] bg-[#0A0A0C] text-indigo-600 focus:ring-indigo-600 focus:ring-offset-[#151518]"
                      checked={formData.paymentMethods.includes(method)}
                      onChange={() => togglePaymentMethod(method)}
                    />
                    <span className="text-sm text-slate-300">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#1F1F23]">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-6 py-2.5 bg-transparent hover:bg-[#1A1A1E] text-slate-300 rounded-lg text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <span className="animate-spin">⏳</span> : (editingId ? <Pencil className="w-4 h-4"/> : <Save className="w-4 h-4"/>)}
                {isSubmitting ? "Processing..." : (editingId ? "Save Changes" : "Generate & Create")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0A0A0C] border-b border-[#1F1F23] text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Tenant Name</th>
                <th className="px-6 py-4">URL & Booking Link</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-medium animate-pulse">Syncing with database...</td></tr>
              ) : realTenants.map(t => (
                <tr key={t.id} className="hover:bg-[#1A1A1E] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                  <td className="px-6 py-4 space-y-1">
                    <Link to={`/${t.slug}`} className="flex items-center gap-1.5 text-indigo-400 group cursor-pointer inline-flex w-full">
                      <Link2 className="w-3.5 h-3.5" /> 
                      <span className="font-bold hover:underline">/{t.slug}</span>
                      <span className="text-[10px] text-slate-500 ml-1 font-medium">(Customer)</span>
                    </Link>
                    <Link to={`/${t.slug}/admin`} className="flex items-center gap-1.5 text-fuchsia-400 group cursor-pointer inline-flex w-full">
                      <Link2 className="w-3.5 h-3.5" /> 
                      <span className="font-bold hover:underline">/{t.slug}/admin</span>
                      <span className="text-[10px] text-slate-500 ml-1 font-medium">(Admin)</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">{t.createdDate}</td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => editTenant(t)} className="p-1.5 text-slate-400 hover:text-white bg-[#0A0A0C] border border-[#1F1F23] rounded transition-colors" title="Edit Tenant">
                         <Pencil className="w-4 h-4" />
                       </button>
                       <button onClick={() => setInfoTenant(t)} className="p-1.5 text-slate-400 hover:text-indigo-400 bg-[#0A0A0C] border border-[#1F1F23] rounded transition-colors" title="View Info">
                         <Info className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && realTenants.length === 0 && (
                 <tr><td colSpan={5} className="p-8 text-center text-slate-500">No tenants created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {infoTenant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151518] border border-[#1F1F23] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#1F1F23] flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-3">
                     <h2 className="text-xl font-bold text-white">{infoTenant.name}</h2>
                     <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                       {infoTenant.status}
                     </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">/{infoTenant.slug} • Created: {infoTenant.createdDate}</div>
               </div>
               <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                   <Download className="w-3.5 h-3.5" /> Export Report
                 </button>
                 <button onClick={() => {setInfoTenant(null); setIsEditingConfig(false);}} className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors">
                   <X className="w-5 h-5"/>
                 </button>
               </div>
            </div>

            <div className="p-6 bg-[#0A0A0C] space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Revenue", value: "$0", color: "text-emerald-400", icon: "$" },
                  { label: "Bookings", value: "0", color: "text-white", icon: "B" },
                  { label: "Staff", value: "0", color: "text-white", icon: "S" },
                  { label: "Coupons", value: "0", color: "text-rose-400", icon: "C" },
                ].map((stat, i) => (
                   <div key={i} className="bg-[#151518] border border-[#1F1F23] rounded-xl p-4">
                     <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                       <span className={`w-4 h-4 rounded-full flex items-center justify-center bg-[#1A1A1E] ${stat.color} text-[8px]`}>{stat.icon}</span>
                       {stat.label}
                     </div>
                     <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                   </div>
                ))}
              </div>

              {isEditingConfig ? (
                <div className="bg-[#151518] border border-[#1F1F23] rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                  <div className="px-6 py-4 border-b border-[#1F1F23] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white tracking-tight">Edit Configuration</h3>
                    </div>
                    <button onClick={() => setIsEditingConfig(false)} className="text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6 overflow-y-auto max-h-[30vh] custom-scrollbar">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Salon Name</label>
                        <input type="text" defaultValue={infoTenant.name} className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Admin Email</label>
                        <input type="email" defaultValue={infoTenant.adminEmail} className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Admin Password</label>
                        <input type="text" defaultValue="TempPass123!" className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200" />
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-xs font-bold text-slate-400">IT Account Password ({`it${infoTenant.slug.replace(/[^a-zA-Z0-9]/g, '')}`})</label>
                          <button className="text-xs text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Generate New</button>
                        </div>
                        <input type="text" defaultValue="6NHBXYLARM!" className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-[#1F1F23]">
                      <button onClick={() => setIsEditingConfig(false)} className="px-6 py-2.5 bg-transparent hover:bg-[#1A1A1E] text-slate-300 rounded-lg text-sm font-bold transition-all">Cancel</button>
                      <button onClick={() => setIsEditingConfig(false)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"><Save className="w-4 h-4"/> Save Changes</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tenant Configuration</h3>
                    <div className="bg-[#151518] border border-[#1F1F23] rounded-xl p-5 space-y-4">
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-medium">Admin Email</div>
                         <div className="text-sm font-medium text-white">{infoTenant.adminEmail}</div>
                       </div>
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-medium">Location</div>
                         <div className="text-sm font-medium text-white">{infoTenant.location || "N/A"}</div>
                       </div>
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-medium">Phone</div>
                         <div className="text-sm font-medium text-white">{infoTenant.phone || "N/A"}</div>
                       </div>
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-medium mb-1.5">Accepted Payments</div>
                         <div className="flex flex-wrap gap-2">
                           {infoTenant.paymentMethods.map(m => (
                             <span key={m} className="bg-[#1A1A1E] border border-[#2A2A30] text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium">
                               {m}
                             </span>
                           ))}
                         </div>
                       </div>
                       <div className="pt-2">
                         <button onClick={() => setIsEditingConfig(true)} className="w-full bg-[#1A1A1E] hover:bg-[#25252B] border border-[#2A2A30] text-white text-xs font-bold py-2 rounded-lg transition-colors">
                           Edit Configuration
                         </button>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top Performing Services</h3>
                    <div className="bg-[#151518] border border-[#1F1F23] rounded-xl p-8 flex items-center justify-center h-[calc(100%-24px)] text-slate-500 text-sm font-medium">
                       No services created yet.
                    </div>
                 </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
