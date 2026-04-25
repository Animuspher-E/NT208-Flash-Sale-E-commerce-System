const { PayOS } = require("@payos/node");

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "your-client-id",
  apiKey: process.env.PAYOS_API_KEY || "your-api-key",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "your-checksum-key"
});

module.exports = payos;
