/**
 * daemonic.js
 * Daemons for node.
 * Copyright (c) 2012, Christopher Jeffrey
 */

/**
 * Daemonize
 */

function daemonize(opt, func) {
  if (opt.process) return daemonize.experimental(opt, func);

  var argv = process.argv.slice()
    , i;

  if (exports.daemon) return;

  i = process.argv.indexOf(exports.arg);
  if (~i) {
    process.argv.splice(i, 1);
    exports.daemon = true;
    return;
  }

  argv.push(exports.arg);

  var spawn = require('child_process').spawn
    , code = ''
    , ps;

  // escape arguments
  argv = argv.map(function(arg) {
    arg = arg.replace(/(["$\\])/g, '\\$1');
    return '"' + arg + '"';
  }).join(' ');

  if (opt.cd) code += 'cd / && ';
  if (opt.umask) code += 'umask 0 && ';

  code = '('
    + code
    + 'setsid '
    + argv
    + ' < /dev/null > /dev/null 2>&1 &)';

  ps = spawn('/bin/sh', [ '-c', code ]);

  ps.on('exit', function(code) {
    process.exit(code || 0);
  });

  // kill current stack
  process.once('uncaughtException', function() {});
  throw 'stop';
}

daemonize.experimental = function(opt, func) {
  var argv = opt.process || process.argv.slice()
    , i;

  if (!opt.process) {
    if (exports.daemon) return;

    i = process.argv.indexOf(exports.arg);
    if (~i) {
      process.argv.splice(i, 1);
      exports.daemon = true;
      return;
    }

    argv.push(exports.arg);
  }

  var spawn = require('child_process').spawn
    , code = ''
    , ps;

  // escape arguments
  argv = argv.map(function(arg) {
    arg = arg.replace(/(["$\\])/g, '\\$1');
    return '"' + arg + '"';
  }).join(' ');

  if (opt.cd) code += 'cd / && ';
  if (opt.umask) code += 'umask 0 && ';

  // dup2
  // should work...
  // e.g.
  // $ sh -c '(echo hi 1>&3 &)' 3>&1
  opt.stdin = opt.stdin != null
    ? ' 0 <& ' + opt.stdin
    : ' 0 < /dev/null';
  opt.stdout = opt.stdout != null
    ? ' 1 >& ' + opt.stdout
    : ' 1 > /dev/null';
  opt.stderr = opt.stderr != null
    ? ' 2 >& ' + opt.stderr
    : ' 2 > /dev/null';

  code = '('
    + code
    + 'setsid '
    + argv
    + opt.stdin
    + opt.stdout
    + opt.stderr
    + ' & echo $!)';

  ps = spawn('/bin/sh', [ '-c', code ]);

  if (opt.process) {
    // something like:
    //obj.stdin = createSocket(createPipe(), false);
    //obj.stdout = createSocket(createPipe(), true);
    //obj.stderr = createSocket(createPipe(), true);
    // use these fd's instea of raw fd's in options
    var pid = '';
    ps.stdout.on('data', function(data) {
      pid += data;
    });
    ps.on('error', func || function() {});
    ps.on('exit', function() {
      if (func) func(null, +pid);
    });
    return;
  }

  ps.on('exit', function(code) {
    process.exit(code || 0);
  });

  // kill current stack
  process.once('uncaughtException', function() {});
  throw 'stop';
};

/**
 * Daemonic
 */

function daemonic(opt, func) {
  if (process.platform === 'win32') return;

  var opt = opt || {}
    , options = opt.options;

  if (options && options.length) {
    var found = false
      , argv = process.argv
      , l = options.length
      , i = 0
      , j;

    for (; i < l; i++) {
      j = argv.indexOf(options[i]);
      if (~j) {
        argv.splice(j, 1);
        found = true;
      }
    }

    if (!found) return;
  }

  daemonize(opt, func);

  return daemonic;
}

/**
 * Expose
 */

exports = daemonic;
exports.argv = process.argv.slice();
exports.arg = '--__daemonized__';

module.exports = exports;
