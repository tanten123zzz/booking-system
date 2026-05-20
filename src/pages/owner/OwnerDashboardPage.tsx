import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { Plus, MessageSquare, X, Users as UsersIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { sendSmsPromotion } from "../../lib/actions/sms-service";

export function OwnerDashboardPage() {
  const { services, staff, currentUser, customers, luckyWheelActive } = useAppContext();
  const navigate = useNavigate();
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    if (!currentUser?.tenantId) return;

    fetch('/api/bookings', { headers: { 'x-tenant-id': currentUser?.tenantId || '', ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}) } })
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data)) setRealBookings(data); 
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });

    const sse = new EventSource(`/api/bookings/stream?tenantId=${currentUser.tenantId}`);
    
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.connected) return;
      } catch(e) {}
    };

    sse.addEventListener('new_booking', (e: any) => {
      try {
        const newBooking = JSON.parse(e.data);
        setRealBookings(prev => [newBooking, ...prev]);
      } catch (err) { console.error(err) }
    });

    sse.addEventListener('update_booking', (e: any) => {
      try {
        const updatedBooking = JSON.parse(e.data);
        setRealBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      } catch (err) { console.error(err) }
    });

    return () => sse.close();
  }, [currentUser?.tenantId]);

  const tenantBookings = realBookings
    ?.filter(b => b?.status === 'PENDING' || b?.status === 'APPROVED')
    ?.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const tenantServices = services.filter(s => s.tenantId === currentUser?.tenantId);
  const tenantStaff = staff.filter(s => s.tenantId === currentUser?.tenantId);
  const tenantCustomers = customers.filter(c => c.tenantId === currentUser?.tenantId);

  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  // Track selected customers by ID
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set(tenantCustomers.map(c => c.id))
  );

  const toggleCustomer = (id: string) => {
    const newSet = new Set(selectedCustomers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCustomers(newSet);
  };

  const handleSelectAll = () => {
    if (selectedCustomers.size === tenantCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(tenantCustomers.map(c => c.id)));
    }
  };

  // Mock revenue calculation
  const totalRevenue = realBookings?.reduce((acc, b) => {
    const service = tenantServices?.find(s => s?.id === b?.serviceId);
    return acc + (service?.price || 0);
  }, 0);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText || selectedCustomers.size === 0) return;
    
    setIsSending(true);
    
    const recipients = tenantCustomers
      .filter(c => selectedCustomers.has(c.id) && c.phone && c.phone !== 'N/A')
      .map(c => c.phone);
      
    if (recipients.length === 0) {
      setToastMsg("No valid phone numbers selected.");
      setIsSending(false);
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    try {
      console.log('Starting sms send process:', recipients, smsText);
      const result = await sendSmsPromotion(recipients, smsText);
      
      console.log('SMS send result:', result);
      
      if (result.success) {
        if (result.failedCount && result.failedCount > 0) {
           setToastMsg(`Partial Success: Sent ${result.count}. Failed: ${result.failedCount}. ${result.warning || ''}`);
        } else {
           setToastMsg(`Successfully sent ${result.count} SMS messages!`);
           setTimeout(() => {
             setShowSmsModal(false);
             setSmsText("");
           }, 1000);
        }
      } else {
        setToastMsg(`Error: ${result.error}`);
      }
    } catch (err: any) {
      console.error('handleSendSms catch:', err);
      // Wait for 1 tick to show the exact error string
      setTimeout(() => setToastMsg(`Exception caught: ${err ? err.toString() : 'Unknown'}`), 10);
    } finally {
      setIsSending(false);
      setTimeout(() => setToastMsg(""), 8000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Đang tải dữ liệu hoặc không có lịch hẹn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Main Stats & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-colors group-hover:bg-indigo-500/10"></div>
              <div className="text-[10px] font-bold text-slate-500 mb-2 tracking-widest uppercase relative z-10">Total Bookings</div>
              <div className="text-4xl font-light text-white relative z-10">{realBookings?.length || 0}</div>
            </div>
            <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-colors group-hover:bg-emerald-500/10"></div>
              <div className="text-[10px] font-bold text-slate-500 mb-2 tracking-widest uppercase relative z-10">Revenue</div>
              <div className="text-4xl font-light text-emerald-400 relative z-10">${totalRevenue || 0}</div>
            </div>
          </div>

          <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#1F1F23] bg-[#0A0A0C] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Upcoming Appointments
              </h2>
              <button onClick={() => navigate(`/${currentUser?.tenantId || 'admin'}/calendar`)} className="text-[11px] text-indigo-400 font-semibold hover:underline uppercase tracking-wider">View Calendar</button>
            </div>
            <div className="p-0">
              {tenantBookings?.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-slate-400 font-medium tracking-wide">No upcoming appointments.</div>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#0A0A0C]/50 border-b border-[#1F1F23] text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F23]">
                    {tenantBookings?.slice(0, 5).map((b, i) => {
                      if (!b) return null;
                      const service = tenantServices?.find(s => s?.id === b?.serviceId);
                      return (
                        <tr key={b?.id || i} className="hover:bg-[#1A1A1E] transition-colors group">
                          <td className="px-6 py-4 font-medium text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase">
                                {(b?.customer?.fullName || b?.customerName || "K").charAt(0)}
                              </div>
                              <div>
                                {b?.customer?.fullName || b?.customerName || "Walk-In"}
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{b?.customer?.phone || "N/A"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-300">{service?.name || "Unknown"}</span>
                            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">${service?.price || 0}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                            {b?.dateTime ? new Date(b.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded uppercase tracking-wider font-bold">
                              {b?.status || 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions */}
        <div className="space-y-6">
          <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#1F1F23] bg-[#0A0A0C]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <button 
                onClick={() => navigate(`../bookings`, { state: { openNew: true } })}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#1F1F23] bg-[#1A1A1E] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Add Walk-in</div>
                  <div className="text-xs text-slate-500 mt-0.5">Create booking manually</div>
                </div>
              </button>

              <button 
                onClick={() => setShowSmsModal(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Send SMS Promo</div>
                  <div className="text-xs text-slate-500 mt-0.5">Broadcast to customers</div>
                </div>
              </button>

              <div className="w-full flex items-center justify-between p-4 rounded-xl border border-[#1F1F23] bg-[#1A1A1E]">
                <div className="flex flex-col">
                  <div className="font-bold text-white text-sm">Lucky Wheel</div>
                  <div className="text-xs text-slate-500 mt-0.5">Status: <span className={luckyWheelActive ? "text-emerald-400 font-bold" : "text-slate-400"}>{luckyWheelActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
                </div>
                <button onClick={() => navigate(`../promotions`)} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#27272A] hover:bg-[#3F3F46] text-white rounded transition-colors">Config</button>
              </div>
            </div>
          </div>

          <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl p-6 relative group flex items-center justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-colors group-hover:bg-amber-500/10"></div>
            <div>
               <div className="text-[10px] font-bold text-slate-500 mb-1 tracking-widest uppercase relative z-10">Total Customers</div>
               <div className="text-3xl font-light text-white relative z-10 w-full flex items-center gap-3">
                 {tenantCustomers?.length || 0} <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">+100%</span>
               </div>
            </div>
            <UsersIcon className="w-10 h-10 text-slate-700 opacity-50 relative z-10" />
          </div>
        </div>
      </div>

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-[#151518] border border-[#27272A] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#27272A]">
              <div>
                <h3 className="text-xl text-white font-semibold">Send SMS Promotion</h3>
                <p className="text-xs text-slate-400 mt-1">Broadcast marketing texts directly to clients.</p>
              </div>
              <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSendSms} className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">Message Content</label>
                <textarea 
                  required
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0A0C] border border-[#27272A] rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" 
                  placeholder="e.g. Special offer! Get 20% off all Nails services this weekend..."
                ></textarea>
                <div className="text-xs text-right text-slate-500 mt-1">{smsText.length} / 300 characters</div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-slate-300 font-medium">Select Recipients</label>
                  <button type="button" onClick={handleSelectAll} className="text-xs text-blue-400 hover:text-blue-300">
                    {selectedCustomers.size === tenantCustomers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-[#27272A] rounded-xl bg-[#0A0A0C] divide-y divide-[#27272A]">
                   {tenantCustomers?.map(c => {
                    const hasPhone = c?.phone && c?.phone !== 'N/A';
                    return (
                      <div key={c?.id} onClick={() => hasPhone && toggleCustomer(c.id)} className={`flex items-center gap-3 p-3 transition-colors ${hasPhone ? 'hover:bg-[#1A1A1E] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedCustomers.has(c?.id)} 
                          onChange={() => hasPhone && toggleCustomer(c.id)}
                          disabled={!hasPhone}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900" 
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-200">{c?.fullName || "Unnamed"}</div>
                          <div className="text-xs text-slate-500 font-mono">{hasPhone ? c?.phone : 'No phone number'}</div>
                        </div>
                      </div>
                    );
                  })}
                  {(tenantCustomers?.length === 0 || !tenantCustomers) && (
                    <div className="p-4 text-center text-sm text-slate-500">No customers found.</div>
                  )}
                </div>
              </div>
            </form>

            {toastMsg && (
              <div className={`px-6 py-3 border-y text-sm text-center ${
                toastMsg.startsWith('Error') || toastMsg.startsWith('Failed') 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : toastMsg.startsWith('Partial')
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {toastMsg}
              </div>
            )}

            <div className="p-6 border-t border-[#27272A] flex justify-end gap-3 bg-[#0A0A0C] rounded-b-2xl">
              <button onClick={() => setShowSmsModal(false)} disabled={isSending} className="px-5 py-2.5 rounded-xl border border-[#27272A] text-slate-300 font-medium hover:bg-[#1A1A1E] transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSendSms} disabled={isSending || selectedCustomers.size === 0} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSending ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><MessageSquare size={16} /> Send ({selectedCustomers.size})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
