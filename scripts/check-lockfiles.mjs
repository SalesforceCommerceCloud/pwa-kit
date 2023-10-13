/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const LOCKFILE_VERSION_TARGET = 3
const guidance =
    'To regenerate the lockfiles with the correct lockfile version, please run' +
    ' `rm -rf package-lock.json node_modules/` in each impacted directory, and then use npm 9 to' +
    ' run `npm install` in the monorepo root.'

// __filename isn't available directly in ESM files
const __filename = fileURLToPath(import.meta.url)
const projectDir = path.join(__filename, '../..')
const packagesDir = path.join(projectDir, 'packages')
const dirs = fs
    .readdirSync(packagesDir, {withFileTypes: true})
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(packagesDir, dirent.name))
let exitCode = 0

for (const dir of [/* monorepo root */ '.', ...dirs]) {
    const filename = path.join(dir, 'package-lock.json')
    // This file is executed as a postinstall script, so we can assume that the file will always exist
    const lockfile = JSON.parse(fs.readFileSync(filename, 'utf8'))
    if (lockfile.lockfileVersion !== LOCKFILE_VERSION_TARGET) {
        console.error(
            `Expected ${lockfile.name} to have lockfile version ${LOCKFILE_VERSION_TARGET}, but saw version ${lockfile.lockfileVersion}.`
        )
        exitCode += 1
    }
}

if (exitCode > 0) {
    console.log(guidance)
}

process.exit(exitCode)
