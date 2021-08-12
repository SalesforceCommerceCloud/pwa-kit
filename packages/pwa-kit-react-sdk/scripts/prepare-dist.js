#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const Promise = require('bluebird')
const fs = require('fs')
const fsPromises = require('fs').promises
const rimraf = Promise.promisify(require('rimraf'))
const path = require('path')
const exec = require('child_process').exec
const replace = require('replace-in-file')

const {copyFile} = fsPromises

const DEST_DIR = 'dist/'

const getPackageFiles = () => {
    console.log(`Getting a list of files from the package.`)

    let output = ''
    const child = exec(`npm pack --dry-run --json --ignore-scripts`)

    child.stderr.on('data', (data) => {
        console.log(data)
    })

    child.stdout.on('data', (data) => {
        output += data
    })

    return new Promise((resolve, reject) => {
        child.addListener('error', reject)
        child.addListener('exit', () => {
            const files = JSON.parse(output)[0].files.map(({path}) => path)
            resolve(files)
        })
    }).catch((e) => {
        console.log(e)
    })
}

const copyFiles = (srcs, dest, mode) => {
    console.log(`Copying first to ${dest}`)
    return Promise.all(
        srcs.map((src) => {
            // Assign the full file path
            const newFilePath = path.join(dest, src)

            // Ensure the path exists, create if it doesn't.
            if (!fs.existsSync(newFilePath)) {
                fs.mkdirSync(path.dirname(newFilePath), {recursive: true})
            }

            return copyFile(src, path.join(dest, src), mode)
        })
    )
}

const main = async () => {
    // Remove the dist/package.json so we don't end up including more files in
    // the package.
    await rimraf(`${DEST_DIR}/package.json`)

    // Get a list of files from the `npm pack --dry-run` command.
    const packageFiles = await getPackageFiles()

    // Move the required files into the `dist` filder.
    await copyFiles(packageFiles, DEST_DIR)

    // Update package.json imports.
    console.log('Updating references to package.json file.')
    const results = await replace({
        ignore: ['dist/scripts/**/*', 'dist/bin/**/*', 'dist/template/**/*'],
        files: 'dist/**/*.js',
        from: /..\/package.json/,
        to: 'package.json'
    })
    console.log('Files changed: ', results.filter(({hasChanged}) => hasChanged))

    console.log('Successfully built!')
}

main()
