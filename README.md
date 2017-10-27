# tps-watch

TexturePacker .tps-file watcher that autogenerates spritesheets when source files change

## Installation

```sh
npm install tps-watch --save
```

Or globally:

```sh
npm install tps-watch --global
```

## Requirements

To use this, you must have purchased and installed TexturePacker Pro, which enables the command line interface.

## Usage

As a binary:

```sh
tps-watch ./folder/containing/tpsfiles --notify
```

As a library:

```js
const watch = require('tps-watch');

const tpsFiles = ['./foo/bar/mySpritesheet.tps'];
const texturePackerPath = '/usr/local/bin/TexturePacker';
const notify = true;

watch(tpsFiles, texturePackerPath, notify);
```

Turning on `notify` will use [node-notifier](https://www.npmjs.com/package/node-notifier) to show a notification every
time a spritesheet has been recreated.

## License

[MIT](./LICENSE)
