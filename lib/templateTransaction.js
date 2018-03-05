module.exports = {
  up(pool) {
    // do something to make a change.
    return Promise.resolve(pool);
  },

  down(pool) {
    // do something to undo change above.
    return Promise.resolve(pool);
  }
};
