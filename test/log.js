var assert = require('assert'),
    Log = require('../src/log.js'),

    log = new Log();

describe('log', function () {
  it('should be an object', function () {
    assert.equal('object', typeof log);
  });

  it('should expose methods', function () {
    assert.equal('function', typeof log.error);
    assert.equal('function', typeof log.info);
    assert.equal('function', typeof log.warning);
  });

  it('should have an empty log to start', function () {
    assert.deepEqual([], log.read());
    assert.deepEqual([], log.read('error'));
    assert.deepEqual([], log.read('info'));
    assert.deepEqual([], log.read('warning'));
  });

  it('should empty the log', function () {
    assert.equal(log.read().length, 0);

    log.info('empty', 'fake', 'Helo', 'arg');

    assert.equal(log.read().length, 1);

    log.empty();

    assert.equal(log.read().length, 0);
  });

  beforeEach(function () {
    log = new Log();
  });

  function addEntries(count, level) {
    var result = [];

    while (count--) {
      log[level]('/endpoint', {id: 'fake_code'}, 'has ' + level, 'fake_entry');

      result.push({
        code: 'fake_code',
        hint: void 0,
        level: level,
        message: 'has ' + level,
        rule: 'fake_entry',
        section: '/endpoint'
      });
    }

    return result;
  }

  it('should capture errors in the log', function () {
    var actual = addEntries(4, 'error');

    assert.deepEqual(actual, log.read('error'));
    assert.deepEqual(actual, log.read());
  });

  it('should capture info in the log', function () {
    var actual = addEntries(4, 'info');

    assert.deepEqual(actual, log.read('info'));
  });

  it('should capture warnings in the log', function () {
    var actual = addEntries(4, 'warning');

    assert.deepEqual(actual, log.read('warning'));
  });

  it('should capture all levels of entries', function () {
    var actual;

    actual = []
      .concat(addEntries(4, 'error'))
      .concat(addEntries(4, 'info'))
      .concat(addEntries(4, 'warning'));

    assert.deepEqual(actual, log.read('error info warning'));
    assert.deepEqual(actual, log.read());
  });

  it('should only return desired levels', function () {
    var actual;

    actual = []
      .concat(addEntries(4, 'error'))
      .concat(addEntries(4, 'info'));

    addEntries(4, 'warning');

    assert.deepEqual(actual, log.read('error info'));
  });

  it('should only return desired levels', function () {
    var actual;

    actual = []
      .concat(addEntries(4, 'error'))
      .concat(addEntries(4, 'warning'));

    addEntries(4, 'info');

    assert.deepEqual(actual, log.read('error warning'));
  });

  it('should only return desired levels', function () {
    var actual;

    actual = []
      .concat(addEntries(4, 'info'))
      .concat(addEntries(4, 'warning'));

    addEntries(4, 'error');

    assert.deepEqual(actual, log.read('info warning'));
  });

  it('should provide a list of levels', function () {
    assert.deepEqual(['error', 'warning', 'info', 'success'], log.getLevels());
  });

  it('should throw errors when arguments are omitted', function () {
    assert.throws(function () {
      log.info();
    });
  });
});
