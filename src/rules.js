'use strict';

var defaults = require('./defaults.json'),
    typeOf = require('./typeOf.js'),

    ruleTypes;

/**
  * @typedef {object} Context
  * @description
  * A node from within the AST of a RAML document provided by the raml2obj library.
  * Since all nodes within the AST are not the same the properties available are
  * variable but are consistent with sections of the AST; `resource`s should be
  * consistent with other `resource`s, but a `response` would not necessarily be
  * consistent with any other section context and vice-versa.
  * @property {string} lintContext
  * a progressively expressive identifier for where in the RAML the current
  * context is; used for log entries for helpful reporting
  */

/**
  * @typedef {object} Rule
  * @description
  * An object defining the default structure of a Rule.
  * @property {string} id - unique identifier name for the rule
  * @property {object} prereq - collection of named prerequisite(s) based on properties
  * @property {string} prop - the name of the property in the AST to validate
  * @property {(array|boolean|string)} test
  * Explanation of possible values:
  *   - (array) A list of valid - string - values
  *   - (boolean) `false` indicates a skipped test
  *   - (boolean) `true` validates any value
  *   - (string) A string, that will be passed to RegExp()
  */

/**
  * @typedef {string} Section
  * @description
  * The location within the AST. The possible values are:
  *   + root
  *   + resource
  *   + method
  *   + response
  */

/**
  * @private
  * @description
  * Collection of rule-type functions
  * @arg {mixed} test - rule test configuration
  * @arg {mixed} value - the value from the AST
  * @returns {boolean} whether or not the value satisfiest the test
  */
ruleTypes = {
  'array': function execArray(test, value) {
    function every(expected) {

      return value.indexOf(expected) >= 0;
    }

    return typeOf(value, 'array') ? test.every(every) : test.indexOf(value) >= 0;
  },
  'boolean': function execBoolean(test, value) {

    return !!value;
  },
  'regexp': function execRegExp(test, value) {

    return test.test(value);
  }
};

/**
  * @private
  * @description
  * Format a message for log entry.
  * @arg {string} section - indicates the section of the RAML document
  * @arg {object} rule - an Options entry including: id, and prop
  * @returns {string} a log entry string
  */
function format(section, rule) {
  var result;

  result = (rule.text || 'RAML section - {section} - must include: {property}')
    .replace(/{section}/, section)
    .replace(/{property}/, rule.prop);

  return result;
}

/**
  * @private
  * @description
  * Merge custom options with defaults; used in Array.map().
  * @arg {Options} options - default override options
  * @arg {object} rule - instance within defaults
  * @returns {object} A copy of the default rule customized optionally.
  */
function mapRules(options, rule) {
  var custom;

  if (options && rule.id in options) {
    custom = JSON.parse(JSON.stringify(rule));
    custom.test = options[rule.id];
  } else {
    custom = rule;
  }

  if (typeOf(custom.test, 'string')) {
    custom.test = new RegExp(custom.test);
  }

  return custom;
}

/**
  * @private
  * @description
  * Merge full rules in options into rules list; used in Array.map().
  * @arg {Options} options - default override options
  * @arg {object} allRules - instance with rules by section as in defaults.json
  * @arg {String} section - section to merge from options into allRules
  * @returns {object} allRules updated with full rules merged from options in section.
  */
function mergeSectionWithOptions(options, allRules, section) {
  allRules[section] = options[section].reduce(function merge(rules, newRule) {
    rules[rules.reduce(function findRuleById(foundIdx, checkRule, idx) {
        return (checkRule.id === newRule.id) ? idx : foundIdx;
      }, rules.length)] = newRule;

    return rules;
  }, allRules[section]);
  return allRules;
}

/**
  * @private
  * @description
  * Check the type of test and run.
  * @arg {mixed} test - value of the test prop in rules
  * @arg {mixed} value - value from the AST
  * @returns {boolean} whether or not the value satisfies the test
  */
function passes(test, value) {
  var type = typeOf(test);

  return type in ruleTypes && ruleTypes[type](test, value);
}

/**
  * @private
  * @description
  * Check for prerequisite test(s) or regular test.
  * @arg {object} rule - instance within options object
  * @arg {Context} context - object from within AST
  * @returns {boolean} whether or not the context satisfies the rule
  */
function passing(rule, context) {
  var result;

  if (rule.prereq) {
    result = Object.keys(rule.prereq)
      .reduce(function prereqReduce(acc, key) {
        if (acc && passes(rule.prereq[key], context[key])) {
          acc = passes(rule.test, context[rule.prop]);
        }

        return acc;
      }, true);
  } else {
    result = passes(rule.test, context[rule.prop]);
  }

  return result;
}

/**
  * @constructor
  * @description
  * Create an object holding all rules and provides the capability to run them
  * against contexts of an AST.
  * @arg {Log} logger - an instance of Log to keep track of entries
  * @arg {Options} options - external customization of rules
  */
function Rules(logger, options) {
  this.rules = Object.keys(defaults)
    .reduce(function sections(full, section) {
      full[section] = defaults[section]
        .map(mapRules.bind(null, options));

      return full;
    }, {});

  if (options) {
    this.rules = Object.keys(options)
      .filter(function isDefaultSection(section) { return section in defaults; })
      .reduce(mergeSectionWithOptions.bind(null, options), this.rules);
  }

  this.logger = logger;
}

/**
  * @description
  * Instance method to execute rules per section.
  * @arg {Section} section - the name of the section to run rules against
  * @arg {Context} context - the context to run rules against
  */
Rules.prototype.run = function runRules(section, context) {
  // locals here, to prevent the need to #bind() the function in the forEach
  var logger = this.logger;

  function eachRule(rule) {
    if (rule.test === false) {
      logger.info(section, rule, 'skipped ' + format(context.resource, rule), context.lintContext);
    } else {
      if (!passing(rule, context)) {
        logger.error(section, rule, format(section, rule), context.lintContext);
      }
    }
  }

  this.rules[section]
    .forEach(eachRule);
};

/* istanbul ignore else */
if (typeOf(exports, 'object')) {
  module.exports = Rules;
}
