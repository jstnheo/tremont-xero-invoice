const axios = require('axios');
const { getXeroAuthHeaders } = require('../lib/xeroAuth'); // ← here

async function upsertContact({ name, phone }) {
  const headers = await getXeroAuthHeaders();

  // Optional: check for existing contact
  const existing = await axios.get(
    `https://api.xero.com/api.xro/2.0/Contacts?where=Name=="${name}"`,
    { headers }
  );

  if (existing.data.Contacts.length > 0) {
    console.log(`✅ Found existing contact: ${name}`);
    return existing.data.Contacts[0];
  }

  const response = await axios.post(
    'https://api.xero.com/api.xro/2.0/Contacts',
    {
      Contacts: [
        {
          Name: name,
          Phones: phone
            ? [{ PhoneType: "MOBILE", PhoneNumber: phone }]
            : []
        }
      ]
    },
    { headers }
  );

  const contact = response.data.Contacts[0];
  console.log(`🆕 Created contact: ${name}`);
  return contact;
}

module.exports = { upsertContact };
