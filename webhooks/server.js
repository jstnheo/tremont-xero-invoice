require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { upsertContact } = require('../lib/upsertContact');
const { createInvoice } = require('../lib/createInvoice');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Optional GET for debugging ngrok connectivity
app.get('/', (req, res) => {
  console.log('🌐 Received GET request');
  res.status(200).send('👍 Webhook server is up and reachable');
});

app.post('/', async (req, res) => {
  console.log('📨 Received POST webhook');

  const { action, data } = req.body;

  if (action !== 'reservation.created') {
    console.log(`⏭️ Ignored action: ${action}`);
    return res.status(204).end();
  }

  try {
    const reservation = data;

    // Construct contact details
    const fullName = `${reservation.guest.first_name} ${reservation.guest.last_name}`;
    const phone = reservation.guest.phone_numbers?.[0] || '';

    const contact = await upsertContact({ name: fullName, phone });

    // Add tracking name (Unit 1 / Unit 2 / Unit 5)
    if (reservation.properties?.[0]) {
      reservation.properties[0].tracking_option = reservation.properties[0].name;
    }

    await createInvoice(contact, reservation);

    console.log(`✅ Invoice created for ${contact.Name}`);
    res.status(200).send('Invoice created');
  } catch (err) {
    console.error('❌ Error handling webhook:', err.response?.data || err.message);
    res.status(500).send('Internal error');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on http://localhost:${PORT}`);
});
