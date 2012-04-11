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

daemonic.daemonize = function(opt) {
  if (!checkOptions(opt)) return exports;

  var opt = opt || {}
    , argv = process.argv.slice()
    , ps
    , i;

  if (exports.daemon) return exports;

  i = process.argv.indexOf(exports.arg);
  if (~i) {
    process.argv.splice(i, 1);
    exports.daemon = true;
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
  if (arguments.length <= 2) {
    func = arguments[1];
    opt = arguments[0];
    argv = opt.argv.slice(1);
    name = opt.argv[0];
  }

  var opt = opt || {}
    , argv = [name].concat(argv || [])
    , pid = ''
    , ps
    , i;

  var child = {
    __proto__: require('events').EventEmitter.prototype,
    get pid() { return pid; },
    argv: argv
    // Something like:
    // if (!opt.customFds)
    // stdin: createSocket(createPipe(), false),
    // stdout: createSocket(createPipe(), true),
    // stderr: createSocket(createPipe(), true)
  };

  ps = fork(argv, opt);

  ps.stdout.setEncoding('utf8');
  ps.stdout.on('data', function(data) {
    pid += data;
  });

  ps.on('error', function(err) {
    if (func) func(err);
    child.emit('error', err);
  });

  ps.on('exit', function() {
    pid = +pid;
    if (!isFinite(pid)) pid = -1;
    if (func) func(null, pid);
    child.emit('open', pid);
  });

  return child;
};

/**
 * Alias
 */

daemonic.spawn = daemonic.fork;

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
    ? 'env - ' + env(opt.env) + ' '
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
  var keys = Object.keys(env)
    , l = keys.length
    , i = 0
    , out = []
    , key
    , val;

  for (; i < l; i++) {
    key = keys[i];
    val = env[key].replace(/(["$\\])/g, '\\$1');
    out.push(key + '="' + val + '"');
  }

  return out.join(' ');
}

function checkOptions(opt) {
  var options = opt && opt.options;
  if (!options || !options.length) {
    return true;
  }

  var found
    , l = options.length
    , i = 0
    , j;

  for (; i < l; i++) {
    j = process.argv.indexOf(options[i]);
    if (j !== -1) {
      process.argv.splice(j, 1);
      found = true;
    }
  }

  return found;
}

/**
 * Expose
 */

// expose
exports = daemonic;

// backup origina argv
exports.argv = process.argv.slice();

// daemon notification argument
exports.arg = '--daemonized__daemonic';

// whether the process is daemonized
exports.daemon = false;

// ignore windows
module.exports = process.platform === 'win32'
  ? function() {}
  : exports;
