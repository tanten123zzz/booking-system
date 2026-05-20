import axios from 'axios';

async function main() {
  const token = 'EAAQEZAiAxT3kBRqyLRMG8E3NyorUONnmi8d3oU87QCN2ElraYSpYZAJMk7jzgDYHJrcZCrTMuTAK8okRW3PhjWzaW2CkzwBdUmWiRdXt55o2qcNyeC4ZCs9152PlXAoXaBMYIkZBFbqgO8sfzjG0ZBrZA1CwMB1a7kLTLMd3hMC4o4UO6cltZAZBkZAZCQtUErX0ECI5yoSTORRuhTrKeVdaJfZARAQI1KmODktig9ZBCESaCbpAbtjXrJZCniEW2ZB5ZB3QAzODTXamqkUA8wnIda59ZAZBZCx';
  
  console.log('Querying Facebook accounts linked to this token...');
  try {
    const response = await axios.get(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
    
    if (response.data && response.data.data) {
      console.log('\n--- SUCCESS! ACCOUNTS FOUND ---');
      for (const account of response.data.data) {
        console.log(`Page Name: "${account.name}"`);
        console.log(`Page ID:   "${account.id}"`);
        console.log(`Page Access Token (NEVER EXPIRES):`);
        console.log(account.access_token);
        console.log('-----------------------------------\n');
      }
    } else {
      console.log('No accounts returned:', response.data);
    }
  } catch (error: any) {
    console.error('Failed to fetch accounts:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

main();
