// scripts/syncEnvFromSupabase.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOKEN_ROW_ID = process.env.XERO_TOKEN_ROW_ID;

async function syncTokens() {
  const { data, error } = await supabase
    .from('xero_tokens')
    .select('*')
    .eq('id', TOKEN_ROW_ID)
    .single();

  if (error) {
    console.error('❌ Error fetching token row:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Paste these into your local .env file:\n');
  console.log(`XERO_ACCESS_TOKEN=${data.access_token}`);
  console.log(`XERO_REFRESH_TOKEN=${data.refresh_token}`);
  console.log(`XERO_TENANT_ID=${data.tenant_id}`);
}

syncTokens();
