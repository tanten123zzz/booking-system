import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.socialConfig.findFirst();
  console.log('DATABASE_CONFIG:', JSON.stringify(config, null, 2));
}

main().finally(() => prisma.$disconnect());
