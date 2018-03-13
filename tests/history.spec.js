const chai = require('chai');
const knex = require('knex');
const mockDb = require('mock-knex');
const { history } = require('../lib');

const tracker = mockDb.getTracker();
chai.should();

describe('history', () => {
  beforeEach(async () => {
    this.connectionPool = knex({ client: 'pg' });
    mockDb.mock(this.connectionPool);
  });

  describe('#createMigrationTable', () => {
    it('should not throw', () => {
      (() => history.createMigrationTable({ pool: this.connectionPool })).should.not.throw();
    });
  });

  describe('#getState', () => {
    beforeEach(async () => {
      await tracker.install();
      this.state = [{ id: 1 }];
    });

    afterEach(async () => {
      await tracker.uninstall();
    });

    it('should return state if table exists', async () => {
      tracker.on('query', query => query.response(this.state));
      const state = await history.getState({ pool: this.connectionPool });
      state.should.equal(this.state);
    });

    it('should create a new table if no table exists', async () => {
      let creationCheck;
      tracker.on('query', (query, step) => {
        [
          () => query.reject(new Error('Table does not exist')),
          () => { creationCheck = true; query.response(); }
        ][step - 1]();
      });
      await history.getState({ pool: this.connectionPool });
      creationCheck.should.equal(true);
    });

    it('should return empty state if new table', async () => {
      tracker.on('query', (query, step) => {
        [
          () => query.reject(new Error('Table does not exist')),
          () => query.response()
        ][step - 1]();
      });
      const state = await history.getState({ pool: this.connectionPool });
      state.should.eql([]);
    });
  });


  describe('#insertMigrationRecord', () => {
    beforeEach(async () => {
      await tracker.install();
    });

    afterEach(async () => {
      await tracker.uninstall();
    });

    it('should save a migration record', async () => {
      let querySave;
      tracker.on('query', query => {
        querySave = query;
        query.response({})
      });
      await history.insertMigrationRecord({ 
        pool: this.connectionPool, 
        action: 'migrate', 
        migration: { meta: { name: 'newMigration', hash: '124fewhjbfg' }} 
      });
      querySave.bindings[0].should.equal('migrate');
      querySave.bindings[1].should.equal('124fewhjbfg');
      querySave.bindings[2].should.equal('newMigration');
    });
  });

  describe('#parseHistory', () => {
    const migrate = { action: 'migrate', migration_hash: '123' };
    const rollback = { action: 'rollback', migration_hash: '123' };

    it('should return an empty array if no transactions', () => {
      history.parseHistory({ state: [] }).should.eql([]);
    });

    it('should return all applied transactions', () => {
      history.parseHistory({ state: [ migrate ] }).should.eql([migrate.migration_hash]);
    });

    it('should handle rollbacks', () => {
      history.parseHistory({ state: [ migrate, rollback ] }).should.eql([]);
    });

    it('should handle rollbacks and migrations', () => {
      history.parseHistory({ state: [ migrate, rollback, migrate ] }).should.eql([migrate.migration_hash]);
    });
  });
});
