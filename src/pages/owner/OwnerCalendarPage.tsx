import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export function OwnerCalendarPage() {
  const { currentUser } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [realBookings, setRealBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser?.tenantId) return;

    fetch('/api/bookings', { headers: { 'x-tenant-id': currentUser.tenantId, ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}) } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setRealBookings(data); })
      .catch(console.error);
  }, [currentUser?.tenantId]);

  const tenantBookings = realBookings;

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const renderCells = () => {
    const cells = [];
    
    // Empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-transparent border border-transparent"></div>);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayBookings = tenantBookings.filter(b => b.dateTime.startsWith(dateString));

        cells.push(
          <div key={i} className={`min-h-[120px] bg-[#151518] border border-[#1F1F23] rounded-xl p-2 relative ${dayBookings.length > 0 ? "border-indigo-500/50" : ""}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${i === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? "bg-indigo-500 text-white" : "text-slate-300"}`}>
                {i}
              </span>
              {dayBookings.length > 0 && <span className="text-[10px] text-slate-500 font-medium">{dayBookings.length} appts</span>}
            </div>
            
            <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
              {dayBookings.map((b, index) => (
                <div key={index} className="bg-indigo-500/10 text-indigo-300 text-[10px] px-1.5 py-1 rounded truncate flex items-center gap-1">
                  <span className="font-mono opacity-80">{new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {b?.customer?.fullName || b?.customerName || "Walk-In"}
                </div>
              ))}
            </div>
          </div>
        );
    }

    return cells;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="bg-[#151518] rounded-2xl border border-[#1F1F23] shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">{monthName} {year}</h1>
            <div className="flex items-center bg-[#0A0A0C] border border-[#1F1F23] rounded-lg p-0.5">
              <button onClick={prevMonth} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={goToToday} className="px-3 text-sm font-medium text-slate-300 hover:text-white transition-colors border-x border-[#1F1F23]">Today</button>
              <button onClick={nextMonth} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" /> Add Booking
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {renderCells()}
        </div>

        <div className="mt-8 border-t border-[#1F1F23] pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <h2 className="text-sm font-bold text-white">Upcoming Appointments</h2>
            </div>
            <div className="text-xs bg-[#1A1A1E] px-2 py-1 rounded text-slate-400">
               {realBookings.filter(b => new Date(b.dateTime) >= new Date()).length} total
            </div>
          </div>
          <div className="text-center text-sm text-slate-500 py-8 italic border border-dashed border-[#1F1F23] rounded-xl">
             No upcoming appointments for this month (placeholder list).
          </div>
        </div>
      </div>
    </div>
  );
}
