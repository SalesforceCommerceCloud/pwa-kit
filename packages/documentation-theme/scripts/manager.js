#!/usr/bin/env node

const commander = require('commander')
const exec = require('child_process').execSync
const harp = require('harp')
const path = require('path')

const {logAndExit, remove, docsDirInfo} = require('./utils.js')
const copy = require('./copy.js')
const createSymlink = require('./create-version-link.js')
const deploy = require('./deploy.js')

const BUILD_FOLDER_NAME = 'www'

// Helper method since these two functions occur together
const copyAndGenerate = (dir) => {
    const docsDir = docsDirInfo(dir)

    return copy(docsDir.absPath)
        .catch(logAndExit('Error while copying theme files:'))
        .then(() => docsDir)
        .catch(logAndExit('Error while creating component list:'))
}

const compileStep = (dir) => {
    const docsDir = docsDirInfo(dir)
    const buildFolder = path.join(docsDir.absRoot, BUILD_FOLDER_NAME)

    return new Promise((resolve) => {
        return copyAndGenerate(dir)
            .then(() => remove(buildFolder))
            .then(() => {
                console.log(`Starting Harp compilation of documentation at ${docsDir.absRoot}`)
                harp.compile(docsDir.absRoot, () => {
                    console.log('Docs compilation successful')
                    resolve(docsDir)
                })
            })
            .catch(logAndExit('Error during compilation:'))
    })
}

commander
    .command('preview <dir>')
    .description('preview the docs')
    .option('-p, --port [port]', 'optional port number', 9000)
    .action((dir, cmd) => {
        copyAndGenerate(dir).then((docsDir) => {
            harp.server(docsDir.absRoot, {port: cmd.port}, () => {
                var hostUrl = 'http://localhost:' + cmd.port + '/'
                console.log('Your server is listening at ' + hostUrl)
            })
        })
    })

commander
    .command('compile <dir>')
    .description('compile the docs')
    .action((dir) => compileStep(dir))

commander
    .command('deploy <dir>')
    .description('deploy the docs')
    // Note: we cannot use `--version` here, commander has assigned a function to cmd.version
    // so even if it isn't supplied by the user, `version` will be set to something.
    .option('-v, --version_num [version]', 'project version number')
    .option('--no_version', 'deploy without a version, otherwise version is required')
    .option('-p, --project <project>', /^(progressive-web|amp-sdk|docs-hub)$/)
    .option('-e, --env [env]', 'environment', /^(testing|staging|production)$/, 'testing')
    .action((dir, cmd, options) => {
        const docsDir = docsDirInfo(dir)
        const buildFolder = path.join(docsDir.absRoot, BUILD_FOLDER_NAME)

        if (!cmd.no_version && !cmd.version_num) {
            logAndExit('Either supply a version with --version_num or use the --no_version flag')(
                'No version # supplied'
            )
        }

        return Promise.resolve()
            .then(() => {
                if (cmd.version_num) {
                    let symlinkPath
                    return createSymlink(cmd.version_num, docsDir)
                        .catch(logAndExit('Error during symlink creation:'))
                        .then((s) => {
                            symlinkPath = s
                            return compileStep(dir)
                        })
                        .then(() => remove(symlinkPath))
                } else {
                    return compileStep(dir)
                }
            })
            .then(() => deploy(buildFolder, cmd.project, cmd.env))
            .catch(logAndExit('Error during deployment:'))
    })

commander.parse(process.argv)
