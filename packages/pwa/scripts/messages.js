/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// const Promise = require('bluebird')
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

const extractMessages = async ({formatjs, defaultLocales}) => {
    const resultPromises = defaultLocales.map(async (locale) => {
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

const main = async (opts) => {
    try {
        const preparedOpts = await prepare(opts)
        await extractMessages(preparedOpts)
    } catch (err) {
        console.error('err', err)
    }
}

program.description(`extract and compile default messages into the default locale`)

program.option('--extract-messages', 'extract locales messages')

program.parse(process.argv)

main(program)
