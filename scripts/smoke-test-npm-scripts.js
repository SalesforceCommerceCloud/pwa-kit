#!/usr/bin/env node
/* eslint-env node */

const sh = require('shelljs')
const program = require('commander')
const path = require('path')

sh.set('-e')

const defaultDir = process.cwd()

program.description([
    `Smoke-tests uncommonly-run NPM scripts that get shipped with Mobify projects `,
    `by simply checking that those scripts exit without errors.`
    ].join('\n')
)
program.option('--dir <dir>', `Path to a Mobify project`, defaultDir)

program.parse(process.argv)

const main = (opts) => {
    const cwd = path.resolve(opts.dir)

    const pkg = JSON.parse(sh.cat(path.join(cwd, 'package.json')))

    // The excluded scripts are either already part of our CI steps or are not safe to run.
    const exclude = [
        /^lint.*$/,
        /^test.*$/,
        /^push$/,
        /^save-credentials$/,
        /^format$/,
        /^prod:build$/,
        /^start.*$/
    ]

    const scripts = Object.keys(pkg.scripts).filter((script) => !exclude.some((re) => script.match(re)))

    scripts.forEach((script) => {
        const cmd = `npm run ${script}`
        console.log(`Testing "${cmd}"`)
        try {
            sh.exec(cmd, {cwd, silent: true})
        } catch (e) {
            console.error(e)
            sh.exit(1)
        }
    })
}

main(program)
