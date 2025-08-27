#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Template Drift Detection Script
 * 
 * This script detects when source files in template-retail-react-app have been
 * modified and alerts developers that corresponding .hbs template files may need
 * manual review and updates.
 * 
 * Usage:
 *   node scripts/detect-template-drift.js [--verbose]
 * 
 * Options:
 *   --verbose       Show detailed output
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execSync } = require('child_process')
const { Command } = require('commander')

// Import file mappings
const DRIFT_CONFIG = require('./template-drift-config.json')

class TemplateDriftDetector {
    constructor(options = {}) {
        this.verbose = options.verbose || false
        this.rootDir = path.resolve(__dirname, '..')
        this.sourceDir = path.join(this.rootDir, 'packages/template-retail-react-app')
        this.templateDirs = {
            retail: path.join(this.rootDir, 'packages/pwa-kit-create-app/assets/templates/@salesforce/retail-react-app'),
            bootstrap: path.join(this.rootDir, 'packages/pwa-kit-create-app/assets/bootstrap/js')
        }
        this.driftDetected = []
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
     * Get the last modified time of a file
     */
    getFileModTime(filePath) {
        try {
            return fs.statSync(filePath).mtime
        } catch (error) {
            return null
        }
    }

    /**
     * Get the last commit time for a specific file using git
     */
    getLastCommitTime(filePath) {
        try {
            const relativePath = path.relative(this.rootDir, filePath)
            const gitCommand = `git log -1 --format="%ct" -- "${relativePath}"`
            const timestamp = execSync(gitCommand, { 
                cwd: this.rootDir, 
                encoding: 'utf8' 
            }).trim()
            
            if (timestamp) {
                return new Date(parseInt(timestamp) * 1000)
            }
            return null
        } catch (error) {
            this.log(`Could not get git commit time for ${filePath}: ${error.message}`)
            return null
        }
    }

    /**
     * Check if source file has been modified more recently than template files
     */
    checkFileDrift(mapping) {
        const { source, templates, description } = mapping
        const sourceFile = path.join(this.sourceDir, source)

        if (!fs.existsSync(sourceFile)) {
            this.error(`Source file does not exist: ${sourceFile}`)
            return false
        }

        this.log(`Checking: ${source}`)

        const sourceCommitTime = this.getLastCommitTime(sourceFile)
        if (!sourceCommitTime) {
            this.log(`  ⚠️  Could not determine commit time for source file`)
            return false
        }

        let driftFound = false
        const templateStatus = []

        for (const template of templates) {
            const { templateDir, destination } = template
            const templateFile = path.join(this.templateDirs[templateDir], destination)

            if (!fs.existsSync(templateFile)) {
                this.log(`  ❌ Template file missing: ${templateDir}/${destination}`)
                templateStatus.push({
                    path: `${templateDir}/${destination}`,
                    status: 'missing',
                    sourceTime: sourceCommitTime,
                    templateTime: null
                })
                driftFound = true
                continue
            }

            const templateCommitTime = this.getLastCommitTime(templateFile)
            if (!templateCommitTime) {
                this.log(`  ⚠️  Could not determine commit time for template: ${templateDir}/${destination}`)
                continue
            }

            if (sourceCommitTime > templateCommitTime) {
                this.log(`  🔄 Drift detected: ${templateDir}/${destination}`)
                this.log(`     Source: ${sourceCommitTime.toISOString()}`)
                this.log(`     Template: ${templateCommitTime.toISOString()}`)
                templateStatus.push({
                    path: `${templateDir}/${destination}`,
                    status: 'outdated',
                    sourceTime: sourceCommitTime,
                    templateTime: templateCommitTime
                })
                driftFound = true
            } else {
                this.log(`  ✅ Up to date: ${templateDir}/${destination}`)
                templateStatus.push({
                    path: `${templateDir}/${destination}`,
                    status: 'up-to-date',
                    sourceTime: sourceCommitTime,
                    templateTime: templateCommitTime
                })
            }
        }

        if (driftFound) {
            this.driftDetected.push({
                source,
                description,
                sourceFile,
                sourceCommitTime,
                templates: templateStatus.filter(t => t.status !== 'up-to-date')
            })
        }

        return !driftFound
    }

    /**
     * Validate configuration
     */
    validateConfig() {
        if (!Array.isArray(DRIFT_CONFIG.mappings)) {
            throw new Error('Invalid configuration: mappings must be an array')
        }

        for (const mapping of DRIFT_CONFIG.mappings) {
            if (!mapping.source || !Array.isArray(mapping.templates)) {
                throw new Error(`Invalid mapping configuration: ${JSON.stringify(mapping)}`)
            }
        }
    }

    /**
     * Main drift detection process
     */
    async detect() {
        this.log('🔍 Detecting template drift...', true)
        
        try {
            this.validateConfig()
        } catch (error) {
            this.error(`Configuration validation failed: ${error.message}`)
            return false
        }

        let allUpToDate = true

        for (const mapping of DRIFT_CONFIG.mappings) {
            const isUpToDate = this.checkFileDrift(mapping)
            if (!isUpToDate) {
                allUpToDate = false
            }
        }

        // Report results
        if (this.errors.length > 0) {
            console.log('\n❌ Errors encountered:')
            this.errors.forEach(error => console.log(`  ${error}`))
            return false
        }

        if (this.driftDetected.length === 0) {
            console.log('\n✅ All template files are up to date!')
            return true
        }

        console.log(`\n⚠️  Template drift detected in ${this.driftDetected.length} file(s):`)
        console.log('=' .repeat(80))

        this.driftDetected.forEach(drift => {
            console.log(`\n📄 ${drift.source}`)
            if (drift.description) {
                console.log(`   ${drift.description}`)
            }
            console.log(`   Last modified: ${drift.sourceCommitTime.toISOString()}`)
            console.log(`   Templates that need review:`)
            
            drift.templates.forEach(template => {
                if (template.status === 'missing') {
                    console.log(`     ❌ ${template.path} (missing)`)
                } else {
                    console.log(`     🔄 ${template.path}`)
                    console.log(`        Template last updated: ${template.templateTime.toISOString()}`)
                    const daysBehind = Math.ceil((template.sourceTime - template.templateTime) / (1000 * 60 * 60 * 24))
                    console.log(`        Template is ${daysBehind} day(s) behind source`)
                }
            })
        })

        console.log('\n' + '=' .repeat(80))
        console.log('\n📋 Action Required:')
        console.log('   1. Review the source file changes')
        console.log('   2. Manually update the corresponding .hbs template files')
        console.log('   3. Ensure Handlebars placeholders are preserved/updated as needed')
        console.log('   4. Test the updated templates with pwa-kit-create-app')

        return false // Return false when drift is detected
    }
}

// CLI interface
if (require.main === module) {
    const program = new Command()
    
    program
        .name('detect-template-drift')
        .description('Detect when template-retail-react-app source files are newer than corresponding .hbs templates')
        .option('--verbose', 'Show detailed output')
    
    program.parse()
    
    const options = program.opts()
    const detector = new TemplateDriftDetector(options)
    
    detector.detect()
        .then(success => {
            process.exit(success ? 0 : 1)
        })
        .catch(error => {
            console.error('❌ Drift detection failed:', error.message)
            if (options.verbose) {
                console.error(error.stack)
            }
            process.exit(1)
        })
}

module.exports = TemplateDriftDetector
