#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable strict, import/no-commonjs */
/* eslint-env node */
'use strict'

const Promise = require('bluebird')
const path = require('path')
const copy = Promise.promisify(require('copy'))
const fs = require('fs')
const glob = require('glob')
const mkdir = Promise.promisify(fs.mkdir)
const readFile = Promise.promisify(fs.readFile)
const writeFile = Promise.promisify(fs.writeFile)
const exec = require('child_process').exec
const rimraf = Promise.promisify(require('rimraf'))
const babel = require('@babel/core')

const logVerbose = false
const log = (msg) => {
    logVerbose && console.log(msg)
}

const staticFilesToGenerate = [
    {path: 'src/utils/browser-detection.js', output: 'src/static/browser-detection.min.js'}
]

const readAsUTF8File = (filepath) =>
    readFile(filepath).then((data) => ({
        filepath,
        // Data is a buffer - we turn it into a string
        data: data.toString()
    }))

/**
 * Error catcher that will log an error and exit the process
 * @private
 */
const catcher = (message) => (error) => {
    console.log(`${message}: ${error}`)
    process.exit(1)
}

const cleanDist = () => {
    log('Cleaning dist/')
    return rimraf('dist/')
        .then(() => mkdir('dist/'))
        .catch(catcher(`Error while cleaning dist/`))
}

/**
 * Search for the Canvas dependency within JSDOM, and comment it out!
 * This is intended to resolve an issue where JSDOM cannot be compiled
 * by webpack. See here for details about JSDOM's support for webpack:
 * https://github.com/Automattic/node-canvas/issues/1314
 *
 * Our fix here is a total hack/workaround. It was intentionally designed
 * to modify the JSDOM node_module directly to ensure that the upgrade to
 * JSDOM 14.0 (see progressive-web-sdk PR #1426) is no longer a breaking
 * change. With this hack/workaround, customers/partners do not have to make
 * any additional changes project side to be compatible with this upgrade.
 *
 * We are totally open to doing this (remove Canvas as a dependency) in a
 * better way, so long as we can still ensure that JSDOM 14+ works.
 *
 * Additionally, we can choose to explore bringing support for Canvas back
 * if customers/partners find that they need it.
 *
 * @private
 */
const scrubCanvasDependency = () => {
    const jsdomLibUtilsFilePath = 'node_modules/jsdom/lib/jsdom/utils.js'
    const jsdomLibUtilsBackupPath = 'node_modules/jsdom/lib/jsdom/utils-backup.js'
    let backup
    let result

    try {
        fs.readFileSync(jsdomLibUtilsBackupPath, 'utf8')
        log('Skipping: Remove the Canvas dependency from JSDOM')
        return Promise.resolve() // The backup file exists: we've already changed the file, abort!
    } catch (error) {
        // The backup file doesn't exist, proceed...
    }

    return readFile(jsdomLibUtilsFilePath, 'utf8')
        .then((data) => {
            backup = data
            /* eslint-disable no-invalid-regexp */
            const regex = new RegExp('(?<=exports.Canvas = null;)(.*)', 'gs')
            /* eslint-enable no-invalid-regexp */
            result = data.replace(
                regex,
                '\n/* These lines are removed by progressive-web-sdk $1 */'
            )
        })
        .then(() => log('Remove the Canvas dependency from JSDOM'))
        .then(() => writeFile(jsdomLibUtilsFilePath, result))
        .then(() => log('Create a backup of the Canvas dependency'))
        .then(() => writeFile(jsdomLibUtilsBackupPath, backup))
}

const transpileSrc = () => {
    log(`Transpiling files in src/ to dist/`)

    const child = exec(
        `babel src -x ".js",".jsx" --ignore "static/*","**/test_fixtures/*","*.test.js","test.js" --out-dir dist`
    )

    child.stderr.on('data', (data) => {
        log(data)
    })

    child.stdout.on('data', (data) => {
        log(data)
    })

    return new Promise((resolve, reject) => {
        child.addListener('error', reject)
        child.addListener('exit', resolve)
    }).catch(catcher('exec error'))
}

