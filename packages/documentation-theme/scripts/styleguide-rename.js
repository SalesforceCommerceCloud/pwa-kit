#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Styleguidist puts cache-breakers in generated JS when compiled for production. We have
// not been able to find a way to turn this off. We need a predictable filename so that
// we can load it reliably from /components/_layout.jade.
//
// Note: we do not want to rename the other webpack chunks created by the styleguidist build
// (ex. 0.<cache-buster>.js) as this is used from within main.bundle.js and not our jade layouts.
glob('docs/public/latest/styleguidist/build/bundle.*.js', (err, matches) => {
    if (matches.length !== 1) {
        console.error('Did not find exactly one bundle.*.js')
        process.exit(1)
    }
    const match = matches[0]
    const oldFilename = path.basename(match)
    const newPath = match.replace(oldFilename, 'main.bundle.js')
    fs.renameSync(match, newPath)
})
