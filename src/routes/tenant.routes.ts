import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Lấy danh sách Tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany();
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Tenant' });
  }
});

// Đăng nhập Tenant
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { adminEmail: email.toLowerCase().trim() }
    });

    if (!tenant) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, tenant.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo JWT Token
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';
    const token = jwt.sign(
      { email: tenant.adminEmail, role: 'OWNER', tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Trả về thông tin tenant (bỏ mật khẩu) và token
    const { password: _, ...tenantWithoutPassword } = tenant;
    res.json({ ...tenantWithoutPassword, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập' });
  }
});

// Lấy 1 Tenant theo ID
router.get('/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id }
    });
    if (!tenant) return res.status(404).json({ error: 'Không tìm thấy Tenant' });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy Tenant' });
  }
});

// Tạo Tenant mới
router.post('/', async (req, res) => {
  try {
    const { name, slug, adminEmail, password, brandColor, status, location, phone, logoUrl, paymentMethods } = req.body;
    
    console.log("[Server] POST /api/tenants - Incoming Data:", {
      name, slug, brandColor, location, phone, logoUrl
    });
    
    // Kiểm tra email hoặc slug đã tồn tại chưa
    const existing = await prisma.tenant.findFirst({
      where: {
        OR: [{ adminEmail }, { slug }]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email hoặc URL Slug đã tồn tại trong hệ thống' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password || "TempPass123!", 10);

    console.log(`[Server] Starting tenant creation for: ${slug}`);
    
    const tenant = await prisma.tenant.create({
      data: { 
        name, 
        slug, 
        brandColor: brandColor || "#724677", 
        adminEmail, 
        password: hashedPassword,
        status: status || 'ACTIVE',
        location: location || "",
        phone: phone || "",
        logoUrl: logoUrl || "",
        paymentMethods: JSON.stringify(paymentMethods || ['Pay in Store'])
      }
    });

    console.log(`[Server] Tenant created successfully: ${tenant.id}. Starting seeding...`);

    // --- TỰ ĐỘNG TẠO DỮ LIỆU MẪU CHO TIỆM MỚI ---
    try {
      // 1. Tạo dịch vụ mẫu 1
      await prisma.service.create({
        data: { tenantId: tenant.id, name: 'Classic Manicure', category: 'Nails', duration: 45, price: 35 }
      });
      console.log(`[Server] Seeded service 1`);

      // 2. Tạo dịch vụ mẫu 2
      await prisma.service.create({
        data: { tenantId: tenant.id, name: 'Spa Pedicure', category: 'Pedicure', duration: 60, price: 50 }
      });
      console.log(`[Server] Seeded service 2`);

      // 3. Tạo nhân viên mẫu
      await prisma.staff.create({
        data: { tenantId: tenant.id, name: 'Manager', role: 'Staff', status: 'ACTIVE' }
      });
      console.log(`[Server] Seeded staff`);

    } catch (seedErr) {
      console.error("[Server] Seeding error (ignoring):", seedErr);
    }
    
    console.log(`[Server] Finished process for tenant: ${tenant.slug}`);
    
    const { password: _, ...tenantWithoutPassword } = tenant;
    res.status(201).json(tenantWithoutPassword);
  } catch (error: any) {
    console.error("Create tenant error:", error);
    res.status(500).json({ error: 'Lỗi khi tạo Tenant', details: error.message });
  }
});

// Cập nhật thông tin Tenant
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, slug, brandColor, status, adminEmail, password, location, phone, logoUrl, paymentMethods } = req.body;
    
    console.log("[Server] PUT /api/tenants/:id - Incoming Data:", {
      id: req.params.id, name, slug, brandColor, location, phone, logoUrl
    });

    const updateData: any = { 
      name, 
      slug, 
      brandColor, 
      status, 
      adminEmail,
      location: location || "",
      phone: phone || "",
      logoUrl: logoUrl || "",
      paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : undefined,
      workingHours: req.body.workingHours ? JSON.stringify(req.body.workingHours) : undefined
    };
    
    // Nếu có đổi mật khẩu thì mã hóa lại (và không phải là placeholder)
    if (password && !password.includes('•') && !password.startsWith('$2b$')) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    const { password: _, ...tenantWithoutPassword } = tenant;
    res.json(tenantWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật Tenant' });
  }
});

// Xóa Tenant
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.tenant.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa Tenant' });
  }
});

export default router;
