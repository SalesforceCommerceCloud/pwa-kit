/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

function normalizeJS(content) {
    return content
        .split('\n')
        .map((line) => line.trim()) // Trim leading/trailing spaces
        .filter((line) => line !== '') // Remove blank lines
        .join('\n')
}
function computeChecksum(directory) {
    const checksums = []

    function processDirectory(appDir, dir) {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stats = fs.statSync(filePath)

            if (stats.isDirectory() && !filePath.includes('node_modules')) {
                processDirectory(appDir, filePath)
            } else if (
                file.endsWith('.jsx') ||
                file.endsWith('.tsx') ||
                file.endsWith('.js') ||
                file.endsWith('.ts')
            ) {
                const checksum = computeFileChecksum(filePath)
                const relativeFilePath = path.relative(appDir, filePath)
                checksums.push({
                    file: relativeFilePath,
                    checksum: checksum
                })
            }
        })
    }

    processDirectory(directory, directory)
    return checksums
}

function computeFileChecksum(filePath) {
    const code = fs.readFileSync(filePath, 'utf8')
    const normalized = normalizeJS(code)
    const hash = crypto.createHash('sha256').update(normalized).digest('hex')
    return hash
}

module.exports = computeChecksum

// const directory = process.argv[2];
// const checksums = computeChecksum(directory);
// console.log(JSON.stringify(checksums, null, 2));
