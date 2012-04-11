# Daemonic

A dead-simple module to daemonize your node process. No compilation required.

## Usage

``` js
// Daemonize current process.
require('daemonic')({
  umask: true,  // umask(0);
  cd: true      // chdir("/");
});

setInterval(function() {
  console.log('My app is now daemonized. You won\'t see this message.');
}, 2000);
```

``` js
// Daemonize current process, depending
// on whether certain options are present.
// Start with: $ myapp --daemonize

var daemonic = require('daemonic')({
  options: ['--daemonize', '--production'],
  umask: true,
  cd: true
});

setInterval(function() {
  if (daemonic.isDaemon) {
    console.log('My app is now daemonized. You won\'t see this message.');
  } else {
    console.log(
      'My app didn\'t want to be daemonized.',
      'You will see this message.');
  }
}, 2000);
```

``` js
// Fork a new daemonized process.
// Does not kill (grand)parent.
var fork = require('daemonic').fork;
var ps = fork('node', ['./app.js'], {
  umask: true,
  cwd: '/',
  customFds: [0, 1, 2],
  env: process.env
});
ps.on('open', function(pid) {
  console.log('Forked a new process: ' + pid);
});
```

## License

Copyright (c) 2012, Christopher Jeffrey (MIT License).
