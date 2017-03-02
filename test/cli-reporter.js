var assert = require('assert'),

    reporter = require('../src/cli-reporter.js'),

    W_HINT,
    WO_HINT;

W_HINT = entry();
WO_HINT = entry('error', 'section', {id: 'fake_id'}, 'message', 'locale');

function entry(level, section, rule, message, locale) {
  var result;

  rule = rule || ({
    hint: 'testing',
    id: 'fake_id'
  });

  result = {
    code: rule.id,
    level: level || 'error',
    message: message || 'message',
    rule: locale || 'locale',
    section: section || 'section'
  };

  if (rule.hint) {
    result.hint = rule.hint;
  }

  return result;
}

function reader(mock) {

  return {
      read: function read() {

        return mock;
      }
    };
}

describe('CLI - reporter', function () {
  var type = 'function';

  it('should be a ' + type, function () {
    assert.equal(type, typeof reporter);
  });

  it('should report all is well', function () {
    var output = [];

    reporter(output.push.bind(output), 'error', reader([]));

    assert.equal('\u001b[32m\nLooking good; no error(s) found.\u001b[39m', output[0]);
  });

  it('should report YAMLError', function () {
    var output = [];

    function YAMLError() {
      this.name = 'YAMLError';
    }

    reporter(output.push.bind(output), 'error', reader([new YAMLError()]));

    assert.equal('\u001b[91m\nInvalid RAML file: parse error.\u001b[39m', output[0]);
    assert.equal(2, output.length);
  });

  it('should report an error (with hint)', function () {
    var output = [];

    assert.throws(function () {
      reporter(output.push.bind(output), 'error', reader([W_HINT]));
    });

    assert.equal('\n\u001b[91merror\u001b[39m locale\n  \u001b[37mmessage\u001b[39m\u001b[90m [fake_id]\u001b[39m\u001b[96m\nHINT:\n\u001b[39mtesting', output[0]);
    assert.equal(1, output.length);
  });

  it('should report an error (without hint)', function () {
    var output = [];

    assert.throws(function () {
      reporter(output.push.bind(output), 'error', reader([WO_HINT]));
    });

    assert.equal('\n\u001b[91merror\u001b[39m locale\n  \u001b[37mmessage\u001b[39m\u001b[90m [fake_id]\u001b[39m', output[0]);
    assert.equal(1, output.length);
  });
});
