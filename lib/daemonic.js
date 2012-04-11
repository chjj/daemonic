/**
 * Daemonic
 * Dead-simple daemonization for node.js.
 * Copyright (c) 2012, Christopher Jeffrey
 */

/**
 * Daemonic
 */

function daemonic() {
  return daemonic.daemonize.apply(daemonic, arguments);
}

/**
 * Daemonize
 */

daemonic.daemonize = function(opt, func) {
  if (badOptions(opt)) return;

  var opt = opt || {}
    , argv = process.argv.slice()
    , ps
    , i;

  if (exports.isDaemon) return;

  i = process.argv.indexOf(exports.arg);
  if (~i) {
    process.argv.splice(i, 1);
    exports.isDaemon = true;
    return;
  }

  argv.push(exports.arg);

  ps = fork(argv, opt);

  ps.on('exit', function(code) {
    process.exit(code || 0);
  });

  process.once('uncaughtException', function() {});
  throw 'stop';
};

/**
 * Fork
 */

daemonic.fork = function(name, argv, opt, func) {
  var opt = opt || {}
    , argv = [name].concat(argv)
    , func = func || function() {}
    , ps
    , i;

  ps = fork(argv, opt);

  ps.stdout.setEncoding('utf8');
  ps.stdout.on('data', function(data) {
    pid += data;
  });

  ps.on('error', func);
  ps.on('exit', function() {
    pid = +pid;
    if (!isFinite(pid)) pid = -1;
    func(null, pid);
  });
};

/**
 * Helpers
 */

function fork(argv, opt) {
  var opt = opt || {}
    , spawn = require('child_process').spawn
    , code = ''
    , ps;

  // env
  opt.env = opt.env
    ? env(opt.env)
    : '';

  // chdir
  opt.cd = opt.cd || opt.chdir
    ? 'cd / && '
    : '';

  // cwd
  opt.cwd = opt.cwd
    ? 'cd "' + opt.cwd.replace(/(["$\\])/g, '\\$1') + '" && '
    : '';

  // umask
  opt.umask = opt.umask
    ? 'umask 0 && '
    : '';

  // setsid
  opt.setsid = opt.setsid !== false
    ? 'setsid '
    : '';

  // escape arguments
  argv = argv.map(function(arg) {
    arg = arg.replace(/(["$\\])/g, '\\$1');
    return '"' + arg + '"';
  }).join(' ');

  // dup2
  if (opt.customFds) {
    opt.stdin = opt.customFds[0];
    opt.stdout = opt.customFds[1];
    opt.stderr = opt.customFds[2];
  }

  opt.stdin = opt.stdin != null
    ? ' 0 <& ' + opt.stdin
    : ' 0 < /dev/null';
  opt.stdout = opt.stdout != null
    ? ' 1 >& ' + opt.stdout
    : ' 1 > /dev/null';
  opt.stderr = opt.stderr != null
    ? ' 2 >& ' + opt.stderr
    : ' 2 > /dev/null';

  // sh
  code = '('
    + opt.cd
    + opt.cwd
    + opt.umask
    + opt.env
    + opt.setsid
    + argv
    + opt.stdin
    + opt.stdout
    + opt.stderr
    + ' & echo $!)';

  // fork
  ps = spawn('/bin/sh', [ '-c', code ]);

  return ps;
}

function env(env) {
  if (!env) return '';
  var out = [];
  Object.keys(env).forEach(function(key) {
    var val = env[key].replace(/(["$\\])/g, '\\$1');
    out.push(key + '="' + val + '"');
  });
  return 'env - ' + out.join(' ');
}

function badOptions(opt) {
  var options = opt && opt.options;

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
  }

  return !found;
}

/**
 * Expose
 */

// expose
exports = daemonic;

// backup origina argv
exports.argv = process.argv.slice();

// daemon notification argument
exports.arg = '--__daemonized__';

// whether the process is daemonized
exports.isDaemon = false;

// ignore windows
module.exports = process.platform === 'win32'
  ? function() {}
  : exports;
