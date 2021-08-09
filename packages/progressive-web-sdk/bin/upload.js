#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

'use strict'

const fs = require('fs')
const uploadBundle = require('../scripts/upload.js')
const Utils = require('../scripts/utils.js')

const POTENTIAL_OPTIONS = {
    buildDirectory: 'b',
    message: 'm',
    projectSlug: 's',
    target: 't'
}

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .option(POTENTIAL_OPTIONS.buildDirectory, {
        alias: 'buildDirectory',
        describe: 'a custom project directory where your build is located. default: "build/"'
    })
    .option(POTENTIAL_OPTIONS.message, {
        alias: 'message',
        describe:
            'a message to include along with the uploaded bundle in Mobify Cloud. default: <git branch>: <git commit hash>',
        type: 'string'
    })
    .option(POTENTIAL_OPTIONS.projectSlug, {
        alias: 'projectSlug',
        describe:
            "a project slug that differs from the name property in your project's package.json. default: the 'name' key from the package.json", // eslint-disable-line max-len
        type: 'string'
    })
    .option(POTENTIAL_OPTIONS.target, {
        alias: 'target',
        describe: 'a custom target to upload a bundle to within Mobify Cloud',
        type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .strict().argv

let packageJson = {}
try {
    // Assumption: this binary is invoked from the project root directory
    packageJson = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}))
} catch (e) {
    let message
    if (e.code === 'ENOENT' && e.path === 'package.json') {
        message =
            '[Error: package.json not found. Are you running this command in the project root directory?]' // eslint-disable-line max-len
    } else {
        message = e.message
    }

    Utils.fail(message)
}

// Read the top-level Mobify options. If the environment variable
// SSR_ENABLED is set to a truthy string, then override the
// ssrEnabled value.
const mobifyOptions = packageJson.mobify || {}

if (process.env.SSR_ENABLED) {
    mobifyOptions.ssrEnabled = true
}

// Take the default slug from package.json
if (typeof argv.projectSlug === 'undefined') {
    argv.projectSlug = packageJson.name
}

const options = {}

// Filter out undefined options
for (const opt in POTENTIAL_OPTIONS) {
    if (typeof argv[opt] !== 'undefined') {
        options[opt] = argv[opt]
    }
}

// Sanity check SSR values
if (mobifyOptions.ssrEnabled) {
    if (
        // If ssrEnabled is set, then there must be at least one
        // ssrOnly or ssrShared file.
        !Array.isArray(mobifyOptions.ssrOnly) ||
        mobifyOptions.ssrOnly.length === 0 ||
        !Array.isArray(mobifyOptions.ssrShared) ||
        mobifyOptions.ssrShared.length === 0
    ) {
        Utils.fail('ssrEnabled is set, but no ssrOnly or ssrShared files are defined')
    } else {
        // Take SSR parameters from package.json. We use snake_case
        // names for the option keys to match those expected by Cloud
        // in the bundle metadata, but camelCase in package.json to
        // match JS convention. We expect the SSR values to be nested
        // under a top-level "mobify" key.
        options.ssr_parameters = mobifyOptions.ssrParameters
        options.ssr_only = mobifyOptions.ssrOnly
        options.ssr_shared = mobifyOptions.ssrShared
        options.set_ssr_values = true
    }
}

uploadBundle(options).catch((err) => {
    console.error(err.message || err)
})
