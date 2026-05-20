import axios from 'axios';

async function test() {
  console.log('Testing /api/facebook/conversations/t2 endpoint...');
  try {
    const res = await axios.get('http://localhost:3000/api/facebook/conversations/t2');
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

test();
