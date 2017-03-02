var assert = require('assert'),
    Log = require('../src/log.js'),
    Rules = require('../src/rules.js'),

    log = new Log(),
    config;

config = new Rules(log);

describe('RAML Linter - Rules', function () {
  it('should be an function', function () {
    assert.equal('function', typeof Rules);
  });

  it('should have an instance', function () {
    assert(config);
    assert.equal('object', typeof config);
  });

  it('should have functions', function () {
    assert.equal('function', typeof config.run);
  });

  it('should create isolated instances', function () {
    var custom = new Rules(log, {api_version: false}),
        standard = new Rules(log);

    assert.notDeepEqual(custom.rules, standard.rules);
  });
});
