/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const Promise = require('bluebird')
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
const prepare = (opts) => {
    let formatjs = path.resolve(__dirname, '..', 'node_modules', '.bin', 'formatjs')

    return Promise.resolve().then(() => ({
        formatjs,
        defaultLocales: pwaKitConfig.app.sites.map((site) => site.l10n.defaultLocale),
        opts
    }))
}
const extractMessages = ({formatjs, defaultLocales}) => {
    return Promise.resolve()
        .then(() => {
            return Promise.map(defaultLocales, (locale) =>
                spawnPromise(formatjs, [
                    'extract',
                    'app/**/*.{js,jsx}',
                    '--out-file',
                    `app/translations/${locale}.json`,
                    '--id-interpolation-pattern',
                    '[sha512:contenthash:base64:6]'
                ]).then((result) => {
                    const [process, , stderr] = result
                    if (result.stderr) {
                        console.error(stderr)
                    }
                    return {
                        exitCode: process.exitCode,
                        stderr: process.stderr
                    }
                })
            )
        })
        .then((results) => {
            const fail = results.some((result) => result.exitCode !== 0)
            return fail ? 1 : 0
        })
}

const main = (opts) => {
    let exitCode = 0
    let args
    return Promise.resolve()
        .then(() => prepare(opts))
        .then((_args) => {
            args = _args
        })
        .then(() => extractMessages(args))
        .then((_exitCode) => {
            exitCode = _exitCode
        })
        .catch((err) => {
            exitCode = 1
            console.error(err)
        })
        .then(() => process.exit(exitCode))
}

program.description(`extract and compile default messages into the default locale`)

program.option('--extract-messages', 'extract locales messages')

program.parse(process.argv)

main(program)
