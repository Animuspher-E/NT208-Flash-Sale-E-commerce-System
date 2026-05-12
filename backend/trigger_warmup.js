
const { warmUpCache } = require('./src/services/cache.service');

async function main() {
  try {
    await warmUpCache();
    console.log('Warm-up successful!');
    process.exit(0);
  } catch (err) {
    console.error('Warm-up failed:', err);
    process.exit(1);
  }
}

main();
