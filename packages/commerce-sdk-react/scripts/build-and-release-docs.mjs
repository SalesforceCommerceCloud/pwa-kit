/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {version, name} from '../package.json'
import {exec} from 'shelljs'
import {prerelease, gt} from 'semver'

// this script is expected to run on release branch.
const main = () => {
    // get the version number from package json
    const currentVersion = version
    const isPrerelease = prerelease(currentVersion.trim())
    // if it is a pre-release version, do nothing
    if (isPrerelease) {
        return
    }

    let latestVersion
    let isNewPackage
    const {stdout, stderr} = exec(`npm view ${name} version`, {silent: true})
    if (stderr) {
        isNewPackage = stderr.includes(`'${name}' is not in the npm registry`)
        if (!isNewPackage) {
            console.log('stderr', stderr)
            process.exit(0)
        }
    } else {
        latestVersion = stdout
    }

    const isLatest = isNewPackage || gt(currentVersion, latestVersion)
    if (isLatest) {
        console.log(`Publish docs for version ${currentVersion} to gh-pages branch`)
        // build the docs
        exec('npm run build:docs')

        // release the docs
        exec('npx gh-pages --dotfiles --message "[skip ci] Pushing docs to gh-pages" --dist docs')
    }
}

main()
