import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function test() {
  const tenantId = 't2';
  const psid = '26315837881428090';

  const socialConfig = await prisma.socialConfig.findUnique({
    where: { tenantId }
  });

  if (socialConfig && socialConfig.pageAccessToken) {
    try {
      console.log('Testing /picture connection...');
      const url = `https://graph.facebook.com/v21.0/${psid}/picture?type=large&redirect=0&access_token=${socialConfig.pageAccessToken}`;
      const res = await axios.get(url);
      console.log('Picture response JSON:', JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      console.error('Error on picture connection:', err.message, err.response?.data);
    }
  }

  await prisma.$disconnect();
}

test();
