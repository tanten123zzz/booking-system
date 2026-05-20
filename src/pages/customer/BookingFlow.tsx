import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft, Users as UsersIcon, Calendar as CalendarIcon, User as UserIcon, Scissors, Tag } from "lucide-react";

function convertTimeTo24Hour(time12h: string) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}`;
}

export function BookingFlow() {
  const { tenants } = useAppContext();
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const tenant = tenantSlug ? tenants.find(t => t.slug === tenantSlug) : null;
  const tenantBrandColor = tenant ? tenant.themeColor : "#4f46e5";

  const [realServices, setRealServices] = useState<any[]>([]);
  const [realStaff, setRealStaff] = useState<any[]>([]);
  const [realBookings, setRealBookings] = useState<any[]>([]);

  // Fetch real data from API
  useEffect(() => {
    if (tenant) {
      fetch('/api/services', { headers: { 'x-tenant-id': tenant.id } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setRealServices(data); })
        .catch(console.error);
        
      fetch('/api/staff', { headers: { 'x-tenant-id': tenant.id } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setRealStaff(data); })
        .catch(console.error);

      fetch('/api/bookings', { headers: { 'x-tenant-id': tenant.id } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setRealBookings(data); })
        .catch(console.error);
    }
  }, [tenant]);

  // States
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  
  // Computed Eligible Staff (Lọc thợ theo Dịch vụ)
  const eligibleStaff = useMemo(() => {
    return realStaff.filter(s => {
      if (selectedServices.length === 0) return true;
      const staffServiceIds = s.services?.map((ss: any) => ss.serviceId) || [];
      return selectedServices.every(id => staffServiceIds.includes(id));
    });
  }, [realStaff, selectedServices]);

  // Date & Time data
  const today = new Date();
  const dates = Array.from({length: 7}).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      day: d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
      dateNum: d.getDate(),
      month: d.toLocaleString('en-US', { month: 'short' }),
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(dates[0].fullDate);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Tính toán Time Slots (Khung giờ rảnh dựa trên WorkShift và TimeOff)
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    
    const targetDate = new Date(`${selectedDate}T00:00:00`);
    const targetDay = targetDate.getDay(); // 0-6
    let slots = new Set<string>();

    const staffToCheck = selectedStaff ? eligibleStaff.filter(s => s.id === selectedStaff) : eligibleStaff;

    staffToCheck.forEach(staff => {
      // Check TimeOff
      const hasTimeOff = staff.timeOffs?.some((to: any) => {
        return to.date.split('T')[0] === selectedDate;
      });
      if (hasTimeOff) return; // Thợ này xin nghỉ hôm nay

      // Check WorkShift
      const shift = staff.workShifts?.find((ws: any) => ws.dayOfWeek === targetDay && !ws.isOff);
      if (!shift || !shift.startTime || !shift.endTime) return;

      // Lấy danh sách giờ đã có lịch cho thợ này vào ngày này
      const busyTimes = realBookings
        .filter(b => 
          b.staffId === staff.id && 
          b.dateTime.split('T')[0] === selectedDate &&
          ['PENDING', 'APPROVED', 'COMPLETED'].includes(b.status)
        )
        .map(b => {
          const timePart = b.dateTime.includes('T') ? b.dateTime.split('T')[1].substring(0,5) : b.dateTime.split(' ')[1].substring(0,5);
          return timePart;
        });

      // Tạo các slot cách nhau 30 phút
      let current = new Date(`${selectedDate}T${shift.startTime}:00`);
      const end = new Date(`${selectedDate}T${shift.endTime}:00`);
      
      while (current < end) {
        const time24 = current.toTimeString().substring(0, 5);
        const time12 = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Chỉ add nếu thợ chưa có lịch ở khung giờ này
        if (!busyTimes.includes(time24)) {
          slots.add(time12);
        }
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    return Array.from(slots).sort((a, b) => new Date(`1970/01/01 ${a}`).getTime() - new Date(`1970/01/01 ${b}`).getTime());
  }, [selectedDate, selectedStaff, eligibleStaff, realBookings]);

  const [guests, setGuests] = useState<number>(1);
  const [customerDetails, setCustomerDetails] = useState({ name: "", phone: "", countryCode: "+1", notes: "" });
  const [promoCode, setPromoCode] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 6;

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!tenant) return;
    setIsSubmitting(true);
    try {
      const dt = new Date(`${selectedDate}T${convertTimeTo24Hour(selectedTime)}:00`).toISOString();
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id
        },
        body: JSON.stringify({
          serviceId: selectedServices[0], // Gửi dịch vụ đầu tiên
          staffId: selectedStaff,
          customerName: customerDetails.name,
          customerPhone: `${customerDetails.countryCode} ${customerDetails.phone}`,
          dateTime: dt
        })
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const err = await response.json();
        alert(err.error || "Booking failed.");
      }
    } catch (e) {
      console.error(e);
      alert("System error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = realServices.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
  const discount = promoCode === 'MOTHERDAY20!' ? subtotal * 0.15 : 0;
  const finalTotal = subtotal - discount;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center h-full animate-in fade-in zoom-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white mb-6 shadow-xl" style={{ backgroundColor: tenantBrandColor }}>
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h2>
        <p className="text-gray-500 max-w-sm mb-10 text-lg">Your appointment has been sent to the salon. We will notify you shortly.</p>
        <button 
          onClick={() => {
            setIsSuccess(false);
            setStep(1);
            setSelectedServices([]);
            setSelectedStaff(null);
            setCustomerDetails({ name: "", phone: "", countryCode: "+1", notes: "" });
            setPromoCode("");
            setGuests(1);
          }}
          className="px-8 py-4 rounded-xl font-bold tracking-wide text-white shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: tenantBrandColor }}
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center pt-8 overflow-y-auto bg-gradient-to-br from-[#f8fafc] to-[#f4f4f5] px-4 pb-20">
      
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col min-h-[600px]">
        {/* Header Options */}
        <div className="p-6 border-b border-gray-100 flex items-center">
          {step > 1 ? (
             <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full text-gray-500 hover:bg-gray-50 transition-colors">
               <ArrowLeft size={20} />
             </button>
          ) : <div className="w-10" />}
          <div className="flex-1 text-center">
             <div className="text-xs font-bold tracking-widest mb-1 uppercase" style={{ color: tenantBrandColor }}>
               Step {step} of {totalSteps}
             </div>
             <h2 className="text-xl font-bold text-gray-900">
               {step === 1 && "Select Service"}
               {step === 2 && "Select Staff"}
               {step === 3 && "Select Date & Time"}
               {step === 4 && "Guests"}
               {step === 5 && "Your Information"}
               {step === 6 && "Confirmation"}
             </h2>
          </div>
          <div className="w-10" />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-3">
              {realServices.length === 0 && <div className="text-center text-gray-500 py-10">Loading services...</div>}
              {realServices.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <label key={service.id} className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50 scale-[1.01] shadow-sm' : 'border-gray-100 hover:border-gray-300'}`} style={isSelected ? { borderColor: tenantBrandColor } : {}}>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-lg mb-1">{service.name}</span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <CalendarIcon size={14} className="opacity-70" /> {service.duration} min
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-gray-900 text-lg">${service.price}</div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-transparent' : 'border-gray-300 bg-white'}`} style={isSelected ? { backgroundColor: tenantBrandColor } : {}}>
                         {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    </div>
                    <input type="checkbox" className="sr-only" checked={isSelected} onChange={() => toggleService(service.id)} />
                  </label>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${selectedStaff === null ? 'bg-blue-50/50 scale-[1.01] shadow-sm' : 'border-gray-100 hover:border-gray-300'}`} style={selectedStaff === null ? { borderColor: tenantBrandColor } : {}}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <UserIcon size={20} />
                  </div>
                  <span className="font-bold text-gray-900 text-lg">Any Available</span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedStaff === null ? 'border-transparent' : 'border-gray-300 bg-white'}`} style={selectedStaff === null ? { backgroundColor: tenantBrandColor } : {}}>
                    {selectedStaff === null && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <input type="radio" className="sr-only" checked={selectedStaff === null} onChange={() => setSelectedStaff(null)} />
              </label>

              {eligibleStaff.length === 0 && <div className="text-center text-gray-500 py-4">No staff available for selected services.</div>}
              
              {eligibleStaff.map((s) => {
                const isSelected = selectedStaff === s.id;
                return (
                  <label key={s.id} className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50 scale-[1.01] shadow-sm' : 'border-gray-100 hover:border-gray-300'}`} style={isSelected ? { borderColor: tenantBrandColor } : {}}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: tenantBrandColor }}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg">{s.name}</span>
                        <span className="text-sm text-gray-500">{s.role}</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-transparent' : 'border-gray-300 bg-white'}`} style={isSelected ? { backgroundColor: tenantBrandColor } : {}}>
                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <input type="radio" className="sr-only" checked={isSelected} onChange={() => setSelectedStaff(s.id)} />
                  </label>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col">
              <h4 className="font-semibold text-gray-800 mb-4 text-sm">Select Date</h4>
              <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
                {dates.map((d) => {
                  const isSelected = selectedDate === d.fullDate;
                  return (
                    <button
                      key={d.fullDate}
                      onClick={() => { setSelectedDate(d.fullDate); setSelectedTime(''); }}
                      className={`flex-shrink-0 w-20 py-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${isSelected ? 'shadow-md scale-105' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                      style={isSelected ? { borderColor: tenantBrandColor, backgroundColor: tenantBrandColor, color: 'white' } : { color: '#64748b' }}
                    >
                      <span className="text-xs font-semibold">{d.month}</span>
                      <span className="text-xl font-bold">{d.dateNum}</span>
                      <span className="text-xs font-semibold">{d.day}</span>
                    </button>
                  );
                })}
              </div>

              <h4 className="font-semibold text-gray-800 mt-6 mb-4 text-sm">Select Time</h4>
              {availableTimes.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                  No available slots on this day.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableTimes.map((t) => {
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-colors ${isSelected ? 'bg-blue-50/50' : 'border-gray-100 hover:border-gray-300 bg-white text-gray-600'}`}
                        style={isSelected ? { borderColor: tenantBrandColor, color: tenantBrandColor } : {}}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <UsersIcon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">How many people?</h3>
              <p className="text-gray-500 mb-8 max-w-sm">Are you booking for just yourself or bringing friends along?</p>
              
              <div className="flex items-center gap-6 mb-8 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
                <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                  <span className="text-2xl leading-none -mt-1">-</span>
                </button>
                <div className="text-4xl font-bold text-gray-900 w-16">{guests}</div>
                <button onClick={() => setGuests(guests + 1)} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                  <span className="text-2xl leading-none -mt-1">+</span>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                 <div className="flex gap-2">
                   <select value={customerDetails.countryCode} onChange={e => setCustomerDetails({...customerDetails, countryCode: e.target.value})} className="w-24 px-3 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                     <option value="+1">US +1</option>
                     <option value="+44">UK +44</option>
                     <option value="+84">VN +84</option>
                   </select>
                   <input required type="tel" placeholder="1234567890" value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium" />
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                 <input required type="text" placeholder="John Doe" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium" />
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Order Notes (Optional)</label>
                 <textarea value={customerDetails.notes} onChange={e => setCustomerDetails({...customerDetails, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[120px] resize-none" placeholder="Any special requests?" />
               </div>
            </div>
          )}

          {step === 6 && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-6">
               <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                   <CalendarIcon size={20} />
                 </div>
                 <div>
                   <div className="font-bold text-gray-900 text-lg">{dates.find(d => d.fullDate === selectedDate)?.day} {dates.find(d => d.fullDate === selectedDate)?.month} {dates.find(d => d.fullDate === selectedDate)?.dateNum} {new Date().getFullYear()} at {selectedTime}</div>
                   <div className="text-sm text-gray-500">Scheduled Time</div>
                 </div>
               </div>

               <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                   <UserIcon size={20} />
                 </div>
                 <div>
                   <div className="font-bold text-gray-900 text-lg">{selectedStaff ? realStaff.find(s => s.id === selectedStaff)?.name : 'Any Available'}</div>
                   <div className="text-sm text-gray-500">Staff Member</div>
                 </div>
               </div>

               <div className="pb-6 border-b border-gray-200">
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                   <Scissors size={14} /> Services
                 </div>
                 <div className="space-y-3">
                   {realServices.filter(s => selectedServices.includes(s.id)).map(service => (
                     <div key={service.id} className="flex justify-between items-center text-gray-900 font-medium">
                       <span>{service.name}</span>
                       <span className="font-bold">${service.price}</span>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="pb-6 border-b border-gray-200 space-y-3">
                 <div className="flex justify-between text-gray-500 font-medium">
                   <span>Subtotal</span>
                   <span>${subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                   <div>
                     <div className="font-bold text-xl" style={{ color: tenantBrandColor }}>Final Total</div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-2xl" style={{ color: tenantBrandColor }}>${finalTotal.toFixed(2)}</div>
                   </div>
                 </div>
               </div>

               <div>
                 <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Customer Details</div>
                 <div className="text-gray-900 font-bold mb-1">{customerDetails.name}</div>
                 <div className="text-gray-600 text-sm mb-1">{customerDetails.countryCode} {customerDetails.phone}</div>
               </div>
            </div>
          )}

        </div>

        {/* Footer Nav */}
        <div className="p-6 border-t border-gray-100 bg-white">
          {step < 6 ? (
            <button 
              onClick={handleNext} 
              disabled={
                (step === 1 && selectedServices.length === 0) || 
                (step === 3 && !selectedTime) || 
                (step === 5 && (!customerDetails.name || !customerDetails.phone))
              }
              className="w-full py-4 rounded-xl text-white font-bold text-lg hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600"
              style={step === 1 && selectedServices.length === 0 ? {} : { backgroundColor: tenantBrandColor }}
            >
              Continue
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 bg-blue-600 disabled:opacity-50"
              style={{ backgroundColor: tenantBrandColor }}
            >
              {isSubmitting ? "Processing..." : "Confirm Booking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
