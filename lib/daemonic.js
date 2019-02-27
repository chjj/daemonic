/*!
 * daemonic.js - daemonizer for node.js
 * Copyright (c) 2012-2019, Christopher Jeffrey (MIT License).
 * https://github.com/chjj/daemonic
 */

'use strict';

const isDaemon = process.env.DAEMONIC_NODEJS === '1';

/*
 * API
 */

function daemonize(options) {
  const {spawn} = require('child_process');

  const ps = spawn(options.execPath, options.args, {
    stdio: 'ignore',
    detached: true,
    cwd: options.cwd,
    env: options.env
  });

  if (options.print)
    process.stdout.write(ps.pid + '\n');

  process.exit(0);
}

function reboot(options) {
  const {spawn} = require('child_process');

  const ps = spawn(options.execPath, options.args, {
    stdio: 'inherit',
    cwd: options.cwd,
    env: options.env
  });

  const onSighup = () => ps.kill('SIGHUP');
  const onSigint = () => ps.kill('SIGINT');
  const onSigterm = () => ps.kill('SIGTERM');

  process.once('SIGHUP', onSighup);
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  ps.on('exit', (code, signal) => {
    process.removeListener('SIGHUP', onSighup);
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);

    process.on('exit', () => {
      if (signal)
        process.kill(process.pid, signal);
      else
        process.exit(code);
    });
  });

  killStack();
}

function daemonic(opt) {
  if (!opt || !opt.force) {
    if (isDaemon)
      return;
  }

  const options = parseOptions(opt);

  if (options.daemon) {
    daemonize(options);
    return;
  }

  if (options.boot) {
    reboot(options);
    return;
  }
}

/*
 * Helpers
 */

function parseOptions(options) {
  if (options == null)
    options = true;

  if (typeof options === 'boolean'
      || typeof options === 'function'
      || Array.isArray(options)) {
    options = { daemon: options };
  }

  if (options == null || typeof options !== 'object')
    throw new TypeError('"options" must be an object.');

  if (options.execPath != null && typeof options.execPath !== 'string')
    throw new TypeError('"execPath" must be a string.');

  if (options.execArgv != null && !Array.isArray(options.execArgv))
    throw new TypeError('"execArgv" must be an array.');

  if (options.argv != null && !Array.isArray(options.argv))
    throw new TypeError('"argv" must be an array.');

  if (options.env != null && typeof options.env !== 'object')
    throw new TypeError('"env" must be a object.');

  if (options.flags != null && !Array.isArray(options.flags))
    throw new TypeError('"flags" must be an array.');

  if (options.file != null && typeof options.file !== 'string')
    throw new TypeError('"file" must be a string.');

  if (options.args != null && !Array.isArray(options.args))
    throw new TypeError('"args" must be an array.');

  if (options.cwd != null && typeof options.cwd !== 'string')
    throw new TypeError('"cwd" must be a string.');

  if (options.daemon != null) {
    if (typeof options.daemon !== 'function'
        && typeof options.daemon !== 'boolean'
        && !Array.isArray(options.daemon)) {
      throw new TypeError('"daemon" must be a boolean, function, or array.');
    }
  }

  if (options.boot != null && typeof options.boot !== 'boolean')
    throw new TypeError('"boot" must be a boolean.');

  if (options.print != null && typeof options.print !== 'boolean')
    throw new TypeError('"print" must be a boolean.');

  if (options.force != null && typeof options.force !== 'boolean')
    throw new TypeError('"force" must be a boolean.');

  let {
    execPath,
    execArgv,
    argv,
    env,
    flags,
    file,
    args,
    cwd,
    daemon,
    boot,
    print,
    force
  } = options;

  if (execPath == null)
    execPath = process.execPath || process.argv[0];

  if (execArgv == null)
    execArgv = process.execArgv || [];

  if (argv == null)
    argv = process.argv;

  if (env == null)
    env = {};

  if (flags == null)
    flags = [];

  if (daemon == null) {
    daemon = true;
  } else if (typeof daemon === 'function') {
    daemon = daemon();
  } else if (Array.isArray(daemon)) {
    const daemonArgs = daemon;
    const out = [];

    daemon = false;

    for (const arg of argv) {
      if (daemonArgs.includes(arg)) {
        daemon = true;
        continue;
      }

      out.push(arg);
    }

    argv = out;
  }

  if (file == null)
    file = argv[1];

  if (args == null)
    args = argv.slice(2);

  if (cwd == null)
    cwd = process.cwd();

  if (boot == null)
    boot = flags.length > 0;

  if (print == null)
    print = false;

  if (force == null)
    force = false;

  args = execArgv.concat(flags, file, args);

  env = Object.assign(Object.create(null), process.env, env, {
    DAEMONIC_NODEJS: '1'
  });

  return {
    execPath,
    execArgv,
    argv,
    env,
    flags,
    file,
    args,
    cwd,
    daemon,
    boot,
    print,
    force
  };
}

function killStack() {
  const obj = new Error('');

  process.on('uncaughtException', function onError(err) {
    if (err !== obj) {
      process.stderr.write('Fatal Error: daemonization failed.\n');
      process.stderr.write((err ? err.stack : err) + '\n');
      process.exit(1);
      return;
    }

    process.removeListener('uncaughtException', onError);
  });

  throw obj;
}

/*
 * Expose
 */

daemonic.main = !isDaemon;

module.exports = daemonic;
