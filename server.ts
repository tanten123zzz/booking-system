import express from "express";
import { createServer as createViteServer } from "vite";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { requireTenantId } from './src/middleware/tenant.js';
import { requireAuth } from './src/middleware/auth.js';
import tenantRoutes from './src/routes/tenant.routes.js';
import serviceRoutes from './src/routes/service.routes.js';
import staffRoutes from './src/routes/staff.routes.js';
import customerRoutes from './src/routes/customer.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';
import facebookRoutes from './src/routes/facebook.routes.js';

dotenv.config();
// Triggering restart to apply JWT auth logic




async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 49201;

  app.use(express.json());

  // App Routes
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/services', requireTenantId, serviceRoutes);
  app.use('/api/staff', requireTenantId, staffRoutes);
  app.use('/api/customers', requireAuth, requireTenantId, customerRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/facebook', facebookRoutes);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/admin/twilio-config", (req, res) => {
    res.json({
      accountSid: process.env.TWILIO_ACCOUNT_SID || "",
      authToken: process.env.TWILIO_AUTH_TOKEN ? "••••••••••••••••••••••••••••••••" : "",
      fromPhoneNumber: process.env.TWILIO_PHONE_NUMBER || ""
    });
  });

  // Twilio API Route
  app.post("/api/sms/send", async (req, res) => {
    console.log(`[POST /api/sms/send] Request body:`, req.body);
    const { to, message } = req.body;
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error(`[POST /api/sms/send] Missing Twilio credentials!`);
      return res.status(500).json({ error: "Twilio credentials not configured in environment variables." });
    }

    try {
      console.log(`[POST /api/sms/send] Client init`);
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      console.log(`[POST /api/sms/send] Promsies started`);
      
      const twilioPromises = Promise.allSettled(
        to.map(async (phoneNumber: string) => {
          // Chuẩn hóa số điện thoại: Loại bỏ ký tự không phải số
          let formattedNumber = phoneNumber.replace(/\D/g, '');
          
          // Nếu là số Mỹ (10 chữ số) thì thêm +1
          if (formattedNumber.length === 10) {
            formattedNumber = '+1' + formattedNumber;
          } else if (formattedNumber.length === 11 && formattedNumber.startsWith('1')) {
            formattedNumber = '+' + formattedNumber;
          } else if (!formattedNumber.startsWith('+')) {
            // Trường hợp khác, cứ thêm dấu + nếu chưa có
            formattedNumber = '+' + formattedNumber;
          }

          console.log(`[Twilio] Sending to formatted number: ${formattedNumber}`);

          const msg = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedNumber,
          });
          console.log(`[Twilio] SID: ${msg.sid}, Status: ${msg.status}`);
          return msg;
        })
      );

      const timeoutPromise = new Promise<any[]>((_, reject) => {
        setTimeout(() => reject(new Error("Twilio API request timed out on the server.")), 10000);
      });

      const results = await Promise.race([twilioPromises, timeoutPromise]) as PromiseSettledResult<any>[];
      
      console.log(`[POST /api/sms/send] Promises finished:`, results);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');
      
      if (successful === 0 && failed.length > 0) {
        const firstError = (failed[0] as PromiseRejectedResult).reason;
        return res.status(500).json({ error: firstError.message || "Failed to send SMS." });
      }
      
      res.json({ 
        success: true, 
        count: successful,
        failedCount: failed.length,
        warning: failed.length > 0 ? (failed[0] as PromiseRejectedResult).reason.message : undefined
      });
    } catch (error: any) {
      console.error("Twilio send error:", error);
      res.status(500).json({ error: error.message || "Failed to send SMS." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
