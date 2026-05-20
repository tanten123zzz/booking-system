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
      console.log(`[FB API] Fetching profile for PSID: ${psid}`);
      const profileRes = await axios.get(
        `https://graph.facebook.com/v21.0/${psid}?fields=first_name,last_name,profile_pic&access_token=${socialConfig.pageAccessToken}`
      );
      console.log('Profile Response:', profileRes.data);
      if (profileRes.data && profileRes.data.profile_pic) {
        const avatarUrl = profileRes.data.profile_pic;
        await prisma.customer.updateMany({
          where: { tenantId, psid },
          data: {
            avatarUrl: avatarUrl
          } as any
        });
        console.log(`Successfully updated avatar for Tony Tran to: ${avatarUrl}`);
      }
    } catch (err: any) {
      console.error(`Failed to update avatar:`, err.message);
    }
  }

  await prisma.$disconnect();
}

test();
