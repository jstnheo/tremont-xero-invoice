require('dotenv').config();
const axios = require('axios');

async function refreshAccessToken() {
  try {
    const res = await axios.post(
      'https://identity.xero.com/connect/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.XERO_REFRESH_TOKEN,
        client_id: process.env.XERO_CLIENT_ID,
        client_secret: process.env.XERO_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token } = res.data;

    console.log('✅ New access token:');
    console.log(`XERO_ACCESS_TOKEN=${access_token}`);
    console.log('\n🔁 Updated refresh token:');
    console.log(`XERO_REFRESH_TOKEN=${refresh_token}`);

    console.log(`\n📝 Paste these into your .env file!`);
  } catch (err) {
    console.error('❌ Token refresh failed:', err.response?.data || err.message);
  }
}

refreshAccessToken();
