import React, { useState } from "react";
import { useAppContext, SalonWorkHours, SalonHoliday, StaffTimeOff } from "../../context/AppContext";
import { Clock, Calendar as CalendarIcon, Users, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";

export function OwnerWorkingHoursPage() {
  const { 
    staff, 
    salonWorkHours, 
    updateSalonWorkHours, 
    salonHolidays, 
    addSalonHoliday, 
    deleteSalonHoliday,
    staffTimeOffs,
    addStaffTimeOff,
    deleteStaffTimeOff,
    currentUser
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'weekly' | 'holidays' | 'staff'>('weekly');
  const [showSuccess, setShowSuccess] = useState(false);

  // Weekly Hours State
  const [localWorkHours, setLocalWorkHours] = useState<SalonWorkHours>(salonWorkHours);

  // Holiday State
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  // Staff Time Off State
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id?.toString() || "");
  const [newTimeOffDate, setNewTimeOffDate] = useState("");
  const [newTimeOffReason, setNewTimeOffReason] = useState("");

  const handleSaveWeekly = () => {
    updateSalonWorkHours(localWorkHours);
    triggerSuccess();
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate) return;
    addSalonHoliday({
      tenantId: currentUser?.tenantId || "",
      date: newHolidayDate,
      name: newHolidayName || "Holiday"
    });
    setNewHolidayDate("");
    setNewHolidayName("");
  };

  const handleAddStaffTimeOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeOffDate || !selectedStaffId) return;
    addStaffTimeOff({
      tenantId: currentUser?.tenantId || "",
      staffId: selectedStaffId,
      date: newTimeOffDate,
      reason: newTimeOffReason
    });
    setNewTimeOffDate("");
    setNewTimeOffReason("");
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const days = [
    { id: 'mon', label: 'Monday' },
    { id: 'tue', label: 'Tuesday' },
    { id: 'wed', label: 'Wednesday' },
    { id: 'thu', label: 'Thursday' },
    { id: 'fri', label: 'Friday' },
    { id: 'sat', label: 'Saturday' },
    { id: 'sun', label: 'Sunday' },
  ];

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Working Hours</h1>
          <p className="text-slate-400 mt-1">Manage weekly schedule, holidays, and staff time off.</p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold">Changes saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#151518] border border-[#1F1F23] rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'weekly' ? 'bg-[#1F1F23] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Clock size={16} /> Weekly Hours
        </button>
        <button 
          onClick={() => setActiveTab('holidays')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'holidays' ? 'bg-[#1F1F23] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <CalendarIcon size={16} /> Salon Holidays
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-[#1F1F23] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Users size={16} /> Staff Time Off
        </button>
      </div>

      <div className="bg-[#151518] border border-[#1F1F23] rounded-3xl overflow-hidden shadow-2xl">
        {/* Weekly Hours Tab */}
        {activeTab === 'weekly' && (
          <div className="p-8 space-y-8">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Clock size={18} />
                </div>
                <h2 className="text-xl font-bold text-white">Regular Weekly Schedule</h2>
             </div>

             <div className="space-y-4">
                {days.map((day) => {
                  const schedule = localWorkHours[day.id as keyof SalonWorkHours];
                  return (
                    <div key={day.id} className="group flex items-center justify-between p-4 bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={schedule.isOpen}
                            onChange={(e) => setLocalWorkHours({
                              ...localWorkHours,
                              [day.id]: { ...schedule, isOpen: e.target.checked }
                            })}
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <span className={`text-sm font-bold tracking-wide w-24 ${schedule.isOpen ? 'text-white' : 'text-slate-600'}`}>{day.label}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        {schedule.isOpen ? (
                          <>
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={schedule.openTime}
                                onChange={(e) => setLocalWorkHours({
                                  ...localWorkHours,
                                  [day.id]: { ...schedule, openTime: e.target.value }
                                })}
                                className="w-24 bg-[#151518] border border-[#1F1F23] rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none text-center"
                              />
                              <span className="text-slate-600">—</span>
                              <input 
                                type="text" 
                                value={schedule.closeTime}
                                onChange={(e) => setLocalWorkHours({
                                  ...localWorkHours,
                                  [day.id]: { ...schedule, closeTime: e.target.value }
                                })}
                                className="w-24 bg-[#151518] border border-[#1F1F23] rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none text-center"
                              />
                            </div>
                            <Clock size={14} className="text-slate-600" />
                          </>
                        ) : (
                          <span className="text-xs font-bold text-rose-500/50 uppercase tracking-widest px-4">Closed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
             </div>

             <div className="pt-6 border-t border-[#1F1F23] flex justify-end">
                <button 
                  onClick={handleSaveWeekly}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Save size={18} /> Save Schedule
                </button>
             </div>
          </div>
        )}

        {/* Salon Holidays Tab */}
        {activeTab === 'holidays' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <CalendarIcon size={18} />
                </div>
                <h2 className="text-xl font-bold text-white">Salon Holidays (Entire Salon Closed)</h2>
            </div>

            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Holiday Date</label>
                <input 
                  type="date" 
                  value={newHolidayDate}
                  onChange={e => setNewHolidayDate(e.target.value)}
                  className="w-full bg-[#151518] border border-[#1F1F23] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Holiday Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Christmas Day"
                  value={newHolidayName}
                  onChange={e => setNewHolidayName(e.target.value)}
                  className="w-full bg-[#151518] border border-[#1F1F23] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-[#1F1F23] hover:bg-[#27272A] border border-[#27272A] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <Plus size={18} /> Add Holiday
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {salonHolidays.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic border border-dashed border-[#1F1F23] rounded-2xl">
                  No holidays configured yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {salonHolidays.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-4 bg-[#0A0A0C] border border-[#1F1F23] rounded-xl group hover:border-rose-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                          <CalendarIcon size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{h.name}</div>
                          <div className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString('en-US', { dateStyle: 'full' })}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteSalonHoliday(h.id)}
                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#1F1F23] flex justify-end">
                <button 
                  onClick={triggerSuccess}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Save Holidays
                </button>
            </div>
          </div>
        )}

        {/* Staff Time Off Tab */}
        {activeTab === 'staff' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Users size={18} />
                </div>
                <h2 className="text-xl font-bold text-white">Staff Specific Time Off</h2>
            </div>

            <form onSubmit={handleAddStaffTimeOff} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Staff Member</label>
                <select 
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full bg-[#151518] border border-[#1F1F23] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Time Off Date</label>
                <input 
                  type="date" 
                  value={newTimeOffDate}
                  onChange={e => setNewTimeOffDate(e.target.value)}
                  className="w-full bg-[#151518] border border-[#1F1F23] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Reason</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vacation"
                  value={newTimeOffReason}
                  onChange={e => setNewTimeOffReason(e.target.value)}
                  className="w-full bg-[#151518] border border-[#1F1F23] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-[#1F1F23] hover:bg-[#27272A] border border-[#27272A] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <Plus size={18} /> Add Time Off
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {staffTimeOffs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic border border-dashed border-[#1F1F23] rounded-2xl">
                  No specific time off configured for this staff.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffTimeOffs.map(t => {
                    const staffMember = staff.find(s => s.id.toString() === t.staffId.toString());
                    return (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-[#0A0A0C] border border-[#1F1F23] rounded-xl group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                            {staffMember?.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{staffMember?.name || 'Unknown Staff'} — {t.reason || 'Time Off'}</div>
                            <div className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('en-US', { dateStyle: 'full' })}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteStaffTimeOff(t.id)}
                          className="p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#1F1F23] flex justify-end">
                <button 
                  onClick={triggerSuccess}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Save Staff Time Off
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
