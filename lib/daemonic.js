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
  if (process.env.IS_DAEMONIC) {
    process.daemon = true;
    return this;
  }

  if (!checkOptions(opt)) return this;

  var opt = opt || {}
    , argv = process.argv.slice()
    , ps
    , i;

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
    , ps;

  var child = {
    __proto__: require('events').EventEmitter.prototype,
    kill: function(sig) {
      process.kill(this.pid, sig);
    },
    argv: argv,
    pid: -1
  };

  // Something like:
  // if (!opt.customFds || opt.customFds[0] === -1) {
  //   child.stdin = createSocket(createPipe(), false);
  //   child.stdout = createSocket(createPipe(), true);
  //   child.stderr = createSocket(createPipe(), true);
  //   opt.customFds = [
  //     child.stdin.fd,
  //     child.stdout.fd,
  //     child.stderr.fd
  //   ];
  // }

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
    child.pid = pid;
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

  // chdir
  opt.cd = opt.cd || opt.chdir
    ? 'cd / && '
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
  argv = argv.map(quote).join(' ');

  // dup2
  if (opt.customFds) {
    opt.stdin = opt.customFds[0];
    opt.stdout = opt.customFds[1];
    opt.stderr = opt.customFds[2];
  }

  opt.stdin = opt.stdin != null
    ? ' 0<& ' + opt.stdin
    : ' 0< /dev/null';
  opt.stdout = opt.stdout != null
    ? ' 1>& ' + opt.stdout
    : ' 1> /dev/null';
  opt.stderr = opt.stderr != null
    ? ' 2>& ' + opt.stderr
    : ' 2> /dev/null';

  // sh
  code = '('
    + opt.cd
    + opt.umask
    + 'IS_DAEMONIC=1 '
    + opt.setsid
    + argv
    + opt.stdin
    + opt.stdout
    + opt.stderr
    + ' & echo $!)';

  // fork
  ps = spawn('/bin/sh', [ '-c', code ], {
    setsid: false,
    customFds: [-1, -1, -1],
    cwd: opt.cwd || process.cwd(),
    env: opt.env || process.env
  });

  return ps;
}

function quote(arg) {
  return '"' + arg.replace(/(["$\\])/g, '\\$1') + '"';
}

function checkOptions(opt) {
  var options = opt && opt.options;
  if (!options || !options.length) {
    return true;
  }

  var l = options.length
    , i = 0;

  for (; i < l; i++) {
    if (~process.argv.indexOf(options[i])) return true;
  }
}

/**
 * Expose
 */

exports = daemonic;

module.exports = process.platform === 'win32'
  ? function() {}
  : exports;
