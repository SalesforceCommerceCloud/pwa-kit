#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable strict, import/no-commonjs */
/* eslint-env node */
'use strict'

const Promise = require('bluebird')
const copy = Promise.promisify(require('copy'))
const fs = require('fs')
const mkdir = Promise.promisify(fs.mkdir)
const exec = require('child_process').exec
const rimraf = Promise.promisify(require('rimraf'))

/**
 * Error catcher that will log an error and exit the process
 * @private
 */
const catcher = (message) => (error) => {
    console.log(`${message}: ${error}`)
    process.exit(1)
}

const cleanDist = () => {
    console.log('Cleaning dist/')
    return rimraf('dist/')
        .then(() => mkdir('dist/'))
        .catch(catcher(`Error while cleaning dist/`))
}

const transpileSrc = () => {
    console.log(`Transpiling files in src/ to dist/`)

    const child = exec(
        `npx --no-install babel --root-mode upward src -x ".js",".jsx" --ignore "**/test_fixtures/*","*.test.js","test.js" --out-dir dist`
    )

    child.stderr.on('data', (data) => {
        console.log(data)
    })

    child.stdout.on('data', (data) => {
        console.log(data)
    })

    return new Promise((resolve, reject) => {
        child.addListener('error', reject)
        child.addListener('exit', resolve)
    }).catch(catcher('exec error'))
}

const copyComponentScss = () => {
    console.log('Copying component scss files to dist/')

    return copy('src/components/**/*.scss', 'dist/components/').catch(catcher(`Error copying scss`))
}

const copyResponsiveScss = () => {
    console.log('Copying responsive scss files to dist/')

    return copy('styleguide/styles/_responsive.scss', 'dist/styles/', {flatten: true}).catch(
        catcher(`Error copying scss`)
    )
}

const copySvg = () => {
    console.log('Copying svg files to dist/')

    return copy('src/components/**/*.svg', 'dist/components/').catch(catcher(`Error copying scss`))
}

cleanDist()
    // Transpile & copy everything under 'src' into 'dist'
    .then(transpileSrc)
    // Copy other files to dist
    .then(copyComponentScss)
    .then(copyResponsiveScss)
    .then(copySvg)
    .then(() => console.log('Successfully built!'))
    .catch(catcher('Error in build'))
