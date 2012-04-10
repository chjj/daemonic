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
  if (daemonic.daemon) {
    console.log('My app is now daemonized. You won\'t see this message.');
  } else {
    console.log(
      'My app didn\'t want to be daemonized.',
      'You will see this message.');
  }
}, 2000);
```

``` js
// Daemonize a specified process.
// Does not kill (grand)parent.
require('daemonic')({
  process: ['node', './myotherapp.js'],
  umask: true,
  cd: true
}, function(err, pid) {
  console.log('Daemonized: ' + pid);
});
```

## License

Copyright (c) 2012, Christopher Jeffrey (MIT License).
