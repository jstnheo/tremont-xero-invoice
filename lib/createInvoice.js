require('dotenv').config();
const axios = require('axios');

const { XERO_ACCESS_TOKEN, XERO_TENANT_ID } = process.env;

// This should match your Xero tracking category name exactly.
const TRACKING_CATEGORY_NAME = "Property";

async function createInvoice(contact, reservation) {
  const { check_in, check_out, code, financials, nights, properties } = reservation;

  const trackingOptionName = properties?.[0]?.name; // e.g., "Unit 1", "Unit 2"
  const trackingCategory = trackingOptionName
    ? [
        {
          Name: TRACKING_CATEGORY_NAME,
          Option: trackingOptionName,
        },
      ]
    : [];

  const lineItems = [];

  // 1. Accommodation
  if (financials?.host?.revenue?.amount) {
    lineItems.push({
      Description: `${nights} Night Stay`,
      Quantity: 1,
      UnitAmount: (financials.host.revenue.amount / 100).toFixed(2),
      AccountCode: "9124",
      Tracking: trackingCategory,
    });
  }

  // 2. Cleaning Fee
  const cleaningFee = financials?.guest?.fees?.find(f => f.label === "Cleaning Fee");
  if (cleaningFee) {
    lineItems.push({
      Description: "Cleaning Fee",
      Quantity: 1,
      UnitAmount: (cleaningFee.amount / 100).toFixed(2),
      AccountCode: "4300",
      Tracking: trackingCategory,
    });
  }

  // 3. Airbnb Hosting Fee (make negative)
  const airbnbFee = financials?.host?.host_fees?.find(f => f.label === "Host Service Fee");
  if (airbnbFee) {
    lineItems.push({
      Description: "Airbnb Hosting Fee",
      Quantity: 1,
      UnitAmount: ((airbnbFee.amount / 100) * -1).toFixed(2),
      AccountCode: "9125",
      Tracking: trackingCategory,
    });
  }

  // 4. Pet Fee
  const petFee = financials?.guest?.fees?.find(f => f.label.toLowerCase().includes("pet"));
  if (petFee) {
    lineItems.push({
      Description: "Pet Fee",
      Quantity: 1,
      UnitAmount: (petFee.amount / 100).toFixed(2),
      AccountCode: "9127",
      Tracking: trackingCategory,
    });
  }

  const invoiceData = {
    Invoices: [
      {
        Type: "ACCREC",
        Contact: { ContactID: contact.ContactID },
        Date: check_in.split("T")[0],
        DueDate: check_out.split("T")[0], // Use checkout date as due date
        LineItems: lineItems,
        Status: "DRAFT",
        Reference: `Reservation ${code}`,
        LineAmountTypes: "Exclusive",
      },
    ],
  };

  try {
    const response = await axios.post(
      'https://api.xero.com/api.xro/2.0/Invoices',
      invoiceData,
      {
        headers: {
          Authorization: `Bearer ${XERO_ACCESS_TOKEN}`,
          'Xero-tenant-id': XERO_TENANT_ID,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    const invoice = response.data.Invoices?.[0];
    console.log(`✅ Created invoice ${invoice.InvoiceNumber} for ${contact.Name}`);
    return invoice;
  } catch (err) {
    console.error('❌ Failed to create invoice:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { createInvoice };
