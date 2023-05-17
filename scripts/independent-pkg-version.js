#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
// Exit upon error
sh.set('-e')

const main = () => {
    const version = process.argv[2]

    // TODO: when bumping the version of retail-react-app, we also need to update other packages that depend on it
    sh.exec(`npm version --no-git-tag ${version}`, {silent: true})
}

main()
