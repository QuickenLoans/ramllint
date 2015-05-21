var assert = require('assert'),
    self = this,
    typeOf = require('../src/typeOf.js');

describe('Util - typeOf (replacement)', function () {
  it('should be an object', function () {
    assert.equal('function', typeof typeOf);
  });

  [
    [[],        'array'],
    [false,     'boolean'],
    [true,      'boolean'],
    [Error,     'function'],
    [Date,      'function'],
    [(function () {return this;}()),      'global'],
    [JSON,      'json'],
    [Math,      'math'],
    [42,        'number'],
    [Infinity,  'number'],
    [NaN,       'number'],
    [null,      'null'],
    [{},        'object'],
    [/e/,       'regexp'],
    ['',        'string'],
    [,          'undefined'],
    [void 0,    'undefined']
  ].forEach(function (config) {
    it('should detect ' + config[1], function () {
      // test that the correct type is returned
      assert.equal(config[1], typeOf(config[0]));

      // test that passing in the type to check against returns correct value
      assert(typeOf(config[0], config[1]));
    });
  });
});
