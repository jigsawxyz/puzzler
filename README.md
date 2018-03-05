# Puzzler By Jigsaw

Puzzler is a low configuration, stateful migration manager for Node.js.

## Installation

`npm install @spokedev/puzzler --save-dev`;

## Core Terminology

Transaction => A single up/down pair of actions to take.   
Migrate => Run a set of up transactions.   
Rollback => Run a set of down transactions.   

## Configuration

Puzzler expects database credentials to be provided via config file:

config.js:
```js
module.exports = {
  database: {
    name: 'database name',
    host: 'localhost',
    port: 26257,
    user: 'root',
    password: 'unsecurepassword',
    pool_size: { min: 0, max: 1 }
  }
};
```

## State Management

Puzzler will create a migrations history table in your db which contains the history of every migration carried out. This is used to track the current state of the db, and ensure the correct migrations are carried out. 

## API
Puzzler supports three actions. 

### Make

Creates a new template migration file in target directory, with given name.   

`./node_modules/bin/puzzler make --transactionDir=<transactionDir> --migrationName=addClientTable`

[REQUIRED] transactionDir => The location to put the new transaction template.    
[OPTIONAL] migrationName => The name to give to the new transaction. Defaults to migration.    

### Migrate

Carries out up migrations in timestamp order.    

`./node_modules/bin/puzzler migrate --transactionDir=<transactionDir> --config=config.js --partial=1`

[REQUIRED] transactionDir => The location to source transactions from.     
[REQUIRED] config => The location of config file (see Configuration).   
[OPTIONAL] partial => Option to carry out a specified number of up transactions. 

### Rollback

Carries out down rollbacks in timestamp order.    

`./node_modules/bin/puzzler rollback --transactionDir=<transactionDir> --config=config.js --partial=1`

[REQUIRED] transactionDir => The location to source transactions from.     
[REQUIRED] config => The location of config file (see Configuration).   
[OPTIONAL] partial => Option to carry out a specified number of up transactions. 