var colors = require('cli-color');

function reporter(print, level, log) {
  'use strict';

  var error = false,
      firstError = log.read()[0],
      STATUS;

  function entryFormat(entry) {
    var output;

    /* istanbul ignore else */
    if (!error && entry.level === 'error') {
      error = true;
    }

    output = '\n' +
      STATUS[entry.level](entry.level) + ' ' +
      entry.rule + '\n' +
      '  ' + colors.white(entry.message) +
      colors.blackBright(' [' + entry.code + ']') +
      (entry.hint ? colors.cyanBright('\nHINT:\n') + entry.hint : '');

    print(output);
  }

  STATUS = {
    'error': colors.redBright,
    'info': colors.cyanBright,
    'warning': colors.magentaBright
  };

  if (firstError && firstError.name === 'YAMLError') {
    print(colors.redBright('\nInvalid RAML file: parse error.'));
    print(firstError.toString());
  } else if (log.read(level).length === 0) {
    print(colors.green('\nLooking good; no error(s) found.'));
  } else {
    log.read(level)
      .forEach(entryFormat);

    /* istanbul ignore else */
    if (error) {
      throw new Error('RAMLLint reported errors');
    }
  }
}

module.exports = reporter;
