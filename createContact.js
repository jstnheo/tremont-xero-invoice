require('dotenv').config();
const axios = require('axios');

const { XERO_ACCESS_TOKEN, XERO_TENANT_ID } = process.env;

// Replace this with your real guest data
const contact = {
  Name: "Codie Heo",
  FirstName: "Codie",
  LastName: "Heo",
  EmailAddress: "codie@example.com"
};

async function createContact(contactData) {
  try {
    const response = await axios.post(
      'https://api.xero.com/api.xro/2.0/Contacts',
      { Contacts: [contactData] },
      {
        headers: {
          Authorization: `Bearer ${XERO_ACCESS_TOKEN}`,
          'Xero-tenant-id': XERO_TENANT_ID,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const created = response.data.Contacts?.[0];
    console.log(`✅ Created contact: ${created.Name} (${created.ContactID})`);
  } catch (err) {
    console.error('❌ Error creating contact:', err.response?.data || err.message);
  }
}

createContact(contact);
