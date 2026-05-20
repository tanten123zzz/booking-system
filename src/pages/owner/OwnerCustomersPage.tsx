import { useState, useEffect } from "react";
import { useAppContext, Customer } from "../../context/AppContext";
import { Plus, Search, RefreshCw, Star } from "lucide-react";
import { useSearchParams } from "react-router";

export function OwnerCustomersPage() {
  const { customers, addCustomer, updateCustomer, refreshCustomers, currentUser } = useAppContext();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (querySearch) {
      setSearchTerm(querySearch);
    }
  }, [querySearch]);
  
  const filteredCustomers = customers?.filter(c => 
    c?.tenantId === currentUser?.tenantId &&
    ((c?.fullName || c?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c?.phone || "").includes(searchTerm) ||
    (c?.id || "").includes(searchTerm))
  );
  
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", isVip: false
  });

  const handleEditInit = (customer: Customer) => {
    setFormData({ name: customer.name, phone: customer.phone, email: customer.email, isVip: customer.isVip });
    setEditingId(customer.id);
    setIsAdding(false);
  };

  const initAddModal = () => {
    setFormData({ name: "", phone: "", email: "", isVip: false });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = () => {
    if (editingId) {
      updateCustomer(editingId, formData);
      setEditingId(null);
    } else if (isAdding) {
      if (formData.name) {
        addCustomer({ ...formData, tenantId: currentUser?.tenantId || 'unknown' });
      }
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
  };



  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-tight">Customers Directory</h1>
        <p className="text-sm text-slate-400 mt-1">Manage customers, view their history and spending.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search customers..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#151518] border border-[#1F1F23] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={() => refreshCustomers()}
              className="px-4 py-2.5 bg-[#151518] border border-[#1F1F23] hover:bg-[#1A1A1E] text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={14} /> Sync
            </button>
           <button onClick={initAddModal} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors">
             <Plus size={16} /> Add
           </button>
        </div>
      </div>

      <div className="bg-[#151518] rounded-xl border border-[#1F1F23] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0A0A0C] border-b border-[#1F1F23] text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-700 bg-slate-800" /></th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Tier & Points</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Visits</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {(isAdding || editingId) && (
                <tr className="bg-[#1A1A1E] shadow-inner">
                  <td colSpan={7} className="p-6">
                    <div className="font-bold text-white mb-4 text-base">{isAdding ? 'Add New Customer' : 'Edit Customer'}</div>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Full Name *</label>
                        <input 
                          type="text" 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Phone Number</label>
                        <input 
                          type="text" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Email</label>
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                          className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                        />
                      </div>
                      <div className="flex items-center gap-2 h-[42px] px-2 text-sm text-slate-300">
                        <input 
                          type="checkbox" 
                          id="vip_check" 
                          checked={formData.isVip} 
                          onChange={e => setFormData({...formData, isVip: e.target.checked})} 
                          className="w-4 h-4 rounded border-[#1F1F23] bg-[#0A0A0C] accent-indigo-500" 
                        />
                        <label htmlFor="vip_check" className="flex items-center gap-1 cursor-pointer">
                          <Star size={14} className={formData.isVip ? "text-[#D4AF37] fill-[#D4AF37]" : "text-slate-500"} /> 
                          Mark as VIP
                        </label>
                      </div>
                      <div className="flex items-center gap-2 h-[42px] ml-auto">
                         <button onClick={handleCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
                         <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors">Save Customer</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {filteredCustomers.map((customer) => (
                editingId === customer.id ? null : (
                  <tr key={customer.id} className="hover:bg-[#1A1A1E] transition-colors group">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-700 bg-slate-800" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase">
                          {(customer?.fullName || customer?.name || "C").charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{customer?.fullName || customer?.name || "Unnamed"}</span>
                            {customer?.isVip && <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: #{customer?.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-medium">{customer?.tier || "Thường"}</div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{customer?.points || 0} pts</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-mono text-xs">{customer?.phone || "N/A"}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{customer?.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0A0A0C] border border-[#1F1F23] font-mono text-xs text-white">
                         {customer?.visits || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {customer?.lastVisit && customer.lastVisit !== "Never" 
                        ? new Date(customer.lastVisit).toLocaleDateString() 
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleEditInit(customer)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                         Edit
                       </button>
                    </td>
                  </tr>
                )
              ))}
              {filteredCustomers.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
