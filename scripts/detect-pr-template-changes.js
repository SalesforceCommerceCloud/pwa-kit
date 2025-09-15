#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * PR Template Change Detection Script
 *
 * This script detects which files were changed in a PR and alerts if their
 * corresponding .hbs template files may need updates.
 *
 * Usage:
 *   node scripts/detect-pr-template-changes.js [--base-ref main] [--verbose]
 *
 * Options:
 *   --base-ref      Base branch to compare against (default: main)
 *   --verbose       Show detailed output
 */

const fs = require('fs')
const path = require('path')
const {execSync} = require('child_process')
const {Command} = require('commander')

// Import file mappings
const DRIFT_CONFIG = require('./template-drift-config.json')

class PRTemplateChangeDetector {
    constructor(options = {}) {
        this.baseRef = options.baseRef || 'develop'
        this.verbose = options.verbose || false
        this.rootDir = path.resolve(__dirname, '..')
        this.sourceDir = path.join(this.rootDir, 'packages/template-retail-react-app')
        this.templateDirs = {
            retail: path.join(
                this.rootDir,
                'packages/pwa-kit-create-app/assets/templates/@salesforce/retail-react-app'
            ),
            bootstrap: path.join(this.rootDir, 'packages/pwa-kit-create-app/assets/bootstrap/js')
        }
        this.affectedTemplates = []
        this.errors = []
    }

    log(message, force = false) {
        if (this.verbose || force) {
            console.log(message)
        }
    }

    error(message) {
        console.error(`❌ ${message}`)
        this.errors.push(message)
    }

    /**
     * Get list of changed files in the current PR/branch
     */
    getChangedFiles() {
        try {
            // Get files changed compared to base branch
            const gitCommand = `git diff --name-only ${this.baseRef}...HEAD`
            const output = execSync(gitCommand, {
                cwd: this.rootDir,
                encoding: 'utf8'
            }).trim()

            if (!output) {
                return []
            }

            return output.split('\n').filter((file) => file.trim())
        } catch (error) {
            this.error(`Could not get changed files: ${error.message}`)
            return []
        }
    }

    /**
     * Check if a file path matches a source file we're monitoring
     */
    findMatchingMapping(changedFile) {
        const sourcePrefix = 'packages/template-retail-react-app/'

        if (!changedFile.startsWith(sourcePrefix)) {
            return null
        }

        // Remove the prefix to get the relative path within template-retail-react-app
        const relativePath = changedFile.substring(sourcePrefix.length)

        return DRIFT_CONFIG.mappings.find((mapping) => mapping.source === relativePath)
    }

    /**
     * Check which template files correspond to changed source files
     */
    analyzeChangedFiles() {
        this.log('🔍 Analyzing changed files in PR...', true)

        const changedFiles = this.getChangedFiles()

        if (changedFiles.length === 0) {
            this.log('No files changed in this PR')
            return true
        }

        this.log(`Found ${changedFiles.length} changed files:`)
        changedFiles.forEach((file) => this.log(`  ${file}`))

        // Find which changed files have corresponding templates
        for (const changedFile of changedFiles) {
            const mapping = this.findMatchingMapping(changedFile)

            if (mapping) {
                this.log(`\n📄 ${changedFile}`)
                this.log(`   → Has corresponding template files`)

                const templateInfo = {
                    sourceFile: changedFile,
                    mapping: mapping,
                    templates: []
                }

                // Check each template file
                for (const template of mapping.templates) {
                    const templatePath = path.join(
                        this.templateDirs[template.templateDir],
                        template.destination
                    )
                    const exists = fs.existsSync(templatePath)

                    templateInfo.templates.push({
                        ...template,
                        fullPath: templatePath,
                        exists: exists,
                        relativePath: `${template.templateDir}/${template.destination}`
                    })

                    if (exists) {
                        this.log(`   ✅ ${template.templateDir}/${template.destination}`)
                    } else {
                        this.log(`   ❌ ${template.templateDir}/${template.destination} (missing)`)
                    }
                }

                this.affectedTemplates.push(templateInfo)
            }
        }

        return this.affectedTemplates.length === 0
    }

