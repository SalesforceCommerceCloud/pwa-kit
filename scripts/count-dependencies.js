#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const program = require('commander')
const path = require('path')

sh.set('-e')

const main = (opts) => {
    const {args} = opts
    if (opts.args.length !== 1) {
        console.log(program.helpInformation())
        process.exit(1)
    }
    const cwd = path.resolve(args[0])
    const uniques = sh
        .exec('npm list --development || true', {cwd, silent: true})
        .grep('-v', 'deduped$') // Exclude packages deduped by NPM
        .trim()
        .split('\n')
    const count = uniques.length

    console.log(count)
    process.exit(0)
}

program.description(`Print the count of unique dependencies installed for the package at <path>`)

program.arguments('<path>')

program.parse(process.argv)

main(program)
