const { upsertContact } = require('./lib/upsertContact');
const { createInvoice } = require('./lib/createInvoice');

const reservation = {
  guest: {
    first_name: "Myranda",
    last_name: "Libunao",
    phone_numbers: ["19512298857"]
  },
  check_in: "2025-07-05T15:00:00-07:00",
  check_out: "2025-07-07T11:00:00-07:00",
  code: "HMMHXEM9FN",
  nights: 2,
  properties: [
    {
        name: "Unit 2",
        tracking_option: "Unit 2" // ✅ Add this
    }
  ],
  financials: {
    host: {
      revenue: { amount: 60819 },
      host_fees: [
        { label: "Host Service Fee", amount: -1881 }
      ]
    },
    guest: {
      fees: [
        { label: "Cleaning Fee", amount: 16000 },
        { label: "Pet Fee", amount: 15000 }
      ]
    }
  }
};

(async () => {
  const fullName = `${reservation.guest.first_name} ${reservation.guest.last_name}`;
  const phone = reservation.guest.phone_numbers[0];

  const contact = await upsertContact({ name: fullName, phone });
  const invoice = await createInvoice(contact, reservation);
})();
