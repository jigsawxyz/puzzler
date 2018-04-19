async function createMigrationTable({ pool }) {
  return pool.schema.raw('CREATE TABLE "migrations" ("id" serial primary key, "action" text, "migration_name" text, "migration_hash" text, "occurred_at" timestamptz);');
}

async function getState({ pool }) {
  try {
    return await pool.select('*').from('migrations');
  } catch (e) {
    await createMigrationTable({ pool });
    return [];
  }
}

async function insertMigrationRecord({ pool, action, migration }) {
  return pool('migrations').insert({
    action,
    migration_name: migration.meta.name,
    migration_hash: migration.meta.hash,
    occurred_at: new Date().toISOString()
  });
}

function parseHistory({ state }) {
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
  return appliedTransactions;
}


module.exports = {
  createMigrationTable,
  getState,
  insertMigrationRecord,
  parseHistory
};
