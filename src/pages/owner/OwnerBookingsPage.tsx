import { useAppContext } from "../../context/AppContext";
import { Check, X, Search, Calendar as CalendarIcon, User as UserIcon, Phone as PhoneIcon, Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
export function OwnerBookingsPage() {
  const { services, tenantSettings, currentUser, addBooking, customers, addCustomer } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const location = useLocation();
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [realServices, setRealServices] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch dữ liệu và kết nối SSE
  useEffect(() => {
    if (!currentUser?.tenantId) return;

    // Lấy dữ liệu lần đầu
    fetch('/api/bookings', { headers: { 'x-tenant-id': currentUser?.tenantId || '', ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}) } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setRealBookings(data); })
      .catch(console.error);

    fetch('/api/services', { headers: { 'x-tenant-id': currentUser?.tenantId || '', ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}) } })
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data)) {
          setRealServices(data);
          // Tự động chọn dịch vụ đầu tiên làm mặc định
          if (data.length > 0) {
            setWalkInData(prev => ({ ...prev, serviceId: data[0].id }));
          }
        }
      })
      .catch(console.error);

    // Mở luồng SSE
    const sse = new EventSource(`/api/bookings/stream?tenantId=${currentUser.tenantId}`);
    
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        // Bỏ qua ping connection
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

    return () => {
      sse.close();
    };
  }, [currentUser?.tenantId]);

  const updateBookingStatus = async (id: string, status: string) => {
    // Cập nhật giao diện tạm thời (Optimistic UI)
    setRealBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    
    // Gọi API
    try {
      await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({ status })
      });
    } catch(err) {
      console.error(err);
      // Bạn có thể xử lý rollback UI nếu lỗi ở đây
    }
  };

  useEffect(() => {
    if (location.state?.openNew) {
      setShowWalkInModal(true);
      // Clean up state so refresh doesn't reopen
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [walkInData, setWalkInData] = useState({
    name: "",
    phone: "",
    serviceId: "",
    date: new Date().toISOString().split('T')[0],
    time: "10:00",
    saveToCustomers: false
  });

  // Auto-fill name if phone matches
  useEffect(() => {
    if (walkInData.phone.length >= 10) {
      const existing = customers.find(c => c.phone === walkInData.phone);
      if (existing && !walkInData.name) {
        setWalkInData(prev => ({ ...prev, name: existing.name }));
      }
    }
  }, [walkInData.phone, customers]);

  const tenantServices = realServices;

  const filteredBookings = realBookings.filter(b => 
    b?.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    b?.customer?.phone?.includes(search)
  );

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.tenantId) {
      alert("Missing tenant ID. Please log in again.");
      return;
    }
    if (!walkInData.serviceId) {
      alert("Please select a service.");
      return;
    }

    setIsSaving(true);
    try {
      console.log("[Frontend] Sending walk-in booking request...");
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser.tenantId,
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          serviceId: walkInData.serviceId,
          staffId: null,
          customerName: walkInData.name || "Walk-In Customer",
          customerPhone: walkInData.phone || "N/A",
          dateTime: `${walkInData.date}T${walkInData.time}:00`
        })
      });

      if (response.ok) {
        const newBooking = await response.json();
        console.log("[Frontend] Booking created successfully:", newBooking);
        
        // Cập nhật trạng thái thành APPROVED ngay lập tức cho Walk-in
        try {
          const statusRes = await fetch(`/api/bookings/${newBooking.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': currentUser.tenantId,
              ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
            },
            body: JSON.stringify({ status: "APPROVED" })
          });
          if (statusRes.ok) {
            newBooking.status = "APPROVED";
          }
        } catch (statusErr) {
          console.warn("[Frontend] Failed to auto-approve booking:", statusErr);
        }

        // Manually add to list in case SSE fails
        setRealBookings(prev => {
          const exists = prev.find(b => b.id === newBooking.id);
          if (exists) return prev.map(b => b.id === newBooking.id ? newBooking : b);
          return [newBooking, ...prev];
        });

        setShowWalkInModal(false);
        
        // Save to customers if requested
        if (walkInData.saveToCustomers && walkInData.name && walkInData.phone) {
          const alreadyExists = customers.some(c => c.phone === walkInData.phone);
          if (!alreadyExists) {
            addCustomer({
              tenantId: currentUser.tenantId,
              name: walkInData.name,
              phone: walkInData.phone,
              email: "",
              isVip: false
            });
            alert("Đã lưu lịch hẹn và khách hàng mới thành công!");
            navigate('/owner/customers');
            return;
          }
        }

        alert("Đã lưu lịch hẹn thành công!");
      } else {
        const err = await response.json();
        console.error("[Frontend] Server error detail:", err);
        alert(`Lỗi từ Server: ${err.error || "Không rõ nguyên nhân"}`);
      }
    } catch (err: any) {
      console.error("[Frontend] System error:", err);
      alert("System error: " + (err.message || "Unable to connect to server."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Appointments</h1>
            <p className="text-sm text-slate-400 mt-1">Manage and track all booking statuses.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search appointments..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
              />
            </div>
            <button onClick={() => setShowWalkInModal(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap">
              <Plus size={18} /> Walk-in
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0A0A0C] border-y border-[#1F1F23] text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">ID / Customer</th>
                <th className="px-6 py-4">Service Details</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">No appointments found.</td>
                </tr>
              ) : (
                filteredBookings
                  .filter(b => b && b.dateTime)
                  .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                  .map((b) => {
                  const service = realServices?.find(s => s?.id === b?.serviceId);
                    const statusColors = {
                      PENDING: 'text-[#D4AF37] bg-[#D4AF37]/10',
                      APPROVED: 'text-emerald-400 bg-emerald-500/10',
                      REJECTED: 'text-rose-400 bg-rose-500/10',
                      COMPLETED: 'text-indigo-400 bg-indigo-500/10',
                      CANCELLED: 'text-slate-400 bg-slate-500/10'
                    };
                  return (
                    <tr key={b.id} className="hover:bg-[#1A1A1E] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                            {(b?.customer?.fullName || b?.customerName || "W").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{b?.customer?.fullName || b?.customerName || "Walk-In"}</div>
                            <div className="flex items-center text-[12px] text-slate-500 mt-0.5 gap-1">
                              <PhoneIcon className="w-3 h-3" /> {b?.customer?.phone || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{service?.name || "Unknown"}</div>
                        <div className="flex items-center text-[12px] text-slate-500 mt-0.5 gap-1">
                          <UserIcon className="w-3 h-3" /> Staff
                        </div>
                        <div className="inline-flex mt-1 items-center gap-1 text-[10px] font-medium text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
                           test check in
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-300 text-sm gap-1.5 mb-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                          {b?.dateTime?.split('T')[0] || b?.dateTime?.split(' ')[0]}
                        </div>
                        <div className="text-slate-500 text-[12px] ml-5">
                          {b?.dateTime?.includes('T') ? b?.dateTime?.split('T')[1]?.substring(0,5) : (b?.dateTime?.split(' ')[1] + ' ' + (b?.dateTime?.split(' ')[2]||''))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[11px] rounded font-bold ${statusColors[b?.status as keyof typeof statusColors] || statusColors.PENDING}`}>
                          {b?.status === 'APPROVED' && <Check className="w-3 h-3 mr-1" />}
                          {b?.status === 'REJECTED' && <X className="w-3 h-3 mr-1" />}
                          {(b?.status || 'PENDING').charAt(0).toUpperCase() + (b?.status || 'PENDING').slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-block text-left">
                          <select 
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                            className="bg-[#0A0A0C] border border-[#1F1F23] text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="REJECTED">Reject</option>
                            <option value="CANCELLED">Cancel</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-[#151518] border border-[#27272A] w-full max-w-md rounded-2xl shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#27272A]">
              <div>
                <h3 className="text-xl text-white font-semibold">Walk-in Booking</h3>
                <p className="text-xs text-slate-400 mt-1">Create an appointment manually.</p>
              </div>
              <button onClick={() => setShowWalkInModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateWalkIn} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1">Phone Number (Optional)</label>
                <input 
                  type="text"
                  value={walkInData.phone}
                  onChange={e => setWalkInData({...walkInData, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-[#0A0A0C] border border-[#27272A] rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  placeholder="e.g. 555-0192"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1">Customer Name (Optional)</label>
                <input 
                  type="text"
                  value={walkInData.name}
                  onChange={e => setWalkInData({...walkInData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#0A0A0C] border border-[#27272A] rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  placeholder="e.g. Jane Doe"
                />
              </div>

              {walkInData.phone && walkInData.name && !customers.some(c => c.phone === walkInData.phone) && (
                <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
                  <input 
                    type="checkbox" 
                    id="saveToCustomers"
                    checked={walkInData.saveToCustomers}
                    onChange={e => setWalkInData({...walkInData, saveToCustomers: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="saveToCustomers" className="text-xs text-slate-300 cursor-pointer">
                    Add this person to system customers list?
                  </label>
                </div>
              )}
              <div className="pt-2">
                <label className="block text-sm text-slate-300 font-medium mb-1">Service *</label>
                <select 
                  required
                  value={walkInData.serviceId}
                  onChange={e => setWalkInData({...walkInData, serviceId: e.target.value})}
                  className="w-full px-4 py-3 bg-[#0A0A0C] border border-[#27272A] rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                >
                  <option value="" disabled>Select a service</option>
                  {tenantServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1">Date</label>
                  <input 
                    type="date"
                    required
                    value={walkInData.date}
                    onChange={e => setWalkInData({...walkInData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0A0A0C] border border-[#27272A] rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                    style={{colorScheme: 'dark'}}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1">Time</label>
                  <input 
                    type="time"
                    required
                    value={walkInData.time}
                    onChange={e => setWalkInData({...walkInData, time: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0A0A0C] border border-[#27272A] rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                    style={{colorScheme: 'dark'}}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3 text-right mt-2">
                <button type="button" onClick={() => setShowWalkInModal(false)} className="px-5 py-3 w-full border border-[#27272A] rounded-xl text-slate-300 font-medium hover:bg-[#1A1A1E]">
                  Cancel
                </button>
                <button type="submit" disabled={!walkInData.serviceId || isSaving} className="px-5 py-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : "Save Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
