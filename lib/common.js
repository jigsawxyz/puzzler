const crypto = require('crypto');

function createMigrationHash(migrationFunctionSet) {
  const data = migrationFunctionSet.up.toString() + migrationFunctionSet.down.toString();
  return crypto.createHash('md5').update(data).digest('hex');
}

function parseTransactions({ transactions }) {
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
