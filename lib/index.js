#!/usr/bin/env node

'use strict';

const parseXml = require('xml-parser');
const fs = require('fs');
const spawn = require('child_process').spawn;
const resolvePath = require('path').resolve;
const relativePath = require('path').relative;
const dirname = require('path').dirname;
const notifier = require('node-notifier');

const EXEC_DELAY = 1000; // msec


function parseSourcePathsFromXml(tpsFile) {
    const tpsFolder = dirname(tpsFile);

    const { root, children } = parseXml(fs.readFileSync(tpsFile, { encoding: 'utf8' }));
    if (root.name !== 'data') {
        throw new Error(`Expected root element <data>, found <${root.name}>`);
    }

    if (!root.attributes.version) {
        console.warn('[WARN] No <data version="..."> attribute found');
    } else if (root.attributes.version !== '1.0') {
        throw new Error(`Expected data version "1.0", found "${root.attributes.version}"`);
    }

    const settings = root.children[0];

    if (!settings) {
        throw new Error('<data> element has no child elements');
    }

    if (settings.name !== 'struct') {
        throw new Error(`<data> first child should be <struct>, found <${settings.name}>`);
    }

    if (settings.name !== 'struct') {
        throw new Error(`<data> first child should be <struct>, found <${settings.name}>`);
    }

    if (settings.attributes.type !== 'Settings') {
        throw new Error('Expected <struct type="Settings"> attribute');
    }

    let key;

    for (const elm of settings.children) {
        if (elm.name === 'key') {
            key = elm.content;
            continue;
        }

        if (key === 'fileList' && elm.name === 'array') {
            const result = [];
            for (const fileElm of elm.children) {
                if (fileElm.name !== 'filename') {
                    throw new Error(`Expected <filename>, found <${fileElm.name}>`);
                }

                result.push(resolvePath(tpsFolder, fileElm.content));
            }
            return result;
        }
    }

    throw new Error('Could not find <key>fileList</key> followed by <array> of file paths');
}


function watchPath(path, cb) {
    const watchOptions = {
        persistent: true,
        recursive: true
    };

    console.log('* Watching', relativePath(process.cwd(), path));
    
    return fs.watch(path, watchOptions, function () {
        cb();
    });
}


function pack(tpsFile, texturePackerPath, notify, cb) {
    const options = {
        stdio: 'inherit'
    };

    console.log('');

    spawn(texturePackerPath, [tpsFile], options).on('close', function () {
        if (notify) {
            notifier.notify({
                title: 'TexturePacker',
                message: `Packed ${tpsFile}`,
                sound: true
            });
        }
        cb();
    });
}


function watchTpsFile(tpsFile, texturePackerPath, notify) {
    const srcPaths = parseSourcePathsFromXml(tpsFile);

    let shouldRun = false;
    let isRunning = false;
    let timer;

    function onChange() {
        shouldRun = true;
        clearTimeout(timer);

        timer = setTimeout(function () {
            if (isRunning) {
                // schedule a next attempt
                onChange();
            } else {
                shouldRun = false;
                isRunning = true;
                pack(tpsFile, texturePackerPath, notify, function () {
                    isRunning = false;
                });
            }
        }, EXEC_DELAY);
    }

    const watchers = [];

    function setup() {
        for (const srcPath of srcPaths) {
            watchers.push(watchPath(srcPath, onChange));
        }
    }

    function teardown() {
        for (const watcher of watchers) {
            watcher.close();
        }
        watchers.length = 0;
    }

    // watch the TPS file itself for updates

    watchPath(tpsFile, function () {
        // kill all watchers

        teardown();

        // set up the TPS file again (if it still exists)

        if (fs.existsSync(tpsFile)) {
            setup();
        }
    });

    setup();
}


module.exports = function (tpsFiles, texturePackerPath, notify) {
    for (const tpsFile of tpsFiles) {
        watchTpsFile(tpsFile, texturePackerPath, notify);
    }
};
