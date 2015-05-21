#!/usr/bin/env node

var path = require('path'),

    cli = require('commander'),

    Linter = require('./linter.js'),
    project = require('../package.json'),
    reporter = require('./cli-reporter.js'),

    ramllinter = new Linter();

cli
  .option('-l, --level <level>', 'logging level: error|warning|info', 'error')
  .usage('[options] <api.raml>')
  .version(project.version)
  .parse(process.argv);

cli.args[0] = path.resolve(cli.args[0] || 'api.raml');

ramllinter.lint(cli.args[0], reporter.bind(null, console.log, cli.level));
