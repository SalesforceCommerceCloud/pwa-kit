#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

'use strict'

const fs = require('fs')
const MessagingUtils = require('../scripts/messaging-utils.js')
const Utils = require('../scripts/utils.js')
const yaml = require('js-yaml')
const yargs = require('yargs')

const POTENTIAL_OPTIONS = {
    projectDirectory: 'd',
    messagingHost: 'm'
}

const getPackageOptions = (argv) => {
    const projectPath = argv.projectDirectory || '.'
    const packagePath = `${projectPath}/package.json`

    let packageJson
    try {
        // If the buildDirectory isn't defined, assume we're running in
        // the project root.
        packageJson = fs.readFileSync(packagePath, {encoding: 'utf8'})
    } catch (e) {
        let message
        if (e.code === 'ENOENT' && e.path.endsWith('package.json')) {
            message = `[Error: ${packagePath} not found. Are you running this command in the project's web directory?]` // eslint-disable-line max-len
        } else {
            message = e.message
        }

        Utils.fail(message)
    }

    let packageOptions
    try {
        packageOptions = JSON.parse(packageJson)
    } catch (e) {
        Utils.fail(`[Error: parsing of ${packagePath} failed: ${e.message}]`)
    }

    const messagingDirectory = `${projectPath}/messaging`
    const messagingPath = messagingDirectory || './messaging'

    const options = Object.assign({}, packageOptions, {
        projectPath,
        packagePath,
        messagingDirectory,
        messagingPath,
        messagingHost: argv.messagingHost,
        configFilePath: `${messagingPath}/${packageOptions.messagingSiteId}.yaml`,
        argv
    })

    // If messagingEnabled is false, fail with a useful message.
    if (!options.messagingEnabled) {
        Utils.fail(
            '[Error: Messaging is not enabled for this project. You should set the ' +
                `messagingEnabled flags in ${options.packagePath}]`
        )
    }

    // If messagingSiteId isn't defined, also exit and warn
    const siteId = options.messagingSiteId
    if (!siteId) {
        Utils.fail(`[Error: The messagingSiteId value must be defined in ${options.packagePath}]`)
    }

    if (!fs.existsSync(options.configFilePath)) {
        Utils.fail(`[Error: ${options.configFilePath} not found]`)
    }

    const fullConfig = yaml.safeLoad(fs.readFileSync(options.configFilePath))
    options.siteConfig = fullConfig.config

    return options
}

const errorCatcher = (err) => {
    console.error(err.message || err)
}

/**
 * Allow invocation without any arguments, or with just the build path.
 */
const argv = yargs // eslint-disable-line no-unused-vars
    .usage('Usage: $0 <command> [options]')
    .command('upload', 'upload the Messaging configuration files', {}, (args) => {
        MessagingUtils.uploadConfig(getPackageOptions(args)).catch(errorCatcher)
    })
    .command('certificate', 'generate a certificate request file', {}, (args) => {
        MessagingUtils.generateCSR(getPackageOptions(args)).catch(errorCatcher)
    })
    .command(
        'testmessage <client_id>',
        'send a test message to a specific client',
        {
            title: {
                default: 'Test Message'
            },
            text: {
                default: 'This is a test message'
            },
            icon: {
                default: 'https://webpush-cdn.mobify.net/images/mobify.png'
            },
            url: {}
        },
        (args) => {
            MessagingUtils.sendTestMessage(getPackageOptions(args)).catch(errorCatcher)
        }
    )
    .option(POTENTIAL_OPTIONS.projectDirectory, {
        alias: 'projectDirectory',
        describe:
            'the directory where your project is located. The default is the current directory'
    })
    // hidden option
    .option(POTENTIAL_OPTIONS.messagingHost, {
        alias: 'messagingHost'
    })
    .help('h')
    .alias('h', 'help')
    .demandCommand(1, 'This script needs a command.')
    .strict().argv
