require('dotenv').config();
const axios = require('axios');

const { XERO_ACCESS_TOKEN, XERO_TENANT_ID } = process.env;

async function upsertContact({ name, phone }) {
  const [firstName, lastName] = name.split(' ');

  try {
    // 1. Search all contacts (optionally filter later)
    const res = await axios.get(
      'https://api.xero.com/api.xro/2.0/Contacts',
      {
        headers: {
          Authorization: `Bearer ${XERO_ACCESS_TOKEN}`,
          'Xero-tenant-id': XERO_TENANT_ID,
          Accept: 'application/json'
        }
      }
    );

    const allContacts = res.data.Contacts || [];

    // 2. Try to find by name + phone number
    let existing = allContacts.find(c =>
      c.FirstName?.toLowerCase() === firstName?.toLowerCase() &&
      c.LastName?.toLowerCase() === lastName?.toLowerCase() &&
      c.Phones?.some(p => p.PhoneNumber === phone)
    );

    if (existing) {
      console.log(`✅ Found existing contact: ${existing.Name}`);
      return existing;
    }

    // 3. Create contact with phone number
    const createRes = await axios.post(
      'https://api.xero.com/api.xro/2.0/Contacts',
      {
        Contacts: [
          {
            Name: name,
            FirstName: firstName,
            LastName: lastName,
            Phones: [
              {
                PhoneType: "MOBILE",
                PhoneNumber: phone
              }
            ]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${XERO_ACCESS_TOKEN}`,
          'Xero-tenant-id': XERO_TENANT_ID,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const created = createRes.data.Contacts?.[0];
    console.log(`🆕 Created contact: ${created.Name}`);
    return created;

  } catch (err) {
    console.error('❌ Failed to upsert contact:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { upsertContact };
