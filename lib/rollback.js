const requireAll = require('require-all');
const Promise = require('bluebird');

const history = require('./history.js');
const common = require('./common.js');

function identifyPendingRollbacks({ state, transactions }) {
  const appliedTransactions = history.parseHistory({ state });
  return transactions.filter(transaction => appliedTransactions.includes(transaction.meta.hash));
}

function createRollbackSet({ state, transactionDir, partial }) {
  const transactions = common.parseTransactions({ transactions: requireAll(transactionDir) });
  const pendingTransactions = identifyPendingRollbacks({ state, transactions });
  return pendingTransactions
    .sort((a, b) => a.meta.name < b.meta.name)
    .slice(0, partial > 0 ? partial : pendingTransactions.length);
}

async function rollback({ transactionDir, pool, partial }) {
  try {
    const state = await history.getState({ pool });
    const migrationSet = createRollbackSet({ state, transactionDir, partial });
    await Promise.each(migrationSet, async migration => {
      await migration.down(pool)
      await history.insertMigrationRecord({ migration, action: 'rollback', pool });
    })
    console.log(`SUCCESS: ${migrationSet.length} migrations rolled back`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    process.exit(1);
  }
}

module.exports = rollback;
