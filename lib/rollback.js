const requireAll = require('require-all');
const Promise = require('bluebird');

const history = require('./history.js');
const common = require('./common.js');

function identifyPendingRollbacks({ state, transactions }) {
  const appliedTransactions = history.parseHistory({ state });

  const pendingTransactions = [];
  const changedTransactions = [];

  
  appliedTransactions.filter(appliedTransaction => {
    const rollbackTransaction = transactions.find(transaction => transaction.meta.hash === appliedTransaction.migration_hash)
    if(rollbackTransaction) {
      // found down transaction pair
      pendingTransactions.push(rollbackTransaction)
    } else {
      // no down for applied transaction
      changedTransactions.push(appliedTransaction)
    }
  })

  if(changedTransactions.length > 0) {
    changedTransactions.map(transactions => console.log(`WARN: ${transactions.migration_name} has been changed. Rollback Skipped`)) 
  }
  return pendingTransactions;
}

function createRollbackSet({ state, transactionDir, partial }) {
  const transactions = common.parseTransactions({ transactions: requireAll(transactionDir) });
  const pendingTransactions = identifyPendingRollbacks({ state, transactions });
  return pendingTransactions
    .sort((a, b) => a.meta.name < b.meta.name)
    .slice(0, partial > 0 ? partial : pendingTransactions.length);
}

async function rollback({ transactionDir, pool, partial, log = false }) {
  try {
    const state = await history.getState({ pool });
    const migrationSet = createRollbackSet({ state, transactionDir, partial });
    await Promise.each(migrationSet, async migration => {
      process.stdout.write(`Rolling Back migration: ${migration.meta.name}`);
      await migration.down(pool)
      await history.insertMigrationRecord({ migration, action: 'rollback', pool });
      process.stdout.write(" --> Done. \n");
    })
    if (log) console.log(`SUCCESS: ${migrationSet.length} migrations rolled back`);
    pool.destroy();
  } catch (e) {
    if (log) console.log(`ERROR: ${e.message}`);
    process.exit(1);
  }
}

module.exports = rollback;
