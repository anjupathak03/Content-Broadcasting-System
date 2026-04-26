const { pool } = require('../src/config/db');

const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS || 60);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 2000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      console.log('Database is ready');
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.log(`Waiting for database (${attempt}/${maxAttempts}): ${error.message}`);
      await sleep(delayMs);
    }
  }
}

run()
  .catch((error) => {
    console.error('Database did not become ready:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
