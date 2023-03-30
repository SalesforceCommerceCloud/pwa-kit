#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Update Change Log heading
import {version} from '../package.json'
import {resolve} from 'path'
import {tmpdir} from 'os'
import {writeFileSync, appendFileSync, readFileSync, copyFileSync} from 'fs'

const date = new Date().toString().split(' ').slice(1, 4)
const heading = `## v${version} (${date[0]} ${date[1]}, ${date[2]})\n`

const changelog = resolve(tmpdir(), 'CHANGELOG.md')

writeFileSync(changelog, heading, 'utf8')
appendFileSync(changelog, readFileSync('CHANGELOG.md'), 'utf8')
copyFileSync(changelog, 'CHANGELOG.md')
