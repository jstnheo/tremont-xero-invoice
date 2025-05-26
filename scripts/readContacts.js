require('dotenv').config();
const axios = require('axios');

const { XERO_ACCESS_TOKEN, XERO_TENANT_ID } = process.env;

async function readContacts() {
  try {
    const response = await axios.get(
      'https://api.xero.com/api.xro/2.0/Contacts',
      {
        headers: {
          Authorization: `Bearer ${XERO_ACCESS_TOKEN}`,
          'Xero-tenant-id': XERO_TENANT_ID,
          Accept: 'application/json'
        }
      }
    );

    const contacts = response.data.Contacts;
    console.log(`✅ Found ${contacts.length} contacts:\n`);

    contacts.forEach((c, i) => {
      console.log(`${i + 1}. ${c.Name} (${c.ContactID}) - ${c.EmailAddress}`);
    });

  } catch (error) {
    console.error('❌ Error fetching contacts:', error.response?.data || error.message);
  }
}

readContacts();