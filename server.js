require('dotenv').config();
const express = require('express');
const { createInvoice } = require('./services/xeroService');

const app = express();
app.use(express.json());

app.post('/new-booking', async (req, res) => {
  try {
    await createInvoice(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error creating invoice:", err);
    res.status(500).send("Invoice creation failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
});