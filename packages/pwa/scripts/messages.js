/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This script is written to support extracting and compiling messages to
 * multiple default locales with react-intl
 * run 'node scripts/messages --help' to know all the commands it supports
 */
const program = require('commander')
const childProc = require('child_process')
const path = require('path')
const pwaKitConfig = require('./../pwa-kit.config.json')

const spawnPromise = (cmd, args, opts) => {
    return new Promise((resolve) => {
        const proc = childProc.spawn(cmd, args, opts)
        let stdout = ''
        let stderr = ''
        proc.stdout.on('data', (data) => {
            stdout += data
        })
        proc.stderr.on('data', (data) => {
            stderr += data
        })
        proc.on('exit', () => {
            const result = [proc, stdout, stderr]
            resolve(result)
        })
    })
}

/**
 * append formatjs and locales to the opts object of the 'program'
 * @param opts.formatjs - the path to formatjs from the project
 * @param opts.locales - the localesToExtractMessages from pwa-kit.config that you want to extract messages to.
 *
 * If your project has more than one site,
 * it is likely that the default locale is different for each site
 * E.g (en-US for RefArch, en-GB for RefArchGlobal)
 *
 * In that case, you need to fill those locales in the field 'localesToExtractMessages' inside pwa-kit.config.json,
 * so this function can pick it up and extract default messages into different files for your sites
 *
 */
const prepare = (opts) => {
    let formatjs = path.resolve(__dirname, '..', 'node_modules', '.bin', 'formatjs')

    return Promise.resolve().then(() => ({
        formatjs,
        locales: pwaKitConfig.app.localesToExtractMessages,
        opts
    }))
}

// add more action for messages when things arises
const getAction = (opts) => {
    if (opts.extractMessages) {
        return extractMessages
    }
    if (opts.compilePseudoMessages) {
        return compiledPseudoMessages
    }
}

/**
 * extract default messages for the locales
 * @param formatjs
 * @param locales
 * @returns {Promise<[]>}
 */
const extractMessages = async ({formatjs, locales}) => {
    const resultPromises = locales.map(async (locale) => {
        const [process, , stderr] = await spawnPromise(formatjs, [
            'extract',
            'app/**/*.{js,jsx}',
            '--out-file',
            `app/translations/${locale}.json`,
            '--id-interpolation-pattern',
            '[sha512:contenthash:base64:6]'
        ])
        if (stderr) {
            console.error(stderr)
        }

        return {
            exitCode: process.exitCode,
            stderr
        }
    })
    const results = []
    for (const spawnPromise of resultPromises) {
        const result = await spawnPromise
        results.push({
            exitCode: result.exitCode,
            stderr: result.stderr
        })
    }

    return results
}

/**
 * compile the psedocode translation for the project.
 * @param formatjs
 * @param locales
 */
const compiledPseudoMessages = async ({formatjs, locales}) => {
    // we only need one pseudo translation
    const [process, , stderr] = await spawnPromise(formatjs, [
        'compile',
        '--ast',
        `app/translations/${locales[0]}.json`,
        '--out-file',
        'app/translations/compiled/en-XB.json',
        '--pseudo-locale',
        'en-XB'
    ])
    if (stderr) {
        console.error(stderr)
    }

    return [
        {
            exitCode: process.exitCode,
            stderr
        }
    ]
}

const main = async (opts) => {
    try {
        const preparedOpts = await prepare(opts)
        const action = getAction(opts)
        await action(preparedOpts)
    } catch (err) {
        console.error('err', err)
    }
}

program.description(`extract and compile default messages into the default locale`)

program.option('--extract-messages', 'extract locales messages')
program.option('--compile-pseudo-messages', 'compile pseudo messages from extracted messages')

program.parse(process.argv)

main(program)
