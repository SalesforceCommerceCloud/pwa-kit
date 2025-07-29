#!/usr/bin/env node

/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Define the patterns to search for files
const patterns = ['src/components/**/*.{js,jsx,ts,tsx}', 'src/pages/**/*.{js,jsx,ts,tsx}', 'src/hooks/**/*.{js,jsx,ts,tsx}', 'src/page-designer/**/*.{js,jsx,ts,tsx}']

// Define patterns to exclude (test files)
const excludePatterns = [
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}',
    '**/__tests__/**'
]

// Function to check if file contains 'const messages = {'
function containsConstMessages(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8')
        return content.includes('const messages = {')
    } catch (error) {
        return false
    }
}

// Function to find files
function findFiles() {
    const allFiles = new Set()

    patterns.forEach((pattern) => {
        const files = glob.sync(pattern, {
            ignore: excludePatterns,
            nodir: true
        })
        files.forEach((file) => {
            if (containsConstMessages(file)) {
                allFiles.add(file)
            }
        })
    })

    return Array.from(allFiles).sort()
}

// Generate markdown content
function generateMarkdown(files) {
    let content = '# Refactoring Checklist\n\n'
    content += `Generated on: ${new Date().toISOString()}\n\n`
    content += `Total files: ${files.length}\n\n`
    content += '## Files to refactor:\n\n'

    files.forEach((file) => {
        content += `- [ ] ${file}\n`
    })

    return content
}

// Main execution
try {
    console.log('Searching for files...')
    const files = findFiles()
    console.log(`Found ${files.length} files`)

    const markdown = generateMarkdown(files)
    const outputFile = 'refactoring-checklist.md'

    fs.writeFileSync(outputFile, markdown)
    console.log(`✅ Checklist saved to ${outputFile}`)

    // Also log file count by directory for reference
    const stats = {}
    files.forEach((file) => {
        const dir = path.dirname(file)
        stats[dir] = (stats[dir] || 0) + 1
    })

    console.log('\nFiles by directory:')
    Object.entries(stats)
        .sort()
        .forEach(([dir, count]) => {
            console.log(`  ${dir}: ${count} files`)
        })
} catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
}
