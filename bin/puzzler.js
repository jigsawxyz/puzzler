#! /usr/bin/env node
const commandLineArgs = require('command-line-args');
const knex = require('knex');
const path = require('path');
const { migrate, rollback, make } = require('../index');

const optionDefinitions = [
  { name: 'action', type: String, defaultOption: true, description: 'action to take' },
  { name: 'transactionDir', type: String, alias: 't', description: 'directory containing transactions', defaultValue: `${__dirname}/transactions` },
  { name: 'migrationName', type: String, alias: 'n', description: 'name of new migration', defaultValue: 'migration' },
  { name: 'partial', type: Number, alias: 'p', description: 'number of transactions to partially action', defaultValue: 0 },
  { name: 'config', type: String, alias: 'c', description: 'Path to config file', defaultValue: null }
];

function validateOptions(options) {
  if(!options.action) {
    console.log(`ERROR: action ${options.action} is not supported.`);
    process.exit(1);
  }

  if(options.action === 'migrate' || options.action === 'rollback') {
    if(!options.transactionDir || !options.config) {
      console.log(`ERROR: TransactionDir and ConfigFile must be specified for migrations.`);
      process.exit(1);
    }
    try {
      options.config = require(`${process.cwd()}/${options.config}`);
      options.transactionDir = `${process.cwd()}/${options.transactionDir}`;
    } catch (e) {
      console.log(e);
      console.log(`ERROR: ConfigFile not found.`);
      process.exit(1);
    }
  }
  return options;
}

function createPool(config) {
  return knex({
    client: 'pg',
    version: '0.0',
    connection: {
      user: config.database.user,
      password: config.database.password,
      host: config.database.host,
      database: config.database.name,
      port: config.database.port
    },
    pool: config.database.pool_size || { min: 0, max: 1 }
  });
}

// driver function which runs when file is executed directly:
if (require.main === module) {
  const options = commandLineArgs(optionDefinitions);
  const validatedOptions = validateOptions(options);

  switch (options.action) {
    case 'migrate':
      migrate({
        transactionDir: options.transactionDir,
        pool: createPool(validatedOptions.config),
        partial: options.partial
      });
      break;
    case 'rollback':
      rollback({
        transactionDir: options.transactionDir,
        pool: createPool(validatedOptions.config),
        partial: options.partial
      });
      break;
    case 'make':
      make({
        transactionDir: options.transactionDir,
        migrationName: options.migrationName
      });
      break;
    default:
      console.log(`ERROR: action ${options.action} is not supported.`);
      process.exit(1);
  }
}

