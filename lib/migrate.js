const requireAll = require('require-all');
const Promise = require('bluebird');

const history = require('./history.js');
const common = require('./common.js');

function identifyPendingMigrations({ state, transactions }) {
  const appliedTransactions = history.parseHistory({ state }).map(transaction => transaction.migration_hash);
  return transactions.filter(transaction => !appliedTransactions.includes(transaction.meta.hash));
}

function createMigrationSet({ state, transactionDir, partial }) {
  const transactions = common.parseTransactions({ transactions: requireAll(transactionDir) });
  const pendingTransactions = identifyPendingMigrations({ state, transactions });
  return pendingTransactions
    .sort((a, b) => a.meta.name > b.meta.name)
    .slice(0, partial > 0 ? partial : pendingTransactions.length);
}

async function migrate({ transactionDir, pool, partial, log=false }) {
  try {
    const state = await history.getState({ pool });
    const migrationSet = createMigrationSet({ state, transactionDir, partial });
    await Promise.each(migrationSet, async migration => {
      process.stdout.write(`Running migration: ${migration.meta.name}`);
      await migration.up(pool)
      await history.insertMigrationRecord({ migration, action: 'migrate', pool });
      process.stdout.write(" --> Done. \n");
    })
    if (log) console.log(`SUCCESS: ${migrationSet.length} migrations carried out`);
    pool.destroy();
  } catch (e) {
    if (log) console.log(`ERROR: ${e.message}`);
    process.exit(1);
  }
}

module.exports = migrate;
