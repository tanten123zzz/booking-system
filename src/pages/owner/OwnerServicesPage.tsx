import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { Edit2, Trash2, Plus, Save, X } from "lucide-react";

export function OwnerServicesPage() {
  const { services, addService, updateService, deleteService, currentUser } = useAppContext();
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const tenantServices = services.filter(s => s.tenantId === currentUser?.tenantId);

  const [formData, setFormData] = useState({
    name: "", subtitle: "", duration: 30, price: 0
  });

  const handleEditInit = (service: any) => {
    setFormData({ name: service.name, subtitle: service.subtitle, duration: service.duration, price: service.price });
    setIsEditing(service.id);
  };

  const handleSave = () => {
    if (isEditing) {
      updateService(isEditing, {
        ...formData,
        tenantId: currentUser?.tenantId || 'unknown'
      });
      setIsEditing(null);
    } else {
      addService({
        ...formData,
        tenantId: currentUser?.tenantId || 'unknown'
      });
      setIsAdding(false);
    }
    setFormData({ name: "", subtitle: "", duration: 30, price: 0 });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-tight">Services</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your salon's service menu and pricing.</p>
        </div>
        {!isAdding && (
          <button onClick={() => { setIsAdding(true); setFormData({ name: "", subtitle: "", duration: 30, price: 0 }); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={16} /> Add Service
          </button>
        )}
      </div>

      <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl">
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0A0A0C] border-b border-[#1F1F23] text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Service Name & Subtitle</th>
                <th className="px-6 py-4">Duration (min)</th>
                <th className="px-6 py-4">Price ($)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {isAdding && (
                <tr className="bg-[#1A1A1E]">
                  <td className="px-6 py-3 space-y-2">
                    <input autoFocus type="text" placeholder="Service Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-sm" />
                    <input type="text" placeholder="Subtitle" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-xs text-slate-400" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-20 bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-sm" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-20 bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-sm" />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSave} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"><Save size={16} /></button>
                      <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded transition-colors"><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              )}
              {tenantServices?.map((service) => (
                isEditing === service?.id ? (
                  <tr key={service?.id} className="bg-[#1A1A1E]">
                    <td className="px-6 py-3 space-y-2">
                      <input autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-sm" />
                      <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-xs text-slate-400" />
                    </td>
                    <td className="px-6 py-3">
                      <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-20 bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-sm" />
                    </td>
                    <td className="px-6 py-3">
                      <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-20 bg-[#0A0A0C] border border-[#1F1F23] text-white rounded px-3 py-1.5 text-sm" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleSave} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"><Save size={16} /></button>
                        <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded transition-colors"><X size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={service?.id} className="hover:bg-[#1A1A1E] transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">
                      {service?.name || "Unnamed Service"}
                      <div className="text-xs text-slate-500 font-normal mt-0.5">{service?.subtitle || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {service?.duration || 0} min
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">
                      ${service?.price || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditInit(service)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteService(service?.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
