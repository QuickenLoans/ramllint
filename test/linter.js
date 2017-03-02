var assert = require('assert'),
    fs = require('fs'),

    defaults = require('../src/defaults.json'),
    Linter = require('../src/linter.js'),

    failing,
    passing,

    ramllint = new Linter();

/* NOTE: these are in priority order of nesting within a RAML document */
failing = [
  'root',
  'resource',
  'method',
  'response'
].reduce(function (acc, sect, indx) {
  var list = defaults[sect].map(function (opt) {

    return opt.id;
  });

  // turn the above list, of strings, into objects with:
  //   - document contents available
  //   - list of sections to test for
  //   - expected number of errors (cumulative of previous sections)
  //   - name of the section for labeling test results
  acc.push({
    doc: fs.readFileSync('./test/samples/failing-$.raml'.replace('$', sect), 'utf8'),
    expected: (indx < 1 ? 0 : acc[indx - 1].expected) + list.length,
    list: list,
    name: sect
  });

  return acc;
}, []);

// this document will evolve as new rules are added but will always be valid.
passing = fs.readFileSync('./test/samples/passing.raml', 'utf8');

function hasError(haystack, needle) {
  var result;

  result = haystack
    .some(function (entry) {

      return entry.code === needle;
    });

  return result;
}

describe('RAML Linter - linter', function () {
  it('should be an object', function () {
    assert.equal('object', typeof ramllint);
  });

  it('should fail with parse_error', function () {
    // async
    return ramllint.lint('', function (log) {
      var result = log.read();

      assert.equal(result.length, 1);
      assert.equal(result[0].name, 'YAMLError');
    });
  });

  it('should pass on valid RAML', function (done) {
    // async
    ramllint.lint(passing, function (log) {
      try {
        assert.equal(log.read().length, 38);
        done();
      } catch (e) {
        //console.log(passing);
        done(e);
      }
    });
  });

  it('should provide hints', function (done) {
    var resource;

    resource = failing
      .filter(function (file) {

        return /resource/i.test(file.name);
      });

    try {
      // async
      ramllint.lint(resource[0].doc, function (results) {
        var hints;

        hints = results.read()
          .some(function (entry) {

            return entry.hint;
          });

        assert(hints, 'Some log entries should include hints.');
        done();
      });
    } catch (e) {
      done(e);
    }
  });

  it('should skip rules', function (done) {
    var myLinter = new Linter({api_version: false});

    myLinter.lint(passing, function (log) {
      try {
        assert.equal(log.read('error').length, 0);
        assert(hasError(log.read(), 'api_version'));
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  failing
    .forEach(function (section) {
      var doc = section.doc,
          expected = section.expected,
          list = section.list,
          name = section.name;

      it('should fail in ' + name, function (done) {
        ramllint.lint(doc, function (log) {
          var results;

          try {
            results = log.read();

            // 1. (positive) check that all defined rules for section are not passing
            list
              .forEach(function (rule) {
                assert(hasError(results, rule), 'The error log should include an error for: ' + rule);
              });

            // 2. (negative) check that no other errors are reported for section
            assert.equal(results.length, expected, 'Length of error report does not match expected length.');

            // 3. (negative) check that errors for previous sections are not reported

            done(); // async
          } catch (e) {
            console.log(doc);
            console.log(results);
            done(e); // this is stupid (node)assert/mochajs
          }
        });
      });
    });
});
