require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tokenRowId = process.env.XERO_TOKEN_ROW_ID;

const tenantId = process.env.XERO_TENANT_ID;
const clientId = process.env.XERO_CLIENT_ID;
const clientSecret = process.env.XERO_CLIENT_SECRET;

let accessToken = null;
let refreshToken = null;
let tokenExpiry = 0;

async function loadTokensFromSupabase() {
  const { data, error } = await supabase
    .from('xero_tokens')
    .select('*')
    .eq('id', tokenRowId)
    .single();

  if (error) throw new Error(`❌ Failed to load tokens: ${error.message}`);

  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  tokenExpiry = new Date(data.token_expiry).getTime();
}

async function saveTokensToSupabase(accessToken, refreshToken, tokenExpiry) {
  const { error } = await supabase
    .from('xero_tokens')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expiry: new Date(tokenExpiry).toISOString()
    })
    .eq('id', tokenRowId);

  if (error) throw new Error(`❌ Failed to update tokens: ${error.message}`);
}

async function refreshTokensIfNeeded() {
  const now = Date.now();

  if (!accessToken || now >= tokenExpiry) {
    console.log('🔄 Refreshing Xero tokens...');
    await loadTokensFromSupabase();

    if (now >= tokenExpiry) {
      const response = await axios.post(
        'https://identity.xero.com/connect/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;
      tokenExpiry = Date.now() + 25 * 60 * 1000;

      await saveTokensToSupabase(accessToken, refreshToken, tokenExpiry);

      console.log('✅ Xero tokens refreshed');
    }
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