#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Template File Synchronization Script
 * 
 * This script automatically synchronizes source files from template-retail-react-app 
 * with their corresponding .hbs template files in pwa-kit-create-app.
 * 
 * Usage:
 *   node scripts/sync-template-files.js [--check-only] [--verbose]
 * 
 * Options:
 *   --check-only    Only check for drift, don't write changes
 *   --verbose       Show detailed output
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { Command } = require('commander')

// Import configuration
const SYNC_CONFIG = require('./sync-template-config.json')

class TemplateSyncer {
    constructor(options = {}) {
        this.checkOnly = options.checkOnly || false
        this.verbose = options.verbose || false
        this.rootDir = path.resolve(__dirname, '..')
        this.sourceDir = path.join(this.rootDir, 'packages/template-retail-react-app')
        this.templateDirs = {
            retail: path.join(this.rootDir, 'packages/pwa-kit-create-app/assets/templates/@salesforce/retail-react-app'),
            bootstrap: path.join(this.rootDir, 'packages/pwa-kit-create-app/assets/bootstrap/js')
        }
        this.changes = []
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
     * Generate a hash for file content to detect changes
     */
    getFileHash(content) {
        return crypto.createHash('md5').update(content).digest('hex')
    }

    /**
     * Read source file and apply Handlebars transformations
     */
    transformSourceToTemplate(sourceFilePath, transformations) {
        let content = fs.readFileSync(sourceFilePath, 'utf8')
        
        // Apply each transformation rule
        for (const transform of transformations) {
            const { type, pattern, replacement, condition } = transform
            
            switch (type) {
                case 'replace':
                    if (pattern && replacement !== undefined) {
                        const regex = new RegExp(pattern, 'g')
                        content = content.replace(regex, replacement)
                    }
                    break
                
                case 'conditional_replace':
                    if (condition && pattern && replacement !== undefined) {
                        // For conditional replacements, we create Handlebars conditional blocks
                        const regex = new RegExp(pattern, 'g')
                        content = content.replace(regex, replacement)
                    }
                    break
                
                case 'inject_handlebars':
                    // Inject Handlebars helpers and conditionals
                    if (pattern && replacement !== undefined) {
                        const regex = new RegExp(pattern, 'g')
                        content = content.replace(regex, replacement)
                    }
                    break
            }
        }

        return content
    }

    /**
     * Check if a template file needs updating
     */
    needsUpdate(sourceFile, templateFile, transformations) {
        try {
            if (!fs.existsSync(templateFile)) {
                return { needsUpdate: true, reason: 'Template file does not exist' }
            }

            const sourceContent = this.transformSourceToTemplate(sourceFile, transformations)
            const templateContent = fs.readFileSync(templateFile, 'utf8')

            const sourceHash = this.getFileHash(sourceContent)
            const templateHash = this.getFileHash(templateContent)

            if (sourceHash !== templateHash) {
                return { 
                    needsUpdate: true, 
                    reason: 'Content differs from source',
                    sourceHash,
                    templateHash
                }
            }

            return { needsUpdate: false }
        } catch (error) {
            return { 
                needsUpdate: true, 
                reason: `Error reading files: ${error.message}` 
            }
        }
    }

    /**
     * Sync a single file mapping
     */
    syncFileMapping(mapping) {
        const { source, targets, transformations = [] } = mapping
        const sourceFile = path.join(this.sourceDir, source)

        if (!fs.existsSync(sourceFile)) {
            this.error(`Source file does not exist: ${sourceFile}`)
            return false
        }

        this.log(`Processing: ${source}`)

        let hasChanges = false

        for (const target of targets) {
            const { destination, templateDir } = target
            const templateFile = path.join(this.templateDirs[templateDir], destination)
            const templateContent = this.transformSourceToTemplate(sourceFile, transformations)

            // Check if update is needed
            const updateCheck = this.needsUpdate(sourceFile, templateFile, transformations)
            
            if (updateCheck.needsUpdate) {
                hasChanges = true
                
                this.log(`  → ${templateDir}/${destination} (${updateCheck.reason})`)
                
                if (!this.checkOnly) {
                    // Ensure directory exists
                    const templateDir = path.dirname(templateFile)
                    if (!fs.existsSync(templateDir)) {
                        fs.mkdirSync(templateDir, { recursive: true })
                    }

                    // Write the template file
                    fs.writeFileSync(templateFile, templateContent, 'utf8')
                    this.log(`    ✅ Updated`)
                } else {
                    this.log(`    ⚠️  Would update (check-only mode)`)
                }

                this.changes.push({
                    source,
                    target: `${templateDir}/${destination}`,
                    reason: updateCheck.reason
                })
            } else {
                this.log(`  → ${templateDir}/${destination} (up to date)`)
            }
        }

        return !hasChanges
    }

    /**
     * Validate configuration and file paths
     */
    validateConfig() {
        if (!Array.isArray(SYNC_CONFIG.mappings)) {
            throw new Error('Invalid configuration: mappings must be an array')
        }

        for (const mapping of SYNC_CONFIG.mappings) {
            if (!mapping.source || !Array.isArray(mapping.targets)) {
                throw new Error(`Invalid mapping configuration: ${JSON.stringify(mapping)}`)
            }
        }
    }

    /**
     * Main synchronization process
     */
    async sync() {
        this.log('🔄 Starting template synchronization...', true)
        
        try {
            this.validateConfig()
        } catch (error) {
            this.error(`Configuration validation failed: ${error.message}`)
            return false
        }

        let allUpToDate = true

        for (const mapping of SYNC_CONFIG.mappings) {
            const isUpToDate = this.syncFileMapping(mapping)
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

        if (this.changes.length === 0) {
            console.log('\n✅ All template files are up to date!')
            return true
        }

        console.log(`\n📝 ${this.checkOnly ? 'Found' : 'Applied'} ${this.changes.length} changes:`)
        this.changes.forEach(change => {
            console.log(`  ${change.source} → ${change.target}`)
            console.log(`    ${change.reason}`)
        })

        if (this.checkOnly) {
            console.log('\n⚠️  Run without --check-only to apply these changes')
            return false // Return false in check-only mode if changes are needed
        }

        console.log('\n✅ Synchronization complete!')
        return allUpToDate
    }
}

// CLI interface
if (require.main === module) {
    const program = new Command()
    
    program
        .name('sync-template-files')
        .description('Synchronize template-retail-react-app source files with .hbs templates')
        .option('--check-only', 'Only check for drift, don\'t write changes')
        .option('--verbose', 'Show detailed output')
    
    program.parse()
    
    const options = program.opts()
    const syncer = new TemplateSyncer(options)
    
    syncer.sync()
        .then(success => {
            process.exit(success ? 0 : 1)
        })
        .catch(error => {
            console.error('❌ Sync failed:', error.message)
            if (options.verbose) {
                console.error(error.stack)
            }
            process.exit(1)
        })
}

module.exports = TemplateSyncer
