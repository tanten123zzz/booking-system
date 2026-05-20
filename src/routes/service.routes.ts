import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Lấy danh sách Services của một Tenant
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { tenantId: req.tenantId }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Service' });
  }
});

// Lấy 1 Service
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findFirst({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId 
      }
    });
    if (!service) return res.status(404).json({ error: 'Không tìm thấy Service' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy Service' });
  }
});

// Tạo Service mới
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, category, duration, price } = req.body;
    const service = await prisma.service.create({
      data: {
        name,
        category,
        duration,
        price,
        tenantId: req.tenantId as string
      }
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo Service' });
  }
});

// Cập nhật Service
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, category, duration, price } = req.body;
    const service = await prisma.service.updateMany({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId
      },
      data: { name, category, duration, price }
    });
    
    if (service.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy Service hoặc không thuộc Tenant này' });
    }
    res.json({ message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật Service' });
  }
});

// Xóa Service
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const service = await prisma.service.deleteMany({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (service.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy Service hoặc không thuộc Tenant này' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa Service' });
  }
});

export default router;
