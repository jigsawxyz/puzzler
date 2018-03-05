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

  });


  describe('#updateState', () => {

  });

  describe('#parseHistory', () => {

  });
});
