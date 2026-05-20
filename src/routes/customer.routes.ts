import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Lấy danh sách Customer của một Tenant
router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.tenantId }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Customer' });
  }
});

// Lấy 1 Customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId 
      }
    });
    if (!customer) return res.status(404).json({ error: 'Không tìm thấy Customer' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy Customer' });
  }
});

// Tạo Customer mới
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, email, points, tier } = req.body;
    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        email,
        points: points || 0,
        tier: tier || "Thường",
        tenantId: req.tenantId as string
      }
    });
    res.status(201).json(customer);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Số điện thoại này đã tồn tại trong tiệm của bạn.' });
    }
    res.status(500).json({ error: 'Lỗi khi tạo Customer' });
  }
});

// Cập nhật Customer
router.put('/:id', async (req, res) => {
  try {
    const { fullName, phone, email, points, tier } = req.body;
    const customer = await prisma.customer.updateMany({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId
      },
      data: { fullName, phone, email, points, tier }
    });
    
    if (customer.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy Customer hoặc không thuộc Tenant này' });
    }
    res.json({ message: 'Cập nhật thành công' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Số điện thoại này đã tồn tại trong tiệm của bạn.' });
    }
    res.status(500).json({ error: 'Lỗi khi cập nhật Customer' });
  }
});

// Xóa Customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.deleteMany({
      where: { 
        id: req.params.id,
        tenantId: req.tenantId
      }
    });
    
    if (customer.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy Customer hoặc không thuộc Tenant này' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa Customer' });
  }
});

export default router;
