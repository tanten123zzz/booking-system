import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.socialConfig.findMany();
  console.log("SOCIAL CONFIGS:", JSON.stringify(configs, null, 2));
}

main().catch(console.error);
