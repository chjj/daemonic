# daemonic

Daemonizer for node.js.

## Usage

``` js
// Daemonize process based on args.
require('daemonic')({
  daemon: ['-d', '--daemonic']
});

// Daemonize process based on args (with extra node flags).
// Will exec new process to load node flags otherwise.
require('daemonic')({
  flags: ['--experimental-worker'],
  daemon: ['-d', '--daemonic']
});

// Always daemonize process (with extra node flags).
require('daemonic')({
  flags: ['--experimental-worker'],
  daemon: true
});
```

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

- Copyright (c) 2012-2019, Christopher Jeffrey (MIT License).

See LICENSE for more info.
