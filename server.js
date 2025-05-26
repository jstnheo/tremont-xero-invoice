require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Test route
app.get('/', (req, res) => {
  res.send('👋 Server is running');
});

// Webhook logging route
app.post('/log', (req, res) => {
  console.log('📦 Received reservation from Hospitable:\n', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on http://localhost:${PORT}`);
});