const copyComponentScss = () => {
    log('Copying component scss files to dist/')

    return copy('src/components/**/*.scss', 'dist/components/').catch(catcher(`Error copying scss`))
}

const copyResponsiveScss = () => {
    log('Copying responsive scss files to dist/')

    return copy('styleguide/styles/_responsive.scss', 'dist/styles/', {flatten: true}).catch(
        catcher(`Error copying scss`)
    )
}

const copySvg = () => {
    log('Copying svg files to dist/')

    return copy('src/components/**/*.svg', 'dist/components/').catch(catcher(`Error copying scss`))
}

const generateStaticFromSrc = (files) => {
    log('Generating additional static files')

    return files.map((file) => {
        /* eslint-disable consistent-return */
        // Remove "export" from files as to use them directly in browser
        const data = fs.readFileSync(file.path, 'utf8')
        const result = data.replace(/export /g, '')
        fs.writeFileSync(file.output, result, 'utf8')
        /* eslint-enable consistent-return */

        // Transpile code with provided options
        const babelizedCode = babel.transformFileSync(file.output, {
            comments: false,
            minified: true
        }).code
        return writeFile(file.output, babelizedCode)
    })
}

/**
 * Copy all the files that match the glob patterns in 'files' to
 * dist/static
 *
 * @private
 * @param files {Array<String>} - array of filenames or glob patterns
 * @returns {Promise<*>} - resolved on completion of copying
 */
const copyToStatic = (files) => {
    return (fs.existsSync('dist/static') ? Promise.resolve() : mkdir('dist/static')).then(() =>
        Promise.all(
            files.map((filePath) => {
                log(`Copying ${filePath} to dist/static`)
                return copy(
                    // This is a glob pattern
                    filePath,
                    // This must be a directory
                    `dist/static/`,
                    // This prevents creation of directories under
                    // dist/static
                    {
                        flatten: true
                    }
                )
                    .then(() => log(`Copied ${filePath} to dist/static`))
                    .catch(catcher(`Error copying ${filePath}`))
            })
        )
    )
}

const packStaticAssets = () => {
    log('Collecting static assets into dist/static/assets.json')
    const staticDir = `dist/static`

    const jsFiles = glob.sync(`${staticDir}/*.js`)
    return (
        Promise.all(jsFiles.map((jsFile) => readAsUTF8File(jsFile)))
            // Collect all the files and write to a JSON file
            .then((fileObjects) => {
                const assets = {}
                fileObjects.forEach((fileObject) => {
                    log(`Collecting ${fileObject.filepath}`)
                    if (fileObject.data === '') {
                        console.error(`Error collecting ${fileObject.filepath} data`)
                    }
                    assets[path.basename(fileObject.filepath)] = fileObject.data
                })
                const output = 'dist/static/assets.json'
                log(`Writing ${output}`)
                return writeFile(output, JSON.stringify(assets, null, 2))
            })
            .catch(catcher('Error collecting static assets'))
    )
}

cleanDist()
    .then(scrubCanvasDependency)
    // Transpile & copy everything under 'src' into 'dist'
    .then(transpileSrc)
    // Copy other files to dist
    .then(copyComponentScss)
    .then(copyResponsiveScss)
    .then(copySvg)
    // Generate additional static files from source
    .then(() => generateStaticFromSrc(staticFilesToGenerate))
    // Copy source files from node_modules that need to go in dist/static
    // and also copy source files from src/static to dist/static
    .then(() =>
        copyToStatic([
            './node_modules/source-map-support/browser-source-map-support.js',
            './node_modules/jquery/dist/jquery.min.js',
            './src/static/*.js'
        ])
    )
    // Collect all the static assets into 'dist/static/assets.json'
    .then(packStaticAssets)
    .then(() => log('Successfully built!'))
    .catch(catcher('Error in build'))
