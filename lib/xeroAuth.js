require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN_ROW_ID = process.env.XERO_TOKEN_ROW_ID; // ← UUID from your xero_tokens table

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tenantId = process.env.XERO_TENANT_ID;
const clientId = process.env.XERO_CLIENT_ID;
const clientSecret = process.env.XERO_CLIENT_SECRET;

async function refreshTokensIfNeeded() {
  const { data: row, error } = await supabase
    .from('xero_tokens')
    .select('*')
    .eq('id', TOKEN_ROW_ID)
    .single();

  if (error || !row) {
    throw new Error(`❌ Failed to fetch tokens: ${error?.message || 'No row found'}`);
  }

  const now = Date.now();
  const expiry = new Date(row.token_expiry).getTime();

  if (row.access_token && now < expiry) {
    return row.access_token;
  }

  console.log('🔄 Refreshing Xero tokens...');
  console.log({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: row.refresh_token
  });

  try {
    const response = await axios.post(
      'https://identity.xero.com/connect/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: row.refresh_token,
        client_id: clientId,
        client_secret: clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const newAccessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;
    const newExpiry = new Date(Date.now() + 25 * 60 * 1000).toISOString(); // ~25 min from now

    const { error: updateError } = await supabase
      .from('xero_tokens')
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_expiry: newExpiry
      })
      .eq('id', TOKEN_ROW_ID);

    if (updateError) {
      throw new Error(`❌ Failed to update tokens: ${updateError.message}`);
    }

    console.log('✅ Xero tokens refreshed');
    return newAccessToken;
  } catch (err) {
    console.error('❌ Failed to refresh tokens:', err.response?.data || err.message);
    throw err;
  }
}

async function getXeroAuthHeaders() {
  const token = await refreshTokensIfNeeded();

  return {
    Authorization: `Bearer ${token}`,
    'Xero-tenant-id': tenantId,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

module.exports = { getXeroAuthHeaders };
