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
  * @example
  * // using only default rule definitions
  * var basicLinter = new Linter();
  * @example
  * // passing in customizations
  * var myLinter = new Linter({api_version: false});
  */
function Linter(options) {
  var log = new Log(),
      rules = new Rules(log, options);

  /**
    * @callback LinterCallback
    * @description
    * The function to handle the results of linting the RAML document.
    * @arg {Log} log
    */

  /**
    * @description
    * Run all rules on the provided RAML document.
    * @arg {string} raml - the RAML document as a string or filepath.
    * @arg {LinterCallback} callback - the callback to receive the linting results.
    * @example
    * basicLinter.lint(myRAML, function (log) {
    *   // check log for errors
    *   if (log.read('error')) {
    *     // report errors
    *   }
    * });
    */
  this.lint = function lint(raml, callback) {
    log.empty();

    return parser
      .parse(raml)
      .then(lintRoot.bind(this, rules), log.raw)
      .finally(function resolve() {
        callback(log);
      });
  };
}

/* istanbul ignore else */
if (typeOf(exports, 'object')) {
  module.exports = Linter;
}
