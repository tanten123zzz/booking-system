/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppProvider } from "./context/AppContext";
import { SuperAdminLayout } from "./SuperAdminLayout";
import { TwilioConfigPage } from "./pages/admin/TwilioConfigPage";
import { DatabasePage } from "./pages/admin/DatabasePage";
import { TenantsPage } from "./pages/admin/TenantsPage";
import { CustomerLayout } from "./CustomerLayout";
import { BookingFlow } from "./pages/customer/BookingFlow";
import { CustomerPromotionsPage } from "./pages/customer/CustomerPromotionsPage";
import { OwnerLayout } from "./OwnerLayout";
import { OwnerDashboardPage } from "./pages/owner/OwnerDashboardPage";
import { OwnerServicesPage } from "./pages/owner/OwnerServicesPage";
import { OwnerStaffPage } from "./pages/owner/OwnerStaffPage";
import { OwnerBookingsPage } from "./pages/owner/OwnerBookingsPage";
import { OwnerCalendarPage } from "./pages/owner/OwnerCalendarPage";
import { OwnerSettingsPage } from "./pages/owner/OwnerSettingsPage";
import { OwnerCustomersPage } from "./pages/owner/OwnerCustomersPage";
import { OwnerPromotionsPage } from "./pages/owner/OwnerPromotionsPage";
import { LoginPage } from "./pages/LoginPage";
import { OwnerWorkingHoursPage } from "./pages/owner/OwnerWorkingHoursPage";
import OwnerMessagesPage from "./pages/owner/OwnerMessagesPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Index Route - shows switcher */}
          <Route path="/" element={
            <div className="h-screen w-full bg-[#0F0F12] flex items-center justify-center p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-4">NailSaaS App</h1>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">Use the buttons below to switch between the 3 main portals of the application.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a href="/login" className="px-6 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 rounded-xl font-bold uppercase tracking-wider hover:bg-indigo-600/30 transition-all">Portal Login</a>
                  <a href="/lush-nails" className="px-6 py-3 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl font-bold uppercase tracking-wider hover:bg-[#D4AF37]/30 transition-all">Customer Booking</a>
                </div>
              </div>
            </div>
          } />

          <Route path="/login" element={<LoginPage />} />

          {/* Super Admin Routes */}
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<Navigate to="tenants" replace />} />
            <Route path="twilio" element={<TwilioConfigPage />} />
            <Route path="database" element={<DatabasePage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="settings" element={<div className="text-slate-400">Settings Content (WIP)</div>} />
          </Route>

          {/* Authentication Routes */}
          <Route path="/:tenantSlug/login" element={<LoginPage />} />

          {/* Owner Dashboard Routes */}
          <Route path="/:tenantSlug/admin" element={<OwnerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboardPage />} />
            <Route path="calendar" element={<OwnerCalendarPage />} />
            <Route path="services" element={<OwnerServicesPage />} />
            <Route path="staff" element={<OwnerStaffPage />} />
            <Route path="working-hours" element={<OwnerWorkingHoursPage />} />
            <Route path="customers" element={<OwnerCustomersPage />} />
            <Route path="bookings" element={<OwnerBookingsPage />} />
            <Route path="promotions" element={<OwnerPromotionsPage />} />
            <Route path="messages" element={<OwnerMessagesPage />} />
            <Route path="settings" element={<OwnerSettingsPage />} />
          </Route>

          {/* Customer Booking Routes (Simulating subdomains via path param) */}
          <Route path="/:tenantSlug" element={<CustomerLayout />}>
            <Route index element={<BookingFlow />} />
            <Route path="booking" element={<BookingFlow />} />
            <Route path="promotions" element={<CustomerPromotionsPage />} />
            <Route path="promotion" element={<CustomerPromotionsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