    /**
     * Generate helpful output for developers
     */
    generateReport() {
        // TODO: simplify the logic throughout this file by minimizing the console logging. The script prints out something ONLY when there's an error (some template files are stale).
        if (this.affectedTemplates.length === 0) {
            console.log('\n✅ No template files need attention!')
            console.log("Your changes don't affect files that have corresponding .hbs templates.")
            return true
        }

        console.log(
            `\n⚠️  ${this.affectedTemplates.length} changed file(s) have corresponding template files:`
        )
        console.log('='.repeat(80))

        this.affectedTemplates.forEach((item) => {
            console.log(`\n📄 ${item.sourceFile}`)
            if (item.mapping.description) {
                console.log(`   ${item.mapping.description}`)
            }

            console.log(`   Corresponding template files:`)
            item.templates.forEach((template) => {
                if (template.exists) {
                    console.log(`     📝 ${template.relativePath}`)
                    console.log(`        Location: ${template.fullPath}`)
                } else {
                    console.log(`     ❌ ${template.relativePath} (MISSING - needs to be created)`)
                }
            })
        })

        console.log('\n' + '='.repeat(80))
        console.log('\n📋 Recommended Actions:')
        console.log('   1. Review your changes to the source files above')
        console.log('   2. Check if the corresponding .hbs template files need updates')
        console.log('   3. Update templates while preserving Handlebars placeholders:')
        console.log('      • {{answers.project.name}}')
        console.log('      • {{#if condition}}...{{/if}}')
        console.log('      • {{answers.project.commerce.clientId}}')
        console.log('   4. Test with: npx @salesforce/pwa-kit-create-app')

        console.log('\n💡 Template files may have unique code not in source files!')
        console.log("   Only update what's relevant to your source changes.")

        return false
    }

    /**
     * Main detection process
     */
    async detect() {
        try {
            const noTemplatesAffected = this.analyzeChangedFiles()

            if (this.errors.length > 0) {
                console.log('\n❌ Errors encountered:')
                this.errors.forEach((error) => console.log(`  ${error}`))
                return false
            }

            return this.generateReport()
        } catch (error) {
            this.error(`Detection failed: ${error.message}`)
            return false
        }
    }

    /**
     * Get summary for GitHub Actions
     */
    getSummary() {
        if (this.affectedTemplates.length === 0) {
            return {
                hasTemplateChanges: false,
                message: 'No template files need attention',
                files: []
            }
        }

        return {
            hasTemplateChanges: true,
            message: `${this.affectedTemplates.length} changed file(s) have corresponding templates`,
            files: this.affectedTemplates.map((item) => ({
                source: item.sourceFile,
                description: item.mapping.description,
                templates: item.templates.map((t) => t.relativePath)
            }))
        }
    }
}

// CLI interface
if (require.main === module) {
    const program = new Command()

    program
        .name('detect-pr-template-changes')
        .description(
            'Detect which files changed in PR have corresponding .hbs templates that may need updates'
        )
        // TODO: fix discrepancy in the default branch. Here it's main branch but elsewhere it's develop branch.
        .option('--base-ref <ref>', 'Base branch to compare against', 'main')
        .option('--verbose', 'Show detailed output')

    program.parse()

    const options = program.opts()
    // TODO: instead of a class, can we use a more functional/declarative approach instead?
    const detector = new PRTemplateChangeDetector(options)

    detector
        .detect()
        .then((success) => {
            // Output summary for GitHub Actions
            if (process.env.GITHUB_ACTIONS) {
                const summary = detector.getSummary()
                console.log(
                    `\n::set-output name=has_template_changes::${summary.hasTemplateChanges}`
                )
                console.log(`::set-output name=summary_message::${summary.message}`)
                console.log(`::set-output name=affected_files::${JSON.stringify(summary.files)}`)
            }

            process.exit(success ? 0 : 1)
        })
        .catch((error) => {
            console.error('❌ Detection failed:', error.message)
            if (options.verbose) {
                console.error(error.stack)
            }
            process.exit(1)
        })
}

module.exports = PRTemplateChangeDetector
