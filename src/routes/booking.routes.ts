import { Router } from 'express';
import { prisma } from '../lib/prisma';
import twilio from 'twilio';
import { requireTenantId } from '../middleware/tenant.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// --- SSE Setup ---
interface SseClient {
  id: number;
  tenantId: string;
  res: any;
}
let clients: SseClient[] = [];

function broadcast(tenantId: string, event: string, data: any) {
  clients.forEach(c => {
    if (c.tenantId === tenantId) {
      c.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  });
}

// Hàm chuẩn hóa SĐT
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.substring(1).replace(/\+/g, '');
  } else {
    cleaned = cleaned.replace(/\+/g, '');
  }
  return cleaned;
}

// SSE Stream Endpoint
router.get('/stream', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenantId query param' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, tenantId, res };
  clients.push(newClient);

  // Send initial ping
  res.write(`data: {"connected": true}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Lấy danh sách Bookings
router.get('/', requireAuth, requireTenantId, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { tenantId: req.tenantId },
      include: {
        customer: true,
        service: true,
        staff: true
      }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Booking' });
  }
});

// Đặt lịch mới (Frontend Khách hàng gọi)
router.post('/', requireTenantId, async (req, res) => {
  try {
    const { serviceId, staffId, dateTime, customerName, customerPhone } = req.body;
    console.log("[Booking API] Received POST request:", { serviceId, staffId, dateTime, customerName, customerPhone });
    
    const normalizedPhone = normalizePhoneNumber(customerPhone || "");
    
    let customer = await prisma.customer.findFirst({
      where: { tenantId: req.tenantId, phone: normalizedPhone }
    });

    if (!customer) {
      console.log("[Booking API] Customer not found, creating new one:", customerName);
      customer = await prisma.customer.create({
        data: {
          fullName: customerName || "Walk-In Customer",
          phone: normalizedPhone,
          tenantId: req.tenantId as string,
          tier: "Thường"
        }
      });
    }

    console.log("[Booking API] Creating booking in DB...");

    // 1. Kiểm tra Lịch nghỉ (Time Off)
    const timeOff = await prisma.timeOff.findFirst({
      where: {
        staffId: staffId,
        date: {
          gte: new Date(new Date(dateTime).setHours(0,0,0,0)),
          lt: new Date(new Date(dateTime).setHours(23,59,59,999))
        }
      }
    });
    if (timeOff) {
      return res.status(400).json({ error: 'Nhân viên này đã xin nghỉ vào ngày đã chọn.' });
    }

    // 2. Kiểm tra Lịch làm việc (Work Shift)
    const bookingDate = new Date(dateTime);
    const dayOfWeek = bookingDate.getDay();
    const shift = await prisma.workShift.findFirst({
      where: {
        staffId: staffId,
        dayOfWeek: dayOfWeek,
        isOff: false
      }
    });
    
    if (!shift) {
      return res.status(400).json({ error: 'Nhân viên không có lịch làm việc vào thứ này.' });
    }

    // Kiểm tra giờ làm việc (đơn giản hóa bằng string comparison "HH:mm")
    const bookingTimeStr = bookingDate.toTimeString().substring(0, 5); // "HH:mm"
    if (bookingTimeStr < shift.startTime || bookingTimeStr >= shift.endTime) {
      return res.status(400).json({ error: `Nhân viên chỉ làm việc từ ${shift.startTime} đến ${shift.endTime}.` });
    }

    // 3. Kiểm tra Trùng lịch (Overlapping Booking)
    // Hiện tại coi mỗi slot là 30p cố định cho đơn giản, hoặc bạn có thể check duration của service
    const existingBooking = await prisma.booking.findFirst({
      where: {
        staffId: staffId,
        dateTime: new Date(dateTime),
        status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] }
      }
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'Khung giờ này đã có người đặt thợ này rồi. Vui lòng chọn giờ khác hoặc thợ khác.' });
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId: req.tenantId as string,
        customerId: customer.id,
        serviceId: serviceId,
        staffId: staffId || null,
        dateTime: new Date(dateTime),
        status: "PENDING"
      },
      include: {
        customer: true,
        service: true,
        staff: true
      }
    });

    console.log("[Booking API] Booking created successfully:", booking.id);
    // Bắn Real-time event cho Owner Dashboard
    broadcast(req.tenantId as string, 'new_booking', booking);

    res.status(201).json(booking);
  } catch (error: any) {
    console.error("[Booking API] Error creating booking:", error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đặt lịch', details: error.message });
  }
});

// Cập nhật trạng thái và gửi SMS (Owner Dashboard gọi)
router.put('/:id/status', requireAuth, requireTenantId, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Cập nhật DB
    const booking = await prisma.booking.update({
      where: { id: req.params.id, tenantId: req.tenantId },
      data: { status },
      include: {
        customer: true,
        service: true,
        staff: true
      }
    });

    // Bắn Real-time event cập nhật trạng thái
    broadcast(req.tenantId as string, 'update_booking', booking);

    // Tự động cập nhật thông tin khách hàng nếu hoàn thành (COMPLETED)
    if (status === 'COMPLETED') {
      console.log(`[Status Change] Booking ${req.params.id} set to COMPLETED. Updating customer ${booking.customerId}...`);
      try {
        const updatedCust = await prisma.customer.update({
          where: { id: booking.customerId },
          data: {
            visits: { increment: 1 },
            lastVisit: new Date()
          }
        });
        console.log(`[Customer Update] SUCCESS: Customer ${booking.customerId} now has ${updatedCust.visits} visits.`);
      } catch (custErr: any) {
        console.error(`[Customer Update] FAILED for customer ${booking.customerId}:`, custErr.message);
      }
    }

    // Xử lý Gửi SMS tự động
    if (status === 'APPROVED' || status === 'REJECTED') {
      try {
        // Lấy TwilioConfig (Tenant riêng biệt, fallback Global/env)
        const twilioConfig = await prisma.twilioConfig.findFirst({
          where: { tenantId: req.tenantId }
        });

        const accountSid = twilioConfig?.accountSid || process.env.TWILIO_ACCOUNT_SID;
        const authToken = twilioConfig?.authToken || process.env.TWILIO_AUTH_TOKEN;
        const fromPhone = twilioConfig?.fromPhoneNumber || process.env.TWILIO_PHONE_NUMBER;

        if (accountSid && authToken && fromPhone) {
          // Lấy SMS Template của Tenant
          let template = await prisma.smsTemplate.findFirst({
            where: { tenantId: req.tenantId, type: status }
          });
          
          let content = template?.content;
          
          if (!content) {
            // Fallback content nếu chưa config
            content = status === 'APPROVED' 
              ? "Hi %customer_name%, your appointment for %service_name% is APPROVED!"
              : "Hi %customer_name%, your appointment for %service_name% is REJECTED.";
          }

          // Thay thế tag
          const messageBody = content
            .replace(/%customer_name%/g, booking.customer.fullName)
            .replace(/%service_name%/g, booking.service.name)
            .replace(/%booking_time%/g, new Date(booking.dateTime).toLocaleString());

          // Send SMS
          const client = twilio(accountSid, authToken);
          await client.messages.create({
            body: messageBody,
            from: fromPhone,
            to: booking.customer.phone
          });
          
          console.log(`[SMS Sent] To: ${booking.customer.phone}, Body: ${messageBody}`);
        } else {
          console.warn("[Twilio] Missing Twilio credentials for this tenant & no fallback env.");
        }
      } catch (smsError) {
        console.error("Twilio send SMS error:", smsError);
        // Không return lỗi ra cho client nếu việc gửi SMS thất bại, vì booking đã update xong
      }
    }

    res.json(booking);
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái' });
  }
});

export default router;
