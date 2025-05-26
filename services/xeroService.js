const axios = require('axios');

const xeroHeaders = {
  Authorization: `Bearer ${process.env.XERO_ACCESS_TOKEN}`,
  'Xero-tenant-id': process.env.XERO_TENANT_ID,
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

// 1. Try to find the contact by name
async function findContactByName(name) {
  const res = await axios.get(
    `https://api.xero.com/api.xro/2.0/Contacts?where=Name=="${name}"`,
    { headers: xeroHeaders }
  );
  return res.data.Contacts?.[0];
}

// 2. Create the contact if it doesn't exist
async function createContact(name, email) {
  const res = await axios.post(
    `https://api.xero.com/api.xro/2.0/Contacts`,
    { Name: name, EmailAddress: email },
    { headers: xeroHeaders }
  );
  return res.data.Contacts[0];
}

// 3. Create the invoice
async function createInvoice(reservation) {
  let contact = await findContactByName(reservation.guest);

  if (!contact) {
    console.log("👤 Creating new contact...");
    contact = await createContact(reservation.guest, reservation.email);
  } else {
    console.log("✅ Found existing contact:", contact.Name);
  }

  const invoicePayload = {
    Type: "ACCREC",
    Contact: { ContactID: contact.ContactID },
    Date: new Date().toISOString(),
    DueDate: reservation.checkIn,
    LineItems: [
      {
        Description: `Stay from ${reservation.checkIn} to ${reservation.checkOut}`,
        Quantity: 1,
        UnitAmount: reservation.total,
        AccountCode: "200"
      }
    ],
    Status: "DRAFT",
    CurrencyCode: reservation.currency
  };

  const res = await axios.post(
    'https://api.xero.com/api.xro/2.0/Invoices',
    invoicePayload,
    { headers: xeroHeaders }
  );

  console.log("🧾 Invoice created for:", reservation.guest);
  console.log(res.data);
}

module.exports = { createInvoice };