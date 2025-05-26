const { getXeroAuthHeaders } = require('../lib/xeroAuth');

(async () => {
  const headers = await getXeroAuthHeaders();
  console.log('✅ Refreshed headers:', headers.Authorization.slice(0, 50), '...');
})();