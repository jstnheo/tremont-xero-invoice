require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { upsertContact } = require('../lib/upsertContact');
const { createInvoice } = require('../lib/createInvoice');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 🔌 Connect to Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🪵 Log webhook to Supabase
async function logWebhook(payload) {
  const { error } = await supabase.from('webhook_logs').insert([
    {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'webhook',
      payload
    }
  ]);
  if (error) console.error('❌ Failed to log webhook:', error.message);
  else console.log('📦 Webhook payload logged to Supabase');
}

// 📨 Handle webhook from Hospitable
app.post('/', async (req, res) => {
  console.log('📨 Received POST webhook');

  const reservation = req.body?.data;
  if (!reservation) {
    console.error('❌ No reservation data in webhook');
    return res.status(400).send('Invalid payload');
  }

  // 🪵 Log raw webhook for debugging
  await logWebhook(req.body);

  try {
    const fullName = `${reservation.guest.first_name} ${reservation.guest.last_name}`;
    const phone = reservation.guest.phone_numbers?.[0] || null;

    const contact = await upsertContact({ name: fullName, phone });
    await createInvoice(contact, reservation);

    res.status(200).send('✅ Invoice created');
  } catch (err) {
    console.error('❌ Error handling webhook:', err.response?.data || err.message);
    res.status(500).send('Internal error');
  }
});

// 🌐 Catch-all for browser ping/health checks
app.use((req, res) => {
  console.log(`🌐 Received ${req.method} ${req.url}`);
  res.status(200).send('Webhook server is running.');
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on http://localhost:${PORT}`);
});
