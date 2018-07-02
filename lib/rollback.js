const requireAll = require('require-all');
const Promise = require('bluebird');
const debug = require('debug')('puzzler');

const history = require('./history.js');
const common = require('./common.js');

function identifyPendingRollbacks({ state, transactions }) {
  debug('Identifying Pending Rollbacks');
  const appliedTransactions = history.parseHistory({ state });

  const pendingTransactions = [];
  const changedTransactions = [];


  appliedTransactions.filter(appliedTransaction => {
    const rollbackTransaction = transactions.find(transaction => transaction.meta.hash === appliedTransaction.migration_hash)
    if(rollbackTransaction) {
      // found down transaction pair
      debug(`Found Existing Down Migration:  ${transaction.meta.name}`);
      pendingTransactions.push(rollbackTransaction)
    } else {
      // no down for applied transaction
      debug(`Found New Down Migration:  ${transaction.meta.name}`);
      changedTransactions.push(appliedTransaction)
    }
  })

  if(changedTransactions.length > 0) {
    changedTransactions.map(transactions => console.log(`WARN: ${transactions.migration_name} has been changed. Rollback Skipped`)) 
  }
  return pendingTransactions;
}

function createRollbackSet({ state, transactionDir, partial }) {
  debug('Creating Rollback Set');
  const transactions = common.parseTransactions({ transactions: requireAll(transactionDir) });
  const pendingTransactions = identifyPendingRollbacks({ state, transactions });
  const rollbackSet = pendingTransactions
    .sort((a, b) => {
      let sortNum = 0;
      if (a.meta.name > b.meta.name) sortNum = -1;
      if (a.meta.name < b.meta.name) sortNum = 1;
      return sortNum;
    })
    .slice(0, partial > 0 ? partial : pendingTransactions.length);

    debug(`Rollback Set Created. (Size ${rollbackSet.length}): `);
    rollbackSet.forEach(transaction => debug(`Rollback: ${transaction.meta.name}`))
    return rollbackSet;
}

async function rollback({ transactionDir, pool, partial }) {
  try {
    const state = await history.getState({ pool });
    const rollbackSet = createRollbackSet({ state, transactionDir, partial });

    if (rollbackSet.length === 0) {
      console.log(`WARN: No Rollbacks To Run`);
      pool.destroy();
      process.exit(1);
    }
    await Promise.each(rollbackSet, async migration => {
      process.stdout.write(`Rolling Back migration: ${migration.meta.name}`);
      await migration.down(pool)
      await history.insertMigrationRecord({ migration, action: 'rollback', pool });
      process.stdout.write(" --> Done. \n");
    })
    console.log(`SUCCESS: ${rollbackSet.length} migrations rolled back`);
    pool.destroy();
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    process.exit(1);
  }
}

module.exports = rollback;
