'use strict';

var parser = require('raml2obj'),

    // local libraries
    Log = require('./log.js'),
    Rules = require('./rules.js'),
    typeOf = require('./typeOf.js');

/**
  * @typedef {object} Options
  * @description
  * An object containing key/value pairs to configure the rules for the linter.
  * Three available value types are expected:
  *   - (string) - a regular expression to test against
  *   - (boolean) true - evaluates that the value is provided (any value)
  *   - (boolean) false - skips the rule validation; logs a `info` entry
  *   - (array) - a list of stings to check the value against; any match passes
  * @example
  * {
  *   "api_version": true,
  *   "base_uri": "^[a-z]+[_a-z]{3}$",
  *   "code_desc": false,
  *   "request_schema": [
  *     "application/json"
  *   ]
  * }
  */

/**
  * @private
  * @description
  * Flatten the context to reduce needless recursion overhead.
  * @arg {object} context - the context to extract the examples and schemas out of.
  */
function flattenExamplesAndSchemas(context) {
  context.examples = [];
  context.schemas = [];

  function flattener(mediatype) {
    /* istanbul ignore else */
    if (context.body[mediatype].example) {
      context.examples.push(mediatype);
    }

    /* istanbul ignore else */
    if (context.body[mediatype].schema) {
      context.schemas.push(mediatype);
    }
  }

  Object.keys(context.body || {})
    .forEach(flattener);
}

/**
  * @private
  * @description
  * Handle configuration and rule execution for the method section.
  * @arg {object} rules - instance of Rules containing default and custom rules.
  * @arg {string} lintContext - descriptive of where rules have not been followed.
  * @arg {object} context - current (method) object location within AST.
  */
function lintMethod(rules, lintContext, context) {
  context.lintContext = context.method.toUpperCase() + ' ' + lintContext;

  flattenExamplesAndSchemas(context);

  // evaluate all rules for this level of the AST
  rules.run('method', context);

  // attempt to recurse into the AST
  Object.keys(context.responses || {})
    .forEach(function eachMethod(code) {
      lintResponse(rules, context.lintContext, code, context.responses[code] || {});
    });
}

/**
  * @private
  * @description
  * Handle configuration and rule execution for the resource section.
  * @arg {object} rules - instance of Rules containing default and custom rules.
  * @arg {string} lintContext - descriptive of where rules have not been followed.
  * @arg {object} context - current (resource) object location within AST.
  */
function lintResource(rules, lintContext, context) {
  context.lintContext = lintContext + context.relativeUri;

  // evaluate all rules for this level of the AST
  rules.run('resource', context);

  // attempt to recurse into the AST
  (context.methods || [])
    .forEach(lintMethod.bind(this, rules, context.lintContext));

  // attempt to recurse into the AST
  (context.resources || [])
    .forEach(lintResource.bind(this, rules, context.lintContext));
}

/**
  * @private
  * @description
  * Handle configuration and rule execution for the response section.
  * @arg {object} rules - instance of Rules containing default and custom rules.
  * @arg {string} lintContext - descriptive of where rules have not been followed.
  * @arg {string} code - the response code of the current context.
  * @arg {object} context - current (response) object location within AST.
  */
function lintResponse(rules, lintContext, code, context) {
  context.code = code;
  context.lintContext = lintContext + ' ' + code;

  flattenExamplesAndSchemas(context);

  // evaluate all rules for this level of the AST
  rules.run('response', context);
}

/**
  * @private
  * @description
  * Handle configuration and rule execution for the root section.
  * @arg {object} rules - instance of Rules containing default and custom rules.
  * @arg {object} context - current (root) object location within AST.
  */
function lintRoot(rules, context) {
  // start the linting context string for better indication of where errors exist.
  context.lintContext = context.baseUri || 'no baseUri';
  context.resource = 'root';

  rules.run('root', context);

  (context.resources || [])
    .forEach(lintResource.bind(this, rules, context.lintContext));
}

/**
  * @constructor
  * @description
  * Creates a new instance with the given options; passed in options are merged
  * with defaults.
  * @arg {Options} options - configuration options from project based prefs file.
  * @example <caption>Using only default rule definitions</caption>
  * var basicLinter = new Linter();
  * @example <caption>Disable (skip) the <code>api_version</code> rule</caption>
  * var myLinter = new Linter({api_version: false});
  * @example <caption>Enable (default) the <code>api_version</code> rule</caption>
  * var myLinter = new Linter({api_version: true});
  * @example <caption>Change test regexp for the <code>url_lower</code> rule</caption>
  * var myLinter = new Linter({url_lower: "^\\/([a-z]+(-[a-z]+)*|{[a-z]+([A-Z][a-z]+)*})$"});
  * @example <caption>Add a new rule to the <code>resource</code> section</caption>
  * var myLinter = new Linter({
      resource: [{id:   'url_plural', prop: 'relativeUri',
      test: '[s}]$',
      text: 'RAML section ({section}) {property} violates: should be plural'
      }]});
  * @see {@link Rules#Rules} for more information
  */
function Linter(options) {
  var log = new Log(),
      rules = new Rules(log, options);

  /**
    * @callback LinterCallback
    * @description
    * The function to handle the results of linting the RAML document.
    * @arg {LogEntry[]} results
    */

  /**
    * @description
    * Run all rules on the provided RAML document.
    * @arg {string} raml - the RAML document as a string or filepath.
    * @arg {LinterCallback} callback - the callback to receive the linting results.
    * @example
    * basicLinter.lint(myRAML, function (results) {
    *   // check results for entries; if none, no errors were encountered
    * });
    */
  this.lint = function lint(raml, callback) {
    log.empty();

    // when the parser is done send back the log to indicate failure/success
    function resolve() {
      callback(log.read('error'));
    }

    return parser
      .parse(raml)
      .then(lintRoot.bind(this, rules), log.raw)
      .finally(resolve);
  };

  /**
    * @description
    * Provide a way to get all results in log; the callback in the {@link Linter#lint}
    * method only returns errors by default to be permissive of customizations.
    * @see {@link Log#read}
    * @example
    * // while this is possible, it is probably less helpful than the next example
    * myLinter.results(); // returns an array of all log entries collected
    * @example
    * myLingter.lint(myRAML, function () {
    *   // ignoring callback argument
    *
    *   // using the collection of all log entries for this round of linting
    *   myLinter.results(); // returns all log entries
    * });
    */
  this.results = log.read;
}

/* istanbul ignore else */
if (typeOf(exports, 'object')) {
  module.exports = Linter;
}
