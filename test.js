import fetch from 'node-fetch';
const start = Date.now();
fetch('http://127.0.0.1:3000/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: ["+16026229653"], message: "Test APIII" })
})
.then(res => res.json().then(j => ({s:res.status, b:j})))
.then(res => console.log('Time:', Date.now() - start, 'ms', res))
.catch(console.error);
