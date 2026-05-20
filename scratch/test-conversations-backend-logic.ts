import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function test() {
  const tenantId = 't2';
  const conv = { psid: '26315837881428090' };

  let customer = await prisma.customer.findFirst({
    where: { tenantId, psid: conv.psid }
  });

  console.log('Customer in DB:', customer);

  if (!customer) {
    const socialConfig = await prisma.socialConfig.findUnique({
      where: { tenantId }
    });
    console.log('SocialConfig loaded:', socialConfig ? 'Yes' : 'No');
    
    if (socialConfig && socialConfig.pageAccessToken) {
      try {
        console.log(`[FB API] Retroactively fetching profile for PSID: ${conv.psid}`);
        const profileRes = await axios.get(
          `https://graph.facebook.com/v21.0/${conv.psid}?fields=first_name,last_name&access_token=${socialConfig.pageAccessToken}`
        );
        console.log('Profile Response:', profileRes.data);
        if (profileRes.data && (profileRes.data.first_name || profileRes.data.last_name)) {
          const fullName = `${profileRes.data.first_name || ''} ${profileRes.data.last_name || ''}`.trim();
          customer = await prisma.customer.create({
            data: {
              tenantId,
              fullName,
              phone: `FB_${conv.psid.slice(-4)}`,
              psid: conv.psid,
              tier: 'Thường'
            }
          });
          console.log(`[FB API] Successfully created customer retroactively: ${fullName}`);
        }
      } catch (err: any) {
        console.error(`[FB API] Failed to fetch Facebook profile retroactively:`, err.message);
        if (err.response) {
          console.error('Response data:', err.response.data);
        }
      }
    }
  }

  await prisma.$disconnect();
}

test();
