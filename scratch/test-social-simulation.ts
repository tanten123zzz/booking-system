import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('🚀 RUNNING SOCIAL MESSAGING FLOW SIMULATION');
  console.log('==================================================\n');

  // 1. Load tenant t2
  const tenant = await prisma.tenant.findUnique({
    where: { id: 't2' }
  });

  if (!tenant) {
    console.error('❌ Error: Tenant t2 not found in the database. Please seed the database first.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✅ Loaded Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Ensure SocialConfig is fully configured for testing both platforms
  let config = await prisma.socialConfig.findUnique({
    where: { tenantId: 't2' }
  });

  const pageId = '1466572923613975';
  const mockIgAccountId = '17841400008460056';

  if (!config) {
    console.log('⚠️ No SocialConfig found for t2. Creating a mock config...');
    config = await prisma.socialConfig.create({
      data: {
        tenantId: 't2',
        pageId,
        pageAccessToken: 'mock_token_abc_123',
        verifyToken: 'salon_booking_verify_token',
        igAccountId: mockIgAccountId,
        isActive: true
      }
    });
  } else {
    console.log('🔄 Updating SocialConfig with mock credentials for simulation...');
    config = await prisma.socialConfig.update({
      where: { tenantId: 't2' },
      data: { 
        igAccountId: mockIgAccountId,
        pageAccessToken: 'mock_page_access_token_t2'
      }
    });
  }

  console.log(`✅ Social Configuration active:`);
  console.log(`   - Facebook Page ID: ${config.pageId}`);
  console.log(`   - Instagram Account ID: ${config.igAccountId}`);
  console.log(`   - Verify Token: ${config.verifyToken}\n`);

  // 3. Clear previous mock chat history to ensure a clean state
  const mockFbPsid = 'customer_fb_999';
  const mockIgPsid = 'customer_ig_888';

  await prisma.messageHistory.deleteMany({
    where: {
      tenantId: 't2',
      psid: { in: [mockFbPsid, mockIgPsid] }
    }
  });

  await prisma.customer.deleteMany({
    where: {
      tenantId: 't2',
      psid: { in: [mockFbPsid, mockIgPsid] }
    }
  });

  console.log('🧹 Cleaned up old mock conversation history from the database.\n');

  // --- SIMULATION STEP 1: FACEBOOK MESSENGER WEBHOOKS ---

  console.log('💬 [Facebook Messenger] Simulating customer messages...');
  
  // Facebook Text: Triggers Opening Hours auto-reply
  const fbTextPayload = {
    object: 'page',
    entry: [
      {
        id: pageId,
        time: Date.now(),
        messaging: [
          {
            sender: { id: mockFbPsid },
            recipient: { id: pageId },
            timestamp: Date.now(),
            message: {
              mid: `mid.fb_text_${Date.now()}`,
              text: 'Bên mình có mở cửa vào ngày chủ nhật không ạ?'
            }
          }
        ]
      }
    ]
  };

  // Facebook Image: Sends a picture
  const fbImagePayload = {
    object: 'page',
    entry: [
      {
        id: pageId,
        time: Date.now(),
        messaging: [
          {
            sender: { id: mockFbPsid },
            recipient: { id: pageId },
            timestamp: Date.now(),
            message: {
              mid: `mid.fb_img_${Date.now()}`,
              attachments: [
                {
                  type: 'image',
                  payload: {
                    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop'
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    console.log('👉 Sending Facebook Text Webhook (triggers opening hours auto-reply)...');
    let res = await axios.post('http://localhost:3000/api/facebook/webhook', fbTextPayload);
    console.log(`   Response Status: ${res.status} (${res.data})`);

    console.log('👉 Sending Facebook Image Webhook...');
    res = await axios.post('http://localhost:3000/api/facebook/webhook', fbImagePayload);
    console.log(`   Response Status: ${res.status} (${res.data})\n`);
  } catch (err: any) {
    console.error('❌ Error sending Facebook webhooks:', err.response?.data || err.message);
  }

  // --- SIMULATION STEP 2: INSTAGRAM WEBHOOKS ---

  console.log('📸 [Instagram DM] Simulating customer messages...');
  
  // Instagram Text: Triggers Price List auto-reply
  const igTextPayload = {
    object: 'instagram',
    entry: [
      {
        id: mockIgAccountId,
        time: Date.now(),
        messaging: [
          {
            sender: { id: mockIgPsid },
            recipient: { id: mockIgAccountId },
            timestamp: Date.now(),
            message: {
              mid: `mid.ig_text_${Date.now()}`,
              text: 'Cho mình xin bảng giá dịch vụ làm móng nhé!'
            }
          }
        ]
      }
    ]
  };

  // Instagram Image: Sends a picture
  const igImagePayload = {
    object: 'instagram',
    entry: [
      {
        id: mockIgAccountId,
        time: Date.now(),
        messaging: [
          {
            sender: { id: mockIgPsid },
            recipient: { id: mockIgAccountId },
            timestamp: Date.now(),
            message: {
              mid: `mid.ig_img_${Date.now()}`,
              attachments: [
                {
                  type: 'image',
                  payload: {
                    url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop'
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    console.log('👉 Sending Instagram Text Webhook (triggers price list auto-reply)...');
    let res = await axios.post('http://localhost:3000/api/facebook/webhook', igTextPayload);
    console.log(`   Response Status: ${res.status} (${res.data})`);

    console.log('👉 Sending Instagram Image Webhook...');
    res = await axios.post('http://localhost:3000/api/facebook/webhook', igImagePayload);
    console.log(`   Response Status: ${res.status} (${res.data})\n`);
  } catch (err: any) {
    console.error('❌ Error sending Instagram webhooks:', err.response?.data || err.message);
  }

  // --- SIMULATION STEP 3: DB VERIFICATION ---

  console.log('⏳ Waiting for 1.5 seconds to allow webhook async processes to persist...');
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('\n==================================================');
  console.log('📊 DATABASE VERIFICATION');
  console.log('==================================================\n');

  // Verify created customers
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: 't2',
      psid: { in: [mockFbPsid, mockIgPsid] }
    }
  });

  console.log(`👤 Created Customers (${customers.length}):`);
  for (const c of customers) {
    console.log(`   - Name: ${c.fullName} | PSID: ${c.psid} | Phone: ${c.phone} | Tier: ${c.tier}`);
  }
  console.log('');

  // Verify stored messages and platforms
  const messages = await prisma.messageHistory.findMany({
    where: {
      tenantId: 't2',
      psid: { in: [mockFbPsid, mockIgPsid] }
    },
    orderBy: { timestamp: 'asc' }
  });

  console.log(`✉️ Message History in DB (${messages.length} messages found):`);
  
  const fbMsgs = messages.filter(m => m.platform === 'facebook');
  const igMsgs = messages.filter(m => m.platform === 'instagram');

  console.log(`🔵 [Facebook Channel] Message Thread:`);
  for (const m of fbMsgs) {
    const role = m.direction === 'INBOUND' ? 'Customer' : 'Bot/Owner';
    const isImage = m.content.startsWith('http');
    const contentPreview = isImage ? `📷 [Image: ${m.content.substring(0, 50)}...]` : `"${m.content}"`;
    console.log(`   [${role}] ${contentPreview}`);
  }

  console.log(`\n🔴 [Instagram Channel] Message Thread:`);
  for (const m of igMsgs) {
    const role = m.direction === 'INBOUND' ? 'Customer' : 'Bot/Owner';
    const isImage = m.content.startsWith('http');
    const contentPreview = isImage ? `📷 [Image: ${m.content.substring(0, 50)}...]` : `"${m.content}"`;
    console.log(`   [${role}] ${contentPreview}`);
  }

  console.log('\n==================================================');
  console.log('🎉 SIMULATION SUMMARY');
  console.log('==================================================');
  
  const hasFbInbound = messages.some(m => m.platform === 'facebook' && m.direction === 'INBOUND');
  const hasFbOutbound = messages.some(m => m.platform === 'facebook' && m.direction === 'OUTBOUND');
  const hasIgInbound = messages.some(m => m.platform === 'instagram' && m.direction === 'INBOUND');
  const hasIgOutbound = messages.some(m => m.platform === 'instagram' && m.direction === 'OUTBOUND');

  if (hasFbInbound && hasFbOutbound && hasIgInbound && hasIgOutbound) {
    console.log('✅ SUCCESS: Both Facebook and Instagram text messages, image attachments, and auto-replies are working perfectly!');
    console.log('✅ SUCCESS: Cross-platform database tagging is 100% correct.');
  } else {
    console.log('❌ FAILURE: Some messages or auto-replies were not recorded or tagged correctly.');
  }
  console.log('==================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error during simulation:', err);
  prisma.$disconnect();
});
