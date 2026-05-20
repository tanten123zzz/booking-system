import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Lấy danh sách Staff của một Tenant
router.get('/', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { tenantId: req.tenantId },
      include: {
        services: { include: { service: true } },
        workShifts: true,
        timeOffs: true
      }
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Staff' });
  }
});

// Lấy 1 Staff
router.get('/:id', async (req, res) => {
  try {
    const staff = await prisma.staff.findFirst({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId 
      },
      include: {
        services: { include: { service: true } },
        workShifts: true,
        timeOffs: true
      }
    });
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy Staff' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy Staff' });
  }
});

// Tạo Staff mới
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, role, phone, status, serviceIds, workShifts, timeOffs } = req.body;
    
    const staff = await prisma.staff.create({
      data: {
        name,
        role,
        phone,
        status,
        tenantId: req.tenantId as string,
        services: {
          create: (serviceIds || []).map((id: string) => ({
            service: { connect: { id } }
          }))
        },
        workShifts: {
          create: (workShifts || []).map((ws: any) => ({
            dayOfWeek: ws.dayOfWeek,
            startTime: ws.startTime,
            endTime: ws.endTime,
            isOff: ws.isOff,
            tenantId: req.tenantId as string
          }))
        },
        timeOffs: {
          create: (timeOffs || []).map((to: any) => ({
            date: new Date(to.date),
            reason: to.reason,
            tenantId: req.tenantId as string
          }))
        }
      },
      include: {
        services: true,
        workShifts: true,
        timeOffs: true
      }
    });
    res.status(201).json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi tạo Staff' });
  }
});

// Cập nhật Staff
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, role, phone, status, serviceIds, workShifts, timeOffs } = req.body;
    
    // Kiểm tra staff tồn tại
    const existing = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy Staff hoặc không thuộc Tenant này' });
    }

    const updateData: any = {
      name: name !== undefined ? name : existing.name,
      role: role !== undefined ? role : existing.role,
      phone: phone !== undefined ? phone : existing.phone,
      status: status !== undefined ? status : existing.status,
    };

    if (serviceIds !== undefined) {
      updateData.services = {
        deleteMany: {},
        create: (serviceIds || []).map((id: string) => ({
          service: { connect: { id } }
        }))
      };
    }

    if (workShifts !== undefined) {
      updateData.workShifts = {
        deleteMany: {},
        create: (workShifts || []).map((ws: any) => ({
          dayOfWeek: ws.dayOfWeek,
          startTime: ws.startTime,
          endTime: ws.endTime,
          isOff: ws.isOff,
          tenantId: req.tenantId as string
        }))
      };
    }

    if (timeOffs !== undefined) {
      console.log("[Server] Processing timeOffs:", JSON.stringify(timeOffs));
      updateData.timeOffs = {
        deleteMany: {},
        create: (timeOffs || []).map((to: any) => {
          let dateVal = to.date;
          // If date is an object (possibly from some weird serialization), try to extract value
          if (typeof dateVal === 'object' && dateVal !== null && dateVal.value) {
            dateVal = dateVal.value;
          }
          
          let dateObj = new Date(dateVal);
          if (isNaN(dateObj.getTime())) {
            console.error("[Server] Invalid date encountered:", dateVal);
            dateObj = new Date(); 
          }

          return {
            date: dateObj,
            reason: to.reason,
            tenantId: req.tenantId as string
          };
        })
      };
    }

    const staff = await prisma.staff.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        services: true,
        workShifts: true,
        timeOffs: true
      }
    });
    
    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi cập nhật Staff' });
  }
});

// Xóa Staff
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const staff = await prisma.staff.deleteMany({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (staff.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy Staff hoặc không thuộc Tenant này' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa Staff' });
  }
});

export default router;
