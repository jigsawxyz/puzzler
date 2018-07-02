const crypto = require('crypto');
const debug = require('debug')('puzzler');

function createMigrationHash(migrationFunctionSet) {
  const data = migrationFunctionSet.up.toString() + migrationFunctionSet.down.toString();
  const hash = crypto.createHash('md5').update(data).digest('hex');
  debug(`hashed ${data.slice(5, 5)}... to hash ${hash}`);
  return hash;

}

function parseTransactions({ transactions }) {
  debug(`parsing ${transactions.length} transactions`);
  return Object.keys(transactions).map(transaction => ({
    up: transactions[transaction].up,
    down: transactions[transaction].down,
    meta: {
      name: transaction,
      hash: createMigrationHash(transactions[transaction])
    }
  }));
}

module.exports = {
  parseTransactions,
  createMigrationHash
};
