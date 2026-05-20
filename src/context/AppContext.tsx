import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'SUPER_ADMIN' | 'OWNER' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  token?: string;
}

interface Service {
  id: number;
  tenantId: string;
  name: string;
  duration: number;
  price: number;
  subtitle: string;
}

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface SalonWorkHours {
  mon: DaySchedule; tue: DaySchedule; wed: DaySchedule; thu: DaySchedule; 
  fri: DaySchedule; sat: DaySchedule; sun: DaySchedule;
}

export interface SalonHoliday {
  id: string;
  tenantId: string;
  date: string;
  name: string;
}

export interface StaffTimeOff {
  id: string;
  tenantId: string;
  staffId: string;
  date: string;
  reason?: string;
}

interface WorkHours {
  mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string;
}

export interface Staff {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  phone: string;
  dayOff: string;
  workHours: WorkHours;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  tier: string;
  points: number;
  visits: number;
  lastVisit: string;
  isVip: boolean;
}

export interface PrizeConfig {
  label: string;
  discountPercentage: number;
  probability: number;
}

export interface Coupon {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  status?: 'ACTIVE' | 'INACTIVE';
  prizes?: PrizeConfig[];
}

interface Booking {
  id: string;
  tenantId: string;
  serviceId: number;
  staffId: number | null;
  customerName: string;
  customerPhone: string;
  dateTime: string;
  status: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  adminEmail: string;
  createdDate: string;
  status: 'Active' | 'Inactive';
  brandColor: string;
  location?: string;
  phone?: string;
  logoUrl?: string;
  paymentMethods: string[];
}

interface TenantSettings {
  name: string;
  brandColor: string;
  slug: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  googleMapReviewLink: string;
  timeSlotInterval: string;
  minimumLeadTime: string;
}

interface AppContextType {
  currentUser: User | null;
  login: (email: string, role: UserRole, tenantId?: string, token?: string) => void;
  logout: () => void;
  
  tenantSettings: TenantSettings;
  setTenantSettings: (settings: TenantSettings) => void;

