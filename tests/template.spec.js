const chai = require('chai');
const { template } = require('../lib');

chai.should();

describe('template', () => {
  it('should expose an async up method', () => {
    (async () => await template.up()).should.not.throw;
  })

  it('should expose an async down method', () => {
    (async () => await template.down()).should.not.throw;
  });
});
