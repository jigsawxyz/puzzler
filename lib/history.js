const debug = require('debug')('puzzler');

async function createMigrationTable({ pool }) {
  try {
    const data = await pool.schema.raw('CREATE TABLE "migrations" ("id" serial primary key, "action" text, "migration_name" text, "migration_hash" text, "occurred_at" timestamptz);');
    debug('Created Migration Table');
    return data;
  } catch (e) {
    debug('Failed To Create Migration Table');
    throw e;
  }
}

async function getState({ pool }) {
  try {
    debug('getting current migration state from db');
    return await pool.select('*').from('migrations');
  } catch (e) {
    debug('ERR: migration table does not exist. Creating...');
    await createMigrationTable({ pool });
    return [];
  }
}

async function insertMigrationRecord({ pool, action, migration }) {
  debug(`Inserting Migration Record For ${migration.meta.name}`);
  return pool('migrations').insert({
    action,
    migration_name: migration.meta.name,
    migration_hash: migration.meta.hash,
    occurred_at: new Date().toISOString()
  });
}

function parseHistory({ state }) {
  debug('Parsing History');
  const appliedTransactions = [];
  state.forEach((historicMigration) => {
    if (historicMigration.action === 'migrate') {
      appliedTransactions.push(historicMigration);
    } else if (historicMigration.action === 'rollback') {
      const index = appliedTransactions.findIndex(
        transaction => transaction.migration_hash === historicMigration.migration_hash
      );
      appliedTransactions.splice(index, 1);
    }
  });
  debug('Succesfully Parsed History. Current DB State:');
  appliedTransactions.forEach(transaction => debug(`Applied: ${transaction.migration_name}`))
  return appliedTransactions;
}


module.exports = {
  createMigrationTable,
  getState,
  insertMigrationRecord,
  parseHistory
};
