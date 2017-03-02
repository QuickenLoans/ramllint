'use strict';

var typeOf = require('./typeOf.js');

// filter based on level
function filterEntries(level, entry) {

  return level.indexOf(entry.level) !== -1;
}

// bind level methods for instances
function instanceLevelMethods(addEntry, name) {
  /* jshint validthis:true */
  this[name] = addEntry.bind(null, name);
}

/**
  * @private
  * @description
  * check for argument definition
  * @arg {mixed} arg - any argument value
  * @returns {boolean} whether the argument was defined as anything.
  */
function isDef(arg) {

  return arg !== null && arg !== undefined;
}

/**
  * @constructor
  * @description
  * Creates a new instance for logging linting problems.
  * @example
  * var logger = new Log();
  * logger.error('root', 'api_version', 'RAML document must provide api_version', 'RAML');
  * logger.read(); // returns an array of all logged entries
  */
function Log() {
  var stack;

  /**
    * @typedef {object} LogEntry
    * @prop {string} code - the unique identifier for the rule
    * @prop {string} level - the level of error: `error`, `warning`, or `info`
    * @prop {string} message - the "helpful" message to indicate the problem
    * @prop {string} locale - the resource location within the RAML document
    * @prop {string} section - the section "type" within the AST
    */

  /**
    * @protected
    * @description
    * Primary method for logging, made available as instance methods named for
    * the levels of logging available; those methods have the first argument
    * provided automatically.
    * @arg {string} level - automatically provided, will never be passed by user
    * @arg {string} section - the section within the document entry originated
    * @arg {string} code - uniquge identifier of the rule for the entry
    * @arg {string} message - the (possibly) helpful message to the user
    * @arg {string} locale - the helper string to identify where in the RAML doc
    * @throws {MissingArgumentException} If any argument is not provided
    * @example
    * myLogger.error('resource', 'resource_desc', 'need a description', 'GET http://example.com/resource');
    * @example
    * myLogger.warning('resource', 'resource_desc', 'need a description', 'GET http://example.com/resource');
    * @example
    * myLogger.info('resource', 'resource_desc', 'need a description', 'GET http://example.com/resource');
    * @example
    * myLogger.success('resource', 'resource_desc', 'need a description', 'GET http://example.com/resource');
    */
  function addEntry(level, section, rule, message, locale) {
    if ([section, rule, message, locale].every(isDef)) {
      stack
        .push({
          code: rule.id,
          hint: rule.hint,
          level: level,
          message: message,
          rule: locale,
          section: section
        });
    } else {
      throw new Error('Missing arguments calling log.$().'.replace('$', level));
    }
  }

  /**
    * @function error
    * @memberOf Log
    * @instance
    * @description
    * Instance method for logging `error` level entries; calls {@link Log~addEntry}
    * with first argument satisfied, and passing along addition arguments.
    * @see {@link Log~addEntry}
    */

  /**
    * @function warning
    * @memberOf Log
    * @instance
    * @description
    * Instance method for logging `warning` level entries; calls {@link Log~addEntry}
    * with first argument satisfied, and passing along addition arguments.
    * @see {@link Log~addEntry}
    */

  /**
    * @function info
    * @memberOf Log
    * @instance
    * @description
    * Instance method for logging `info` level entries; calls {@link Log~addEntry}
    * with first argument satisfied, and passing along addition arguments.
    * @see {@link Log~addEntry}
    */

  /**
    * @function success
    * @memberOf Log
    * @instance
    * @description
    * Instance method for logging `success` level entries; calls {@link Log~addEntry}
    * with first argument satisfied, and passing along addition arguments.
    * @see {@link Log~addEntry}
    */
  // add methods to public-facing api for each of these
  this.getLevels()
    .forEach(instanceLevelMethods.bind(this, addEntry));

  /**
    * @description
    * For use when logging information that will be helpful in debugging but will
    * not necessarily be able to give additional information that the normal log
    * methods require.
    * @arg {any} obj - any object to put into the log
    */
  this.raw = function logRaw(obj) {
    stack.push(obj);
  };

  /**
    * @description
    * Reset the list, of entries, to an empty array.
    */
  this.empty = function emptyStack() {
    stack = [];
  };

  /**
    * @description
    * Retrieve the entries; for the level indicated, or all of them.
    * @arg {string} [level] - if provided, only include entries that match
    * @returns {LogEntry[]} An array of {@link LogEntry}
    */
  this.read = function readLog(level) {

    return !level ? stack : (stack
      .filter(filterEntries.bind(null, level)));
  };

  this.empty();
}

/**
  * @description
  * This function provided to supply an order list of logging levels in descending
  * order of severity. This will allow the ability to retrieve log entries based
  * on criteria more complex than a simple string match; 'filter the log for entries
  * (greater|lesser) than (or equal to) a given level'.
  * @returns {array} a list of all logging levels; in descending order of severity
  * @example
  * // this is the constructor (function); not an instance of it
  * Log.getLevels(); // returns ['error', 'warning', 'info', 'success']
  */
Log.getLevels = function getLevels() {

  return ['error', 'warning', 'info', 'success'];
};

/**
  * @see {@link Log.getLevels}
  * @example
  * myLoggerInstance.getLevels(); // returns ['error', 'warning', 'info', 'success']
  */
Log.prototype.getLevels = Log.getLevels;

/* istanbul ignore else */
if (typeOf(exports, 'object')) {
  module.exports = Log;
}
