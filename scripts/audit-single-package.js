#!/usr/bin/env node
/* eslint-env node */

/**
 * Run npm audit on a single package and fail if the number of vulnerabilities
 * crosses a given threshold.
 */
const util = require('util')
const sh = require('shelljs')
const os = require('os')
const fs = require('fs')
const path = require('path')
const program = require('commander')

const validSeverities = ['info', 'low', 'moderate', 'high', 'critical']

const main = (opts) => {
    const {args} = opts

    if (opts.args.length !== 1) {
        console.log(program.helpInformation())
        process.exit(1)
    }

    const cwd = path.resolve(args[0])
    // See https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
    const maxBufferDefault = 1024 * 1024
    const result = JSON.parse(sh.exec('npm audit --json --production', {cwd, maxBuffer: maxBufferDefault * 100, silent: true}))

    const totals = result.metadata.vulnerabilities
    console.log(JSON.stringify(totals, null, 4))
    // Object.entries(totals).forEach(([severity, count]) => {
    //     console.log(`"${severity}": ${count}`)
    // })
    const keyMap = {
        info: 'maxInfo',
        low: 'maxLow',
        moderate: 'maxModerate',
        high: 'maxHigh',
        critical: 'maxCritical'
    }
    const fail = Object.entries(keyMap).some(([severity, severityMax]) => {
        return totals[severity] > opts[severityMax]
    })
    process.exit(fail ? 1 : 0)
}

program.description(
    `Run "npm audit" on a single package and exit with a nonzero status if the count of vulnerabilities exceeds the given limits.`
)

program.arguments('<path>')

validSeverities.forEach((severity) => {
    program.option(
        `--max-${severity} <count>`,
        `Max number of ${severity}-severity vulnerabilities allowed before failing`,
        (x) => parseInt(x),
        100000
    )
})

program.parse(process.argv)

main(program)