  services: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: number, service: Omit<Service, 'id'>) => void;
  deleteService: (id: number) => void;

  staff: Staff[];
  addStaff: (s: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, s: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  refreshStaff: () => Promise<void>;

  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'visits' | 'lastVisit' | 'points' | 'tier'>) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  refreshCustomers: () => Promise<void>;
  
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: string, status: string) => void;

  twilioConfig: any;
  setTwilioConfig: (config: any) => void;
  smsTemplates: any;
  setSmsTemplates: (templates: any) => void;

  tenants: Tenant[];
  addTenant: (t: Omit<Tenant, 'id'>) => void;
  updateTenant: (id: string, t: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;

  coupons: Coupon[];
  addCoupon: (c: Omit<Coupon, 'id'>) => void;
  updateCoupon: (id: string, c: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  luckyWheelActive: boolean;
  setLuckyWheelActive: (active: boolean) => void;

  salonWorkHours: SalonWorkHours;
  updateSalonWorkHours: (hours: SalonWorkHours) => void;
  salonHolidays: SalonHoliday[];
  addSalonHoliday: (h: Omit<SalonHoliday, 'id'>) => void;
  deleteSalonHoliday: (id: string) => void;
  staffTimeOffs: StaffTimeOff[];
  addStaffTimeOff: (t: Omit<StaffTimeOff, 'id'>) => void;
  deleteStaffTimeOff: (id: string) => void;
}

const defaultDaySchedule: DaySchedule = { isOpen: true, openTime: '09:00 AM', closeTime: '06:00 PM' };
const defaultSalonWorkHours: SalonWorkHours = {
  mon: { ...defaultDaySchedule }, tue: { ...defaultDaySchedule }, wed: { ...defaultDaySchedule },
  thu: { ...defaultDaySchedule, isOpen: false }, fri: { ...defaultDaySchedule }, 
  sat: { ...defaultDaySchedule }, sun: { ...defaultDaySchedule }
};

const defaultWorkHours: WorkHours = {
  mon: '09:00 - 18:00', tue: '09:00 - 18:00', wed: '09:00 - 18:00', 
  thu: '09:00 - 18:00', fri: '09:00 - 18:00', sat: 'Off', sun: 'Off'
};

const mockServices: Service[] = [
  { id: 1, tenantId: "t1", name: "Classic Manicure", duration: 45, price: 35, subtitle: "Essential care" },
  { id: 2, tenantId: "t1", name: "Spa Pedicure", duration: 60, price: 50, subtitle: "Relaxing foot spa" },
  { id: 3, tenantId: "t2", name: "Topzone Special", duration: 60, price: 60, subtitle: "Our signature service" },
];

const mockStaff: Staff[] = [
  { id: 1, tenantId: "t1", name: "Sarah", role: "Stylist", phone: "(555) 123-4567", dayOff: "None", workHours: {...defaultWorkHours}, status: "ACTIVE" },
  { id: 2, tenantId: "t1", name: "Michael", role: "Staff", phone: "(555) 987-6543", dayOff: "None", workHours: {...defaultWorkHours}, status: "ACTIVE" },
  { id: 3, tenantId: "t2", name: "David", role: "Stylist", phone: "(555) 555-5555", dayOff: "Monday", workHours: {...defaultWorkHours, mon: 'Off'}, status: "ACTIVE" },
];

const mockCustomers: Customer[] = [
  { id: "f73e390b", tenantId: "t1", name: "Test", phone: "+84898422025", email: "No email", tier: "Thường", points: 8, visits: 1, lastVisit: "4/28/2026", isVip: false },
  { id: "aa2b8aa3", tenantId: "t1", name: "Test Check In", phone: "+1123456789", email: "email@example.com", tier: "Thường", points: 11, visits: 1, lastVisit: "4/28/2026", isVip: true },
  { id: "00c37f48", tenantId: "t2", name: "Q", phone: "+11662631945", email: "No email", tier: "Thường", points: 21, visits: 1, lastVisit: "4/24/2026", isVip: false },
];

const mockBookings: Booking[] = [
  { id: "b1", tenantId: "t1", serviceId: 1, staffId: 1, customerName: "Test Check In", customerPhone: "+1123456789", dateTime: "2026-04-27T19:00:00", status: "APPROVED" },
  { id: "b2", tenantId: "t1", serviceId: 2, staffId: 1, customerName: "Test", customerPhone: "+84898422025", dateTime: "2026-04-27T19:00:00", status: "REJECTED" },
  { id: "b3", tenantId: "t2", serviceId: 3, staffId: 3, customerName: "test", customerPhone: "+123445678", dateTime: "2026-04-23T10:00:00", status: "PENDING" },
];

const mockTenants: Tenant[] = [
  { id: "t1", name: "Topzone Coporation", slug: "topzone", adminEmail: "itl@topzone.com", createdDate: "4/23/2026", status: "Active", themeColor: "#384fff", location: "N/A", phone: "N/A", paymentMethods: ["Pay in Store"] },
  { id: "t2", name: "Topzone Checkin Salon", slug: "topzone-checkin", adminEmail: "owner@topzonecheckin.com", createdDate: "4/22/2026", status: "Active", themeColor: "#384fff", location: "123 Beauty St", phone: "(555) 123-4567", paymentMethods: ["Pay in Store", "Credit Card"] },
  { id: "t3", name: "Nail Beauty", slug: "nail-beauty", adminEmail: "ittopzone@topzonemarketing.com", createdDate: "4/30/2026", status: "Active", themeColor: "#ec4899", location: "456 Nail Ave", phone: "(555) 987-6543", paymentMethods: ["Pay in Store"] },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Try to load state from localStorage
  const loadState = (key: string, defaultState: any) => {
    try {
      const saved = localStorage.getItem(`salon_${key}`);
      return saved ? JSON.parse(saved) : defaultState;
    } catch (e) {
      return defaultState;
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(loadState('currentUser', null));
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>(loadState('settings', {
    name: "Topzone Checkin Salon", 
    brandColor: "#384fff", 
    slug: "topzone-checkin",
    logoUrl: null,
    address: "123 Beauty St, Los Angeles, CA",
    phone: "(555) 123-4567",
    googleMapReviewLink: "https://share.google/6wzEGSLMZ03GBZYl2",
    timeSlotInterval: "30",
    minimumLeadTime: "60"
  }));
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantId = currentUser?.tenantId;
        const tenantHeaders: Record<string, string> = {
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {}),
          'bypass-tunnel-reminder': 'true'
        };

        const [tenantsRes, servicesRes, staffRes, customersRes, bookingsRes] = await Promise.all([
          fetch('/api/tenants', { headers: { 'bypass-tunnel-reminder': 'true' } }),
          fetch('/api/services',  { headers: tenantHeaders }),
          fetch('/api/staff',     { headers: tenantHeaders }),
          fetch('/api/customers', { headers: tenantHeaders }),
          fetch('/api/bookings',  { headers: tenantHeaders }),
        ]);
        
        try {
          const twilioRes = await fetch('/api/admin/twilio-config', { headers: tenantHeaders });
          if (twilioRes.ok) {
            const twilioData = await twilioRes.json();
            if (twilioData && twilioData.accountSid) {
              setTwilioConfig(twilioData);
            }
          }
        } catch (err) {
          console.error("Failed to fetch twilio config", err);
        }
        
        const [tenantsData, servicesData, staffData, customersData, bookingsData] = await Promise.all([
          tenantsRes.json(),
          servicesRes.json(),
          staffRes.json(),
          customersRes.json(),
          bookingsRes.json()
        ]);
        
        if (Array.isArray(tenantsData)) {
          const parsedTenants = tenantsData.map((t: any) => ({
            ...t,
            location: t.location || "",
            phone: t.phone || "",
            paymentMethods: typeof t.paymentMethods === 'string' 
              ? JSON.parse(t.paymentMethods) 
              : (Array.isArray(t.paymentMethods) ? t.paymentMethods : ['Pay in Store'])
          }));
          setTenants(parsedTenants);
          
          // Load salonWorkHours from active tenant
          const activeTenant = parsedTenants.find((t: any) => t.id === currentUser?.tenantId);
          if (activeTenant && activeTenant.workingHours) {
            try {
              setSalonWorkHours(JSON.parse(activeTenant.workingHours));
            } catch (e) {
              console.error("Error parsing salon working hours", e);
            }
          }
        }
        if (Array.isArray(servicesData)) setServices(servicesData);
        if (Array.isArray(staffData)) {
          const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const mappedStaff = staffData.map((s: any) => {
            const hours: any = { ...defaultWorkHours };
            s.workShifts?.forEach((ws: any) => {
              const day = days[ws.dayOfWeek];
              hours[day] = ws.isOff ? 'Off' : `${ws.startTime} - ${ws.endTime}`;
            });
            
            return {
              id: s.id,
              tenantId: s.tenantId,
              name: s.name,
              role: s.role,
              phone: s.phone || '',
              status: s.status,
              workHours: hours,
              dayOff: s.workShifts?.find((ws: any) => ws.isOff)?.dayOfWeek !== undefined 
                ? days[s.workShifts.find((ws: any) => ws.isOff).dayOfWeek] 
                : 'None'
            };
          });
          setStaff(mappedStaff);
          
          // Also sync staffTimeOffs global state
          const allTimeOffs = staffData.flatMap((s: any) => 
            (s.timeOffs || []).map((to: any) => ({
              id: to.id,
              tenantId: to.tenantId,
              staffId: to.staffId,
              date: to.date,
              reason: to.reason
            }))
          );
          setStaffTimeOffs(allTimeOffs);
        }
        if (Array.isArray(customersData)) {
          // Map DB field `fullName` → frontend field `name` for compatibility
          setCustomers(customersData.map((c: any) => ({
            ...c,
            name: c.fullName || c.name || '',
            isVip: c.isVip ?? false,
          })));
        }
        if (Array.isArray(bookingsData)) setBookings(bookingsData);
      } catch (err) {
        console.error("AppContext initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser?.tenantId]);  // re-fetch whenever the active tenant changes
  const [coupons, setCoupons] = useState<Coupon[]>(loadState('coupons', []));
  const [luckyWheelActive, setLuckyWheelActive] = useState<boolean>(loadState('luckyWheelActive', true));

  const [salonWorkHours, setSalonWorkHours] = useState<SalonWorkHours>(loadState('salonWorkHours', defaultSalonWorkHours));
  const [salonHolidays, setSalonHolidays] = useState<SalonHoliday[]>(loadState('salonHolidays', []));
  const [staffTimeOffs, setStaffTimeOffs] = useState<StaffTimeOff[]>(loadState('staffTimeOffs', []));

  const [twilioConfig, setTwilioConfig] = useState(loadState('twilio', {
    enabled: true,
    accountSid: "AC_DUMMY_ACCOUNT_SID",
    authToken: "DUMMY_AUTH_TOKEN",
    fromPhoneNumber: "+18507808397"
  }));

  const [smsTemplates, setSmsTemplates] = useState(loadState('sms', {
    pending: "Hello %tenant_name%, booking for %service_name% is PENDING.",
    approved: "Hi %customer_full_name%, appointment for %service_name% APPROVED!",
    rejected: "Hi %customer_full_name%, appointment for %service_name% REJECTED."
  }));

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    localStorage.setItem('salon_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);
  React.useEffect(() => localStorage.setItem('salon_settings', JSON.stringify(tenantSettings)), [tenantSettings]);
  React.useEffect(() => localStorage.setItem('salon_services', JSON.stringify(services)), [services]);
  React.useEffect(() => localStorage.setItem('salon_staff', JSON.stringify(staff)), [staff]);
  React.useEffect(() => localStorage.setItem('salon_customers', JSON.stringify(customers)), [customers]);
  React.useEffect(() => localStorage.setItem('salon_bookings', JSON.stringify(bookings)), [bookings]);
  React.useEffect(() => localStorage.setItem('salon_tenants', JSON.stringify(tenants)), [tenants]);
  React.useEffect(() => localStorage.setItem('salon_coupons', JSON.stringify(coupons)), [coupons]);
  React.useEffect(() => localStorage.setItem('salon_luckyWheelActive', JSON.stringify(luckyWheelActive)), [luckyWheelActive]);
  React.useEffect(() => localStorage.setItem('salon_twilio', JSON.stringify(twilioConfig)), [twilioConfig]);
  React.useEffect(() => localStorage.setItem('salon_sms', JSON.stringify(smsTemplates)), [smsTemplates]);

  React.useEffect(() => localStorage.setItem('salon_salonWorkHours', JSON.stringify(salonWorkHours)), [salonWorkHours]);
  React.useEffect(() => localStorage.setItem('salon_salonHolidays', JSON.stringify(salonHolidays)), [salonHolidays]);
  React.useEffect(() => localStorage.setItem('salon_staffTimeOffs', JSON.stringify(staffTimeOffs)), [staffTimeOffs]);

  const login = (email: string, role: UserRole, tenantId?: string, token?: string) => {
    const user = { id: "u123", name: role === 'SUPER_ADMIN' ? "Admin" : "Salon Owner", email, role, tenantId: role === 'OWNER' ? tenantId : undefined, token };
    setCurrentUser(user);
    localStorage.setItem('salon_currentUser', JSON.stringify(user));
  };
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('salon_currentUser');
  };

  /* Categories */
  const addService = (service: Omit<Service, 'id'>) => setServices(prev => [...prev, { ...service, id: Date.now() }]);
  const updateService = (id: number, service: Omit<Service, 'id'>) => setServices(prev => prev.map(s => s.id === id ? { ...service, id } : s));
  const deleteService = (id: number) => setServices(prev => prev.filter(s => s.id !== id));

  /* Staff */
  const addStaff = async (s: Omit<Staff, 'id'>) => {
    try {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const workShifts = Object.entries(s.workHours).map(([day, value]) => {
        const dayOfWeek = days.indexOf(day);
        if (value === 'Off') return { dayOfWeek, isOff: true };
        const [start, end] = (value as string).split(' - ');
        return { dayOfWeek, startTime: start || '09:00', endTime: end || '18:00', isOff: false };
      });

      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          name: s.name,
          role: s.role,
          phone: s.phone,
          status: s.status,
          workShifts
        }),
      });
      if (res.ok) {
        await refreshStaff();
      }
    } catch (err) {
      console.error('[addStaff] error:', err);
    }
  };

  const updateStaff = async (id: string, s: Partial<Staff>) => {
    try {
      const body: any = { ...s };
      if (s.workHours) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        body.workShifts = Object.entries(s.workHours).map(([day, value]) => {
          const dayOfWeek = days.indexOf(day);
          if (value === 'Off') return { dayOfWeek, isOff: true };
          const [start, end] = (value as string).split(' - ');
          return { dayOfWeek, startTime: start || '09:00', endTime: end || '18:00', isOff: false };
        });
      }

      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await refreshStaff();
      }
    } catch (err) {
      console.error('[updateStaff] error:', err);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
      });
      if (res.ok) {
        setStaff(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('[deleteStaff] error:', err);
    }
  };

  const refreshStaff = async () => {
    try {
      const tenantId = currentUser?.tenantId;
      const headers = {
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
      };
      const res = await fetch('/api/staff', { headers });
      const staffData = await res.json();
      if (Array.isArray(staffData)) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const mappedStaff = staffData.map((s: any) => {
          const hours: any = { ...defaultWorkHours };
          s.workShifts?.forEach((ws: any) => {
            const day = days[ws.dayOfWeek];
            hours[day] = ws.isOff ? 'Off' : `${ws.startTime} - ${ws.endTime}`;
          });
          return {
            id: s.id,
            tenantId: s.tenantId,
            name: s.name,
            role: s.role,
            phone: s.phone || '',
            status: s.status,
            workHours: hours,
            dayOff: s.workShifts?.find((ws: any) => ws.isOff)?.dayOfWeek !== undefined 
              ? days[s.workShifts.find((ws: any) => ws.isOff).dayOfWeek] 
              : 'None'
          };
        });
        setStaff(mappedStaff);

        // Also sync staffTimeOffs global state
        const allTimeOffs = staffData.flatMap((s: any) => 
          (s.timeOffs || []).map((to: any) => ({
            id: to.id,
            tenantId: to.tenantId,
            staffId: to.staffId,
            date: to.date,
            reason: to.reason
          }))
        );
        setStaffTimeOffs(allTimeOffs);
      }
    } catch (err) {
      console.error('[refreshStaff] error:', err);
    }
  };

  /* Customers — wired to real API so data persists across restarts */
  const addCustomer = async (c: Omit<Customer, 'id' | 'visits' | 'lastVisit' | 'points' | 'tier'>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          fullName: c.name,   // DB column is fullName
          phone: c.phone || '',
          email: c.email || undefined,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        // Merge DB response with local-only fields (isVip)
        setCustomers(prev => [{
          ...saved,
          name: saved.fullName,
          isVip: (c as any).isVip ?? false,
        }, ...prev]);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[addCustomer] API error:', err);
        alert(err.error || 'Không thể tạo khách hàng. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('[addCustomer] fetch error:', err);
    }
  };

  const updateCustomer = async (id: string, c: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          fullName: (c as any).name || (c as any).fullName,
          phone: c.phone,
          email: c.email,
          points: c.points,
          tier: c.tier,
        }),
      });
      if (res.ok) {
        setCustomers(prev => prev.map(cust => cust.id === id ? { ...cust, ...c } : cust));
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[updateCustomer] API error:', err);
        alert(err.error || 'Không thể cập nhật khách hàng.');
      }
    } catch (err) {
      console.error('[updateCustomer] fetch error:', err);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
      });
      if (res.ok || res.status === 204) {
        setCustomers(prev => prev.filter(c => c.id !== id));
      } else {
        console.error('[deleteCustomer] API error:', res.status);
      }
    } catch (err) {
      console.error('[deleteCustomer] fetch error:', err);
    }
  };

  const refreshCustomers = async () => {
    if (!currentUser?.tenantId) return;
    try {
      const res = await fetch('/api/customers', {
        headers: { 
          'x-tenant-id': currentUser.tenantId,
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data.map((c: any) => ({
          ...c,
          name: c.fullName || c.name || '',
          isVip: (c as any).isVip ?? false,
        })));
      }
    } catch (err) {
      console.error('[refreshCustomers] fetch error:', err);
    }
  };

  /* Bookings */
  const addBooking = (booking: Booking) => setBookings((prev) => [...prev, booking]);
  const updateBookingStatus = (id: string, status: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const service = services?.find(s => s?.id === booking?.serviceId);
    let template = "";
    if (status === 'APPROVED') template = smsTemplates?.approved;
    if (status === 'REJECTED') template = smsTemplates?.rejected;
    if (template && twilioConfig.enabled) {
      const smsContent = template
        .replace('%customer_full_name%', booking?.customerName || 'Customer')
        .replace('%service_name%', service?.name || 'Service')
        .replace('%tenant_name%', tenantSettings?.name || 'Our Salon');
      console.log(`[TWILIO MOCK] Sending SMS to ${booking?.customerPhone || 'N/A'}: \n"${smsContent}"`);
    } else if (template && !twilioConfig.enabled) {
      console.log(`[TWILIO] SMS Notification is DISABLED. Skipping message to ${booking?.customerPhone}`);
    }
  };

  /* Tenants */
  const addTenant = (t: Omit<Tenant, 'id'>) => setTenants(prev => [{ ...t, id: Math.random().toString(36).substr(2, 9) }, ...prev]);
  const updateTenant = (id: string, t: Partial<Tenant>) => setTenants(prev => prev.map(tenant => tenant.id === id ? { ...tenant, ...t } : tenant));
  const deleteTenant = (id: string) => setTenants(prev => prev.filter(t => t.id !== id));

  /* Coupons */
  const addCoupon = (c: Omit<Coupon, 'id'>) => setCoupons(prev => [{ ...c, id: Math.random().toString(36).substring(2, 10) }, ...prev]);
  const updateCoupon = (id: string, c: Partial<Coupon>) => setCoupons(prev => prev.map(coupon => coupon.id === id ? { ...coupon, ...c } : coupon));
  const deleteCoupon = (id: string) => setCoupons(prev => prev.filter(c => c.id !== id));

  const updateSalonWorkHours = async (hours: SalonWorkHours) => {
    try {
      setSalonWorkHours(hours);
      if (!currentUser?.tenantId) return;
      
      const res = await fetch(`/api/tenants/${currentUser.tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({ workingHours: hours }),
      });
      
      if (!res.ok) {
        console.error("Failed to save salon working hours to DB");
      }
    } catch (err) {
      console.error('[updateSalonWorkHours] error:', err);
    }
  };
  const addSalonHoliday = (h: Omit<SalonHoliday, 'id'>) => setSalonHolidays(prev => [...prev, { ...h, id: Math.random().toString(36).substring(2, 10) }]);
  const deleteSalonHoliday = (id: string) => setSalonHolidays(prev => prev.filter(h => h.id !== id));
  const addStaffTimeOff = async (t: Omit<StaffTimeOff, 'id'>) => {
    try {
      // Find current staff to get existing time-offs
      const staffRes = await fetch(`/api/staff/${t.staffId}`, {
        headers: { 'x-tenant-id': currentUser?.tenantId || '' }
      });
      const staffMember = await staffRes.json();
      
      const updatedTimeOffs = [...(staffMember.timeOffs || []), { date: t.date, reason: t.reason }];
      
      const res = await fetch(`/api/staff/${t.staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({ timeOffs: updatedTimeOffs }),
      });
      
      if (res.ok) {
        await refreshStaff();
      }
    } catch (err) {
      console.error('[addStaffTimeOff] error:', err);
    }
  };

  const deleteStaffTimeOff = async (id: string) => {
    // In our simplified backend, we delete by updating the staff member's time-off list
    // OR if we have a direct delete endpoint. Let's see staff.routes.ts...
    // Actually, staff.routes.ts updates the entire list by deleting all and recreating.
    // So we need to find which staff member this timeOff belongs to and update them.
    try {
      const timeOffToDelete = staffTimeOffs.find(to => to.id === id);
      if (!timeOffToDelete) return;

      const staffRes = await fetch(`/api/staff/${timeOffToDelete.staffId}`, {
        headers: { 'x-tenant-id': currentUser?.tenantId || '' }
      });
      const staffMember = await staffRes.json();
      
      const updatedTimeOffs = (staffMember.timeOffs || []).filter((to: any) => to.id !== id);
      
      const res = await fetch(`/api/staff/${timeOffToDelete.staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser?.tenantId || '',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({ timeOffs: updatedTimeOffs }),
      });
      
      if (res.ok) {
        await refreshStaff();
      }
    } catch (err) {
      console.error('[deleteStaffTimeOff] error:', err);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, tenantSettings, setTenantSettings,
      services, addService, updateService, deleteService,
      staff, addStaff, updateStaff, deleteStaff, refreshStaff,
      customers, addCustomer, updateCustomer, deleteCustomer, refreshCustomers,
      bookings, addBooking, updateBookingStatus,
      twilioConfig, setTwilioConfig, smsTemplates, setSmsTemplates,
      tenants, addTenant, updateTenant, deleteTenant,
      coupons, addCoupon, updateCoupon, deleteCoupon,
      luckyWheelActive, setLuckyWheelActive,
      salonWorkHours, updateSalonWorkHours,
      salonHolidays, addSalonHoliday, deleteSalonHoliday,
      staffTimeOffs, addStaffTimeOff, deleteStaffTimeOff
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
