require('dotenv').config();
const axios = require('axios');
const readline = require('readline-sync');
const open = (...args) => import('open').then(m => m.default(...args));

const client_id = process.env.XERO_CLIENT_ID;
const client_secret = process.env.XERO_CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000/callback';

const scopes = [
  'openid',
  'profile',
  'email',
  'accounting.transactions',
  'accounting.contacts',
  'offline_access'
].join(' ');

const authUrl = `https://login.xero.com/identity/connect/authorize` +
  `?response_type=code` +
  `&client_id=${client_id}` +
  `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
  `&scope=${encodeURIComponent(scopes)}` +
  `&state=123`;

console.log('👉 Opening browser for authorization...\n');
open(authUrl);

const authCode = readline.question('\n📋 Paste the code from the redirect URL (code=...): ').trim();

async function exchangeToken() {
  try {
    const response = await axios.post(
      'https://identity.xero.com/connect/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri,
        client_id,
        client_secret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('\n✅ Raw token response from Xero:\n');
    console.log(response.data);

    const access_token = response.data.access_token;
    const refresh_token = response.data.refresh_token;

    const tenantResponse = await axios.get('https://api.xero.com/connections', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const tenant_id = tenantResponse.data[0]?.tenantId;

    console.log('\n✅ Add these to your .env file:\n');
    console.log(`XERO_ACCESS_TOKEN=${access_token}`);
    console.log(`XERO_REFRESH_TOKEN=${refresh_token}`);
    console.log(`XERO_TENANT_ID=${tenant_id}`);

  } catch (error) {
    console.error('\n❌ Error exchanging token:\n');
    console.error(error.response?.data || error.message);
  }
}

exchangeToken();
