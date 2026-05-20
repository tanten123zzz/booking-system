import { useState } from "react";
import { useAppContext, Staff } from "../../context/AppContext";
import { Plus, Search, X } from "lucide-react";

const emptyWorkHours = { mon: '09:00 - 18:00', tue: '09:00 - 18:00', wed: '09:00 - 18:00', thu: '09:00 - 18:00', fri: '09:00 - 18:00', sat: 'Off', sun: 'Off' };

export function OwnerStaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff, currentUser } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "", phone: "", role: "Staff", dayOff: "None", workHours: { ...emptyWorkHours }
  });

  const handleEditClick = (member: Staff) => {
    setFormData({
      name: member.name,
      phone: member.phone,
      role: member.role,
      dayOff: member.dayOff,
      workHours: { ...member.workHours }
    });
    setEditingStaffId(member.id);
  };

  const initAddStaff = () => {
    setFormData({ name: "", phone: "", role: "Staff", dayOff: "None", workHours: { ...emptyWorkHours } });
    setIsAdding(true);
  };

  const handleSaveAdd = () => {
    if (!formData.name) return;
    addStaff({ ...formData, status: "ACTIVE", tenantId: currentUser?.tenantId || 'unknown' });
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!formData.name || !editingStaffId) return;
    updateStaff(editingStaffId, formData);
    setEditingStaffId(null);
  };

  const filteredStaff = staff.filter(s => 
    s.tenantId === currentUser?.tenantId &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStaffForm = (isModal: boolean = false) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Full Name *</label>
          <input type="text" autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Phone Number</label>
          <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Role / Title</label>
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none">
            <option value="Staff">Staff</option>
            <option value="Stylist">Stylist</option>
            <option value="Technician">Technician</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Day Off</label>
          <select value={formData.dayOff} onChange={e => setFormData({...formData, dayOff: e.target.value})} className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none">
            {['None', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-white mb-4">Weekly Work Hours</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries({ mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }).map(([key, label]) => (
            <div key={key} className="bg-[#0A0A0C] border border-[#1F1F23] rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">{label}</div>
              <input 
                type="text" 
                value={formData.workHours[key as keyof typeof formData.workHours]} 
                onChange={e => setFormData({...formData, workHours: {...formData.workHours, [key]: e.target.value}})}
                className="w-full bg-transparent border-b border-[#1F1F23] py-1 text-sm text-slate-300 focus:border-indigo-500 outline-none" 
                placeholder="09:00 - 18:00 or Off" 
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#1F1F23]">
        {isModal ? (
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to delete this staff member?')) {
                deleteStaff(editingStaffId!);
                setEditingStaffId(null);
              }
            }}
            className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-wider"
          >
            Delete Member
          </button>
        ) : <div />}
        <div className="flex items-center gap-3">
          <button onClick={() => isModal ? setEditingStaffId(null) : setIsAdding(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={isModal ? handleSaveEdit : handleSaveAdd} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors">
            {isModal ? 'Save Changes' : 'Save Member'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-8 relative">
      <div>
        <h1 className="text-2xl font-light text-white tracking-tight">Staff Management</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your team members, schedules, and performance.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search staff..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#151518] border border-[#1F1F23] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
          />
        </div>
        <button onClick={initAddStaff} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#151518] border border-[#1F1F23] rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6 border-b border-[#1F1F23] pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Add New Team Member</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>
          {renderStaffForm(false)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div key={member?.id} className="bg-[#151518] rounded-xl border border-[#1F1F23] shadow-lg flex flex-col">
            <div className="p-5 flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded bg-indigo-500/10 flex items-center justify-center text-xl font-bold text-indigo-400 uppercase shrink-0">
                {(member?.name || "S").charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white leading-tight">{member?.name || "Unknown Staff"}</h3>
                <p className="text-sm text-slate-400">{member?.role || "Staff"}</p>
                <div className="inline-block px-2 py-0.5 mt-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded">
                  {member?.status || "ACTIVE"}
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3 border-t border-[#1F1F23] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center gap-2"><div className="w-3" /> Today's Hours</span>
                <span className="text-slate-300 font-medium">Not set</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center gap-2"><div className="w-3" /> Day Off</span>
                <span className="text-slate-300 font-medium">{member?.dayOff || "None"}</span>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-[#1F1F23] mt-auto">
              <button onClick={() => handleEditClick(member)} className="w-full py-2 bg-[#0A0A0C] border border-[#1F1F23] hover:border-indigo-500/50 hover:bg-indigo-500/5 text-indigo-400 rounded-lg text-xs font-semibold transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingStaffId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151518] border border-[#1F1F23] rounded-2xl p-6 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-6 border-b border-[#1F1F23] pb-4">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-indigo-400">✎</span> Edit Staff Profile
                </h2>
                <button onClick={() => setEditingStaffId(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
             </div>
             {renderStaffForm(true)}
          </div>
        </div>
      )}
    </div>
  );
}
