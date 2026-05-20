import axios from 'axios';

async function main() {
  const payload = {
    object: 'page',
    entry: [
      {
        id: '100090741296266',
        time: 1716024100000,
        messaging: [
          {
            sender: {
              id: 'customer_psid_123'
            },
            recipient: {
              id: '100090741296266'
            },
            timestamp: 1716024100000,
            message: {
              mid: 'mid.123456789_test',
              text: 'Hello, this is a test message from Antigravity!'
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post('http://localhost:3000/api/facebook/webhook', payload);
    console.log('Webhook test POST status:', response.status);
    console.log('Webhook test POST response:', response.data);
  } catch (error: any) {
    console.error('Webhook test POST failed:', error.response?.data || error.message);
  }
}

main();
