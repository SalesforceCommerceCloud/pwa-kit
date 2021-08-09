#!/usr/bin/env node

// Run JSdoc into a tmp dir and copy over to remove version info
// (handled by our own docs tooling).

const path = require('path')
const spawn = require('cross-spawn')
const pkg = require('../package.json')
const fsExtra = require('fs-extra')
const fs = require('fs')
const os = require('os')

const rm = fsExtra.removeSync
const cp = fsExtra.copySync

const jsdoc = path.resolve('node_modules', '.bin', 'jsdoc')

rm('docs')

const tmp = fs.mkdtempSync(path.resolve(os.tmpdir(), 'docs-'))

spawn.sync(
    jsdoc,
    [
        'src',
        '--destination',
        tmp,
        '--recurse',
        '--readme',
        'README.md',
        '--package',
        'package.json',
        '--configure',
        'jsdoc.json'
    ],
    {stdio: 'inherit'}
)

cp(path.resolve(tmp, '@mobify', 'commerce-integrations', `${pkg.version}`), 'docs')
