[![Build Status](https://travis-ci.org/QuickenLoans/ramllint.svg)](https://travis-ci.org/QuickenLoans/ramllint)
[![Coverage Status](https://coveralls.io/repos/QuickenLoans/ramllint/badge.svg?branch=master)](https://coveralls.io/r/QuickenLoans/ramllint?branch=master)
[![Codacy Badge](https://www.codacy.com/project/badge/48c42e8f334e4dd9b3bccb96c3559f48)](https://www.codacy.com/app/QuickenLoans/ramllint)
[![Code Climate](https://codeclimate.com/github/QuickenLoans/ramllint/badges/gpa.svg)](https://codeclimate.com/github/QuickenLoans/ramllint)
[![Dependency Status](https://img.shields.io/david/QuickenLoans/ramllint.svg?style=flat-rounded)](https://david-dm.org/QuickenLoans/ramllint)
[![License Type](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Join the chat at https://gitter.im/QuickenLoans/ramllint](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/QuickenLoans/ramllint?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


[![NPM](https://nodei.co/npm/ramllint.png)](https://npmjs.org/package/ramllint)

[RAML](http://raml.org) is a language for modeling RESTful APIs. By design,
it does not enforce any style rules on how to consistently document APIs,
because not all projects will require the same level of rule enforcement.
However, it can often be useful to enforce uniform rules and standards across a
group of related APIs to ensure consistency and uniformity across multiple teams
or business units.

RAML Linter is a static analysis, [linter-like](http://en.wikipedia.org/wiki/Lint_%28software%29),
utility that will enforce rules on a given RAML document, ensuring
consistency and quality.

## Installing

[![Join the chat at https://gitter.im/QuickenLoans/ramllint](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/QuickenLoans/ramllint?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

````
npm install -g ramllint
````

## Using the Linter

RAML Linter can be used either as a library or as a command line utility.

### Library

Using the library in code provides the most flexibility, offering error
handling and the ability to parse the full results for: `error`, `warning`, and
`info` log entries.

```js
var Linter = require('ramllint'),

    ramllint = new Linter();

ramllint.lint('./path/to/api.raml', function (results) {
   // NOTE: results will only contain 'error' and will exclude 'warning' and 'info'
   // to get an array of all log entries use: `ramllint.results()`

  if (!results.length) {
    // no errors, all rules are satisfied
  } else {
    // errors
  }
});
```

#### Rules

The default rules are included in the `src/defaults.json` file. You can make adjustments to the test used in the rule by passing options to the `Linter` constructor.

For example, if you'd like to change the rules for URL validation to permit `/sticky-wickets` and `/{stickyWicketId}`, you can do this:

```js
var Linter = require('ramllint'),
    options = {
        'url_lower': '^\\/([a-z]+(-[a-z]+)*|{[a-z]+([A-Z][a-z]+)*})$'
    },
    ramllint = new Linter(options);
```

Options need to be a JSON object with keys that match an id from the `defaults.json` file and values that are strings or string RegExp patterns.

### Command Line

If you are in the same directory as your RAML document:

```
ramllint
```

If your RAML document is in another directory:

```
ramllint path/to/api.raml
```

*Note: specifying the file (second example above) might be necessary for some OSes.*

## (`npm`) Scripts

Below is a list of commands available via `npm run` for you convenience:

  + `npm run cover` *for TravisCI only*
  + `npm run doc`
    1. Remove the `docs/` directory to start clean
    2. Generate documentation pages ([JSDoc](https://github.com/jsdoc3/jsdoc)) in `docs/`
    3. Create code coverage report ([Istanbul](https://github.com/gotwarlost/istanbul)) `docs/coverage/lcov-report/`
    4. Create code statistics report ([Plato](https://github.com/es-analysis/plato)) `docs/coverage/`
  + `npm run doc:pub` *for publishing `docs/` to gh-pages*
  + `npm run lint` - static code analysis and code style linting
    1. [JShint](https://github.com/jshint/jshint)
    2. [ESlint](https://github.com/eslint/eslint)
  + `npm run quality` - runs `lint` and code coverage
  + `npm test` - runs unit tests ([Mocha](https://github.com/mochajs/mocha))
  + `npm run watch` - watches `test/` and `src/` for changes and re-runs tests

## Documentation

  1. [Code Documentation](http://QuickenLoans.github.io/ramllint/)
  2. [Code Coverage Report](http://QuickenLoans.github.io/ramllint/coverage/lcov-report/)
  3. [Static Code Analysis](http://QuickenLoans.github.io/ramllint/stats/)

## Contributing

  1. Fork this repository
  2. `git clone`
  3. `npm install`
  4. Create a working branch
  5. Write code and tests
  6. Submit Pull Request

This project aims to maintain a high level of unit test code coverage. All pull
requests must be accompanied by appropriate test cases, and all tests must pass
in order to be considered for merge.

For detailed rules on contributions, please refer to our
[contribution guidelines](CONTRIBUTING.md).
