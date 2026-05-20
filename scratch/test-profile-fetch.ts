import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function check() {
  const socialConfig = await prisma.socialConfig.findFirst({
    where: { tenantId: 't2' }
  });

  if (!socialConfig) {
    console.error('No SocialConfig found!');
    return;
  }

  const psid = '26315837881428090';
  console.log('Testing Graph API Profile fetch...');
  console.log('PSID:', psid);
  console.log('AccessToken:', socialConfig.pageAccessToken.slice(0, 15) + '...');

  try {
    const url = `https://graph.facebook.com/v21.0/${psid}?fields=first_name,last_name&access_token=${socialConfig.pageAccessToken}`;
    const res = await axios.get(url);
    console.log('Success response:', res.data);
  } catch (err: any) {
    console.error('Error response status:', err.response?.status);
    console.error('Error response data:', err.response?.data);
  }

  await prisma.$disconnect();
}

check();
