require('dotenv').config();

const { upsertContact } = require('../lib/upsertContact');

(async () => {
  try {
    const contact = await upsertContact({
      name: "Test Contact",
      phone: "1234567890"
    });

    console.log("✅ Created or found contact:");
    console.log(contact);
  } catch (err) {
    console.error("❌ Failed to upsert contact:", err.response?.data || err.message);
  }
})();