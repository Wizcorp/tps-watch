#!/usr/bin/env node

'use strict';

const fs = require('fs');
const glob = require('glob').sync;
const watch = require('../lib');

const argv = process.argv.slice(2);

const searchPath = argv.shift();
const notify = argv.includes('--notify');

const possiblePaths = [
    '/usr/local/bin/TexturePacker',
    '/Applications/TexturePacker.app/Contents/MacOS/TexturePacker'
];


let texturePackerPath;

for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
        texturePackerPath = possiblePath;
        break;
    }
}

if (!texturePackerPath) {
    console.error('Could not find TexturePacker executable.');
    console.error('');
    console.error('Looked in:');
    console.error(possiblePaths.join('\n'));
    process.exit(1);
}

watch(glob(searchPath + '/**/*.tps'), texturePackerPath, notify);
