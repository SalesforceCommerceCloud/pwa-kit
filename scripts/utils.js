/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const sh = require('shelljs')

const saveJSONToFile = (json, filePath) => {
    const jsonString = JSON.stringify(json, null, 2)
    // Make sure there's a newline at end of file
    new sh.ShellString(`${jsonString}\n`).to(filePath)
}

const setPackageVersion = (version, shellOptions = {}) => {
    sh.exec(`npm version --no-git-tag ${version}`, {silent: true, ...shellOptions})
}

module.exports = {
    saveJSONToFile,
    setPackageVersion
}
