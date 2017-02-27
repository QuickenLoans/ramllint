var assert = require('assert'),
    Log = require('../src/log.js'),
    Rules = require('../src/rules.js'),

    log = new Log(),
    config;

config = new Rules(log);

describe('Rules', function () {
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

  it('should accept a custom set of rules', function () {
    var custom = new Rules(log, {
      resource: [{
        id: 'url_plural',
        prop: 'relativeUri',
        test: '[s}]$',
        text: 'RAML section ({section}) {property} violates: should be plural'
      }]
    });

    assert.notDeepEqual(custom.rules, config.rules);
    assert.equal('url_plural', custom.rules.resource[custom.rules.resource.length - 1].id);
  });

  it('should replace a default rule with a custom rule of the same section and id', function () {
    var rules = {
        resource: [{
          hint: '/income-tax-documents (good)\n/incomeTaxDocuments (bad)\n/Income_Tax_Documents (bad)',
          id: 'url_lower',
          prop: 'relativeUri',
          test: '^\\/([a-z]+(-[a-z]+)*|{[a-z]+([A-Z][a-z]+)*})$',
          text: 'RAML section ({section}) {property} violates: only lowercase letters and dashes allowed. URI Params must be camel cased.'
        }]
      },
      custom2 = new Rules(log, rules),
      ruleIdx = 1;

    assert.notDeepEqual(custom2.rules, config.rules);
    assert.equal(config.rules.resource.length, custom2.rules.resource.length);
    ruleIdx = config.rules.resource.reduce(function (foundIdx, rule, index) {
      if (rule.id === 'url_lower') {
        foundIdx = index;
      }
      return foundIdx;
    });
    assert.deepEqual(rules.resource[0], custom2.rules.resource[ruleIdx]);
  });

});
