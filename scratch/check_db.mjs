import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const customers = await p.customer.findMany();
console.log('Total customers in DB:', customers.length);
customers.slice(0, 10).forEach(c => {
  console.log(`  tenantId=${c.tenantId} | ${c.fullName} | ${c.phone}`);
});

const tenants = await p.tenant.findMany({ select: { id: true, name: true, slug: true } });
console.log('\nTenants:', tenants.length);
tenants.forEach(t => console.log(`  id=${t.id} | ${t.name} | slug=${t.slug}`));

await p.$disconnect();
