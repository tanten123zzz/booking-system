
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenant.findMany();
  console.log("Current Tenants in DB:");
  tenants.forEach(t => {
    console.log(`- ${t.name} (ID: ${t.id})`);
    console.log(`  Location: "${t.location}"`);
    console.log(`  Phone: "${t.phone}"`);
    console.log(`  Logo: "${t.logoUrl ? 'YES' : 'NO'}"`);
    console.log(`  Color: "${t.brandColor}"`);
  });
}

check();
