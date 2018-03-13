const chai = require('chai');
const { common } = require('../lib');

chai.should();

describe('common', () => {
  describe('#createMigrationHash', () => {
    it('should return md5 of transaction set', () => {
     const transaction = { up: () => 'a', down: () => 'b' };
     common.createMigrationHash(transaction).should.equal('3003332b2bb04a6b2b8211b9b4e3f790');
    });
  });

  describe('#parseTransactions', () => {
    it('should return parsed transaction', () => {
      const transactions = { transaction1: { up: () => 'a', down: () => 'b' }};
      common.parseTransactions({ transactions }).should.eql([{
        up: transactions.transaction1.up,
        down: transactions.transaction1.down,
        meta: {
          name: 'transaction1',
          hash: '3003332b2bb04a6b2b8211b9b4e3f790'
        }
      }]);
    });
  });
});
