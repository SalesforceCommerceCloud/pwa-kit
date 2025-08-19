#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Demo script to show template synchronization in action
 * 
 * This script demonstrates how the template sync system works by:
 * 1. Running a sync check to show current status
 * 2. Showing what transformations would be applied
 * 3. Demonstrating the GitHub Actions integration
 */

const TemplateSyncer = require('./sync-template-files.js')
const path = require('path')
const fs = require('fs')

console.log('🎭 Template Synchronization Demo\n')

async function runDemo() {
    console.log('1️⃣  Checking current synchronization status...\n')
    
    // Create syncer instance in check-only mode
    const checker = new TemplateSyncer({ checkOnly: true, verbose: true })
    const isUpToDate = await checker.sync()
    
    console.log('\n' + '='.repeat(80) + '\n')
    
    if (isUpToDate) {
        console.log('✅ All templates are up to date!')
        console.log('\nTo see the system in action, you could:')
        console.log('1. Modify a source file (e.g., packages/template-retail-react-app/config/default.js)')
        console.log('2. Run this demo again to see drift detection')
        console.log('3. Run the sync script to apply updates')
    } else {
        console.log('2️⃣  Templates need updating. Here\'s what would happen:\n')
        
        console.log('📝 Changes that would be applied:')
        checker.changes.forEach(change => {
            console.log(`   ${change.source} → ${change.target}`)
            console.log(`   Reason: ${change.reason}`)
        })
        
        console.log('\n🔧 To apply these changes, run:')
        console.log('   node scripts/sync-template-files.js')
        
        console.log('\n📋 In CI/CD, this would:')
        console.log('   • Fail the PR check (preventing merge)')
        console.log('   • Comment on the PR with instructions')
        console.log('   • Auto-sync on push to main/develop branches')
    }
    
    console.log('\n' + '='.repeat(80) + '\n')
    
    // Show example transformations
    console.log('3️⃣  Example transformations applied by the sync system:\n')
    
    const examples = [
        {
            type: 'Commerce API Configuration',
            source: "clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836'",
            template: "clientId: '{{answers.project.commerce.clientId}}'"
        },
        {
            type: 'Feature Flag',
            source: 'useSLASPrivateClient: false',
            template: 'useSLASPrivateClient: {{answers.project.commerce.isSlasPrivate}}'
        },
        {
            type: 'Conditional Configuration',
            source: 'enabled: false',
            template: '{{#if answers.project.demo.enableDemoSettings}}\n                enabled: true,\n                {{else}}\n                enabled: false,\n                {{/if}}'
        },
        {
            type: 'App Manifest',
            source: '"name": "Retail React App"',
            template: '"name": "{{answers.project.name}}"'
        }
    ]
    
    examples.forEach(example => {
        console.log(`📄 ${example.type}:`)
        console.log(`   Source:   ${example.source}`)
        console.log(`   Template: ${example.template}`)
        console.log()
    })
    
    console.log('4️⃣  GitHub Actions Integration:\n')
    
    console.log('📋 On Pull Request:')
    console.log('   • Detects template drift')
    console.log('   • Fails CI if templates are out of sync')
    console.log('   • Posts helpful comment with fix instructions')
    
    console.log('\n📋 On Push to main/develop:')
    console.log('   • Auto-syncs template files')
    console.log('   • Commits changes with descriptive message')
    console.log('   • Ensures templates never drift in main branches')
    
    console.log('\n' + '='.repeat(80) + '\n')
    
    console.log('🎯 Key Benefits:')
    console.log('   ✅ Eliminates manual synchronization')
    console.log('   ✅ Prevents template drift')
    console.log('   ✅ Catches issues in PRs before merge')
    console.log('   ✅ Provides clear instructions to developers')
    console.log('   ✅ Maintains single source of truth')
    
    console.log('\n📚 For more information, see: scripts/README-template-sync.md')
}

// Run the demo
runDemo().catch(error => {
    console.error('Demo failed:', error.message)
    process.exit(1)
})
