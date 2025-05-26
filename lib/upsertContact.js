require('dotenv').config();
const axios = require('axios');

const { XERO_ACCESS_TOKEN, XERO_TENANT_ID } = process.env;

async function upsertContact({ name, email }) {
  try {
    // 1. Search for contacts by email address
    const searchUrl = `https://api.xero.com/api.xro/2.0/Contacts?emailAddress=${encodeURIComponent(email)}`;
    const searchRes = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${XERO_ACCESS_TOKEN}`,
        'Xero-tenant-id': XERO_TENANT_ID,
        Accept: 'application/json'
      }
    });

    const candidates = searchRes.data.Contacts || [];

    // 🔍 Step 1: Try matching by email
    let existing = candidates.find(c =>
      c.EmailAddress?.toLowerCase() === email.toLowerCase()
    );

    // 🔁 Step 2: If no email match, try matching by First + Last name
    if (!existing && name) {
      const [firstName, lastName] = name.split(' ');
      existing = candidates.find(c =>
        c.FirstName?.toLowerCase() === firstName?.toLowerCase() &&
        c.LastName?.toLowerCase() === lastName?.toLowerCase()
      );
    }

    if (existing) {
      console.log(`✅ Found existing contact: ${existing.Name}`);
      return existing;
    }

    // 3. Create new contact if none matched
    const createRes = await axios.post(
      'https://api.xero.com/api.xro/2.0/Contacts',
      {
        Contacts: [
          {
            Name: name,
            EmailAddress: email
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
