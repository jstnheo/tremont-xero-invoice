require('dotenv').config();
const axios = require('axios');
const { getXeroAuthHeaders } = require('../lib/xeroAuth'); // ← here

async function createInvoice(contact, reservation) {
  const { check_in, check_out, code, financials, nights, platform, properties } = reservation;

  const lineItems = [];

  // Property tracking (Unit 1, Unit 2, etc.)
  const propertyName = properties?.[0]?.name || null;
  const trackingOption = propertyName
    ? { Tracking: [{ Name: 'Property', Option: propertyName }] }
    : {};

  // 1. Accommodation
  if (financials?.host?.revenue?.amount) {
    lineItems.push({
      Description: `${nights || "X"} Night Stay`,
      Quantity: 1,
      UnitAmount: (financials.host.revenue.amount / 100).toFixed(2),
      AccountCode: "9124",
      ...trackingOption
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
      ...trackingOption
    });
  }

  // 3. Hosting Fee (Airbnb or VRBO)
  const hostServiceFee = financials?.host?.host_fees?.find(f =>
    f.label.toLowerCase().includes("host service")
  );
  if (hostServiceFee) {
    lineItems.push({
      Description: `${platform === 'vrbo' ? 'VRBO' : 'Airbnb'} Hosting Fee`,
      Quantity: 1,
      UnitAmount: ((Math.abs(hostServiceFee.amount) / 100) * -1).toFixed(2), // always negative
      AccountCode: platform === 'vrbo' ? '9128' : '9125',
      ...trackingOption
    });
  }

  // 4. Pet Fee
  const petFee = financials?.guest?.fees?.find(f =>
    f.label.toLowerCase().includes("pet")
  );
  if (petFee) {
    lineItems.push({
      Description: "Pet Fee",
      Quantity: 1,
      UnitAmount: (petFee.amount / 100).toFixed(2),
      AccountCode: "9127",
      ...trackingOption
    });
  }

  // 5. Discounts
  const discounts = financials?.host?.discounts || [];
  discounts.forEach(discount => {
    lineItems.push({
      Description: discount.label || "Discount",
      Quantity: 1,
      UnitAmount: ((discount.amount / 100) * -1).toFixed(2),
      AccountCode: "9126",
      ...trackingOption
    });
  });

  const invoiceData = {
    Invoices: [
      {
        Type: "ACCREC",
        Contact: { ContactID: contact.ContactID },
        Date: check_in.split("T")[0],
        DueDate: check_out.split("T")[0],
        LineItems: lineItems,
        Status: "DRAFT",
        Reference: `Reservation ${code}`,
        LineAmountTypes: "Exclusive"
      }
    ]
  };

  try {
    const headers = await getXeroAuthHeaders();

    const response = await axios.post(
      'https://api.xero.com/api.xro/2.0/Invoices',
      invoiceData,
      { headers }
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
