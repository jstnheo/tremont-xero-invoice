require('dotenv').config();
const axios = require('axios');
const { getXeroAuthHeaders } = require('../lib/xeroAuth');

async function readContacts() {
  try {
    const headers = await getXeroAuthHeaders();

    const response = await axios.get(
      'https://api.xero.com/api.xro/2.0/Contacts',
      { headers }
    );

    const contacts = response.data.Contacts;
    console.log(`✅ Found ${contacts.length} contacts`);
    contacts.forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.Name} (${contact.ContactID})`);
    });
  } catch (err) {
    console.error('❌ Error fetching contacts:', err.response?.data || err.message);
  }
}

readContacts();