const requireAll = require('require-all');
const Promise = require('bluebird');
const debug = require('debug')('puzzler');

const history = require('./history.js');
const common = require('./common.js');

function identifyPendingMigrations({ state, transactions }) {
  debug('Identifying Pending Migrations');
  const appliedTransactions = history.parseHistory({ state }).map(transaction => transaction.migration_hash);
  return transactions.filter(transaction => !appliedTransactions.includes(transaction.meta.hash));
}

function createMigrationSet({ state, transactionDir, partial }) {
  debug('Creating Migration Set');
  const transactions = common.parseTransactions({ transactions: requireAll(transactionDir) });
  const pendingTransactions = identifyPendingMigrations({ state, transactions })
  const migrationSet = pendingTransactions
    .sort((a, b) => {
      let sortNum = 0;
      if (a.meta.name > b.meta.name) sortNum = 1;
      if (a.meta.name < b.meta.name) sortNum = -1;
      return sortNum;
    })
    .slice(0, partial > 0 ? partial : pendingTransactions.length);

    debug(`Migration Set Created. (Size ${migrationSet.length}): `);
    migrationSet.forEach(transaction => debug(`Migration: ${transaction.meta.name}`))
    return migrationSet;
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
