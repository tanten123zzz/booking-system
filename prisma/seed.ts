import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ID cố định cho seed data - để upsert hoạt động đúng
const SEED_SERVICE_IDS = {
  classicManicure:  'seed-svc-classic-manicure',
  spaPedicure:      'seed-svc-spa-pedicure',
  acrylicFullSet:   'seed-svc-acrylic-full-set',
  gelPolishChange:  'seed-svc-gel-polish-change',
  eyebrowWaxing:    'seed-svc-eyebrow-waxing',
};

const SEED_STAFF_IDS = {
  sarah:   'seed-staff-sarah',
  michael: 'seed-staff-michael',
  emily:   'seed-staff-emily',
  david:   'seed-staff-david',
};

async function main() {
  console.log("Seeding Database...");

  const hashedPassword = await bcrypt.hash("owner123", 10);

  // 1. Tenant - upsert, không thay đổi nếu đã tồn tại
  const tenant = await prisma.tenant.upsert({
    where: { id: "t2" },
    update: {},
    create: {
      id: "t2",
      name: "Topzone Checkin Salon",
      slug: "topzone-checkin",
      adminEmail: "owner@topzonecheckin.com",
      password: hashedPassword,
      brandColor: "#384fff",
      location: "123 Beauty St, Los Angeles, CA",
      phone: "(555) 123-4567"
    }
  });
  console.log("Tenant seeded:", tenant.id);

  // 2. Services - upsert bằng ID cố định
  const servicesData = [
    { id: SEED_SERVICE_IDS.classicManicure, name: "Classic Manicure", price: 35, duration: 45, category: "Nails" },
    { id: SEED_SERVICE_IDS.spaPedicure,     name: "Spa Pedicure",      price: 50, duration: 60, category: "Pedicure" },
    { id: SEED_SERVICE_IDS.acrylicFullSet,  name: "Acrylic Full Set",  price: 65, duration: 90, category: "Nails" },
    { id: SEED_SERVICE_IDS.gelPolishChange, name: "Gel Polish Change", price: 25, duration: 30, category: "Nails" },
    { id: SEED_SERVICE_IDS.eyebrowWaxing,   name: "Eyebrow Waxing",    price: 15, duration: 15, category: "Waxing" }
  ];

  const createdServices = [];
  for (const s of servicesData) {
    const service = await prisma.service.upsert({
      where: { id: s.id },
      update: { name: s.name, price: s.price, duration: s.duration, category: s.category },
      create: { ...s, tenantId: "t2" }
    });
    createdServices.push(service);
  }
  console.log("Services seeded:", createdServices.length);

  // 3. Staff - upsert bằng ID cố định
  const staffData = [
    { id: SEED_STAFF_IDS.sarah,   name: "Sarah Stylist",  role: "Master Nail Tech" },
    { id: SEED_STAFF_IDS.michael, name: "Michael Tech",   role: "Nail Technician" },
    { id: SEED_STAFF_IDS.emily,   name: "Emily Wax",      role: "Esthetician" },
    { id: SEED_STAFF_IDS.david,   name: "David Kim",      role: "Senior Technician" },
  ];

  const createdStaff = [];
  for (const st of staffData) {
    // Kiểm tra xem staff đã tồn tại chưa
    const existing = await prisma.staff.findUnique({ where: { id: st.id } });
    
    if (!existing) {
      // Tạo mới với workShifts và services
      const staffMember = await prisma.staff.create({
        data: {
          id: st.id,
          name: st.name,
          role: st.role,
          tenantId: "t2",
          status: "ACTIVE",
          services: {
            create: createdServices.map(srv => ({ serviceId: srv.id }))
          },
          workShifts: {
            create: Array.from({ length: 7 }).map((_, i) => ({
              tenantId: "t2",
              dayOfWeek: i,
              startTime: i === 0 ? "00:00" : "09:00",
              endTime:   i === 0 ? "00:00" : "18:00",
              isOff: i === 0
            }))
          }
        }
      });
      createdStaff.push(staffMember);
    } else {
      // Cập nhật thông tin cơ bản, không đụng workShifts
      const staffMember = await prisma.staff.update({
        where: { id: st.id },
        data: { name: st.name, role: st.role }
      });
      createdStaff.push(staffMember);
    }
  }
  console.log("Staff seeded:", createdStaff.length);

  // 4. Customers - CHỈ seed nếu chưa có customer nào (lần đầu chạy)
  // Dữ liệu customer do user tạo sẽ KHÔNG bao giờ bị xóa
  const existingCount = await prisma.customer.count({ where: { tenantId: "t2" } });

  if (existingCount === 0) {
    const customersData = [
      { fullName: "Jane Doe",      phone: "+15551234567", tier: "Vàng",       email: "jane@example.com" },
      { fullName: "John Smith",    phone: "+15559876543", tier: "Bạc",        email: "john@example.com" },
      { fullName: "Alice Johnson", phone: "+15555555555", tier: "Kim Cương",  email: "alice@example.com" },
      { fullName: "Bob Brown",     phone: "+15551112222", tier: "Thường",     email: "bob@example.com" },
      { fullName: "Charlie Davis", phone: "+15553334444", tier: "Thường",     email: "charlie@example.com" }
    ];
    for (const c of customersData) {
      await prisma.customer.create({ data: { ...c, tenantId: "t2" } });
    }
    console.log("Customers seeded:", customersData.length, "(first-time init)");
  } else {
    console.log(`Customers skipped — already have ${existingCount} customers in DB.`);
  }

  // 5. Bookings - CHỈ seed nếu chưa có booking nào
  const existingBookings = await prisma.booking.count({ where: { tenantId: "t2" } });

  if (existingBookings === 0) {
    const allCustomers = await prisma.customer.findMany({ where: { tenantId: "t2" } });
    const now = new Date();
    const statuses = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"];

    for (let i = 0; i < 15; i++) {
      const randomDate = new Date(now);
      randomDate.setDate(now.getDate() + (Math.floor(Math.random() * 20) - 10));
      randomDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

      await prisma.booking.create({
        data: {
          tenantId: "t2",
          customerId: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
          serviceId:  createdServices[Math.floor(Math.random() * createdServices.length)].id,
          staffId:    createdStaff[Math.floor(Math.random() * createdStaff.length)].id,
          dateTime: randomDate,
          status: statuses[Math.floor(Math.random() * statuses.length)]
        }
      });
    }
    console.log("Bookings seeded: 15 (first-time init)");
  } else {
    console.log(`Bookings skipped — already have ${existingBookings} bookings in DB.`);
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
