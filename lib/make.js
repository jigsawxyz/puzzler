const fs = require('fs');

const TEMPLATE_FILE = '/templateTransaction.js';

function make({ transactionDir, migrationName }) {
  try {
    const timestamp = Date.now();
    fs.copyFileSync(`${__dirname}/${TEMPLATE_FILE}`, `${transactionDir}/${timestamp}_${migrationName}.js`);
    console.log('SUCCESS: created migration');
    process.exit(0);
  } catch (e) {
    console.log(e);
    console.log('ERROR: unable to create migration');
    process.exit(1);
  }
}

module.exports = make;
