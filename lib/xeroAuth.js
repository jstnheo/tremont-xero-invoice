const axios = require('axios');

// Load once from .env
const tenantId = process.env.XERO_TENANT_ID;
const clientId = process.env.XERO_CLIENT_ID;
const clientSecret = process.env.XERO_CLIENT_SECRET;

let accessToken = process.env.XERO_ACCESS_TOKEN;
let refreshToken = process.env.XERO_REFRESH_TOKEN;
let tokenExpiry = 0;

async function refreshTokensIfNeeded() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) {
    return;
  }

  console.log('🔄 Refreshing Xero tokens...');

  try {
    console.log({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    });

    const response = await axios.post(
      'https://identity.xero.com/connect/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    tokenExpiry = Date.now() + 25 * 60 * 1000;

    console.log('✅ Xero tokens refreshed');
  } catch (err) {
    console.error('❌ Failed to refresh tokens:', err.response?.data || err.message);
    throw err;
  }
}

async function getXeroAuthHeaders() {
  await refreshTokensIfNeeded();

  return {
    Authorization: `Bearer ${accessToken}`,
    'Xero-tenant-id': tenantId,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

module.exports = { getXeroAuthHeaders };