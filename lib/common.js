const crypto = require('crypto');
const debug = require('debug')('puzzler');

function createMigrationHash(migrationFunctionSet, name) {
  const data = migrationFunctionSet.up.toString() + migrationFunctionSet.down.toString();
  const hash = crypto.createHash('md5').update(data).digest('hex');
  debug(`hashed ${name} to hash ${hash}`);
  return hash;

}

function parseTransactions({ transactions }) {
  debug(`parsing ${Object.keys(transactions).length} transactions`);
  return Object.keys(transactions).map(transaction => ({
    up: transactions[transaction].up,
    down: transactions[transaction].down,
    meta: {
      name: transaction,
      hash: createMigrationHash(transactions[transaction], transaction)
    }
  }));
}

module.exports = {
  parseTransactions,
  createMigrationHash
};
