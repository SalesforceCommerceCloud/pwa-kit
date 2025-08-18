#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Validation script specifically for commerce-sdk-isomorphic@4.0.0 upgrade
 * Checks for common breaking changes and TypeScript issues
 */

const childProc = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('=== COMMERCE SDK UPGRADE VALIDATION ===')

const commerceSdkPath = path.join(process.cwd(), 'packages/commerce-sdk-react')

// Check 1: Verify commerce-sdk-isomorphic version
function checkVersion() {
    console.log('\n📋 Checking commerce-sdk-isomorphic version...')
    
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(commerceSdkPath, 'package.json'), 'utf8'))
        const version = pkg.dependencies['commerce-sdk-isomorphic']
        console.log(`✅ Package.json version: ${version}`)
        
        // Check installed version
        const nodeModulesPath = path.join(commerceSdkPath, 'node_modules/commerce-sdk-isomorphic/package.json')
        if (fs.existsSync(nodeModulesPath)) {
            const installedPkg = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf8'))
            console.log(`✅ Installed version: ${installedPkg.version}`)
            
            if (!installedPkg.version.startsWith('4.')) {
                console.log('❌ WARNING: Installed version is not 4.x.x!')
                return false
            }
        } else {
            console.log('⚠️ commerce-sdk-isomorphic not found in node_modules')
        }
        
        return true
    } catch (error) {
        console.log(`❌ Failed to check version: ${error.message}`)
        return false
    }
}

// Check 2: Verify ShopperSEO imports (breaking change from ShopperSeo)
function checkShopperSEOImports() {
    console.log('\n📋 Checking ShopperSEO imports...')
    
    const filesToCheck = [
        'src/hooks/index.ts',
        'src/hooks/ShopperSEO/query.ts',
        'src/hooks/ShopperSEO/queryKeyHelpers.ts',
        'src/hooks/types.ts',
        'src/provider.tsx'
    ]
    
    let allGood = true
    
    for (const file of filesToCheck) {
        const fullPath = path.join(commerceSdkPath, file)
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8')
            
            // Check for old ShopperSeo (should be ShopperSEO)
            if (content.includes('ShopperSeo') && !content.includes('ShopperSEO')) {
                console.log(`❌ ${file}: Still using old 'ShopperSeo' instead of 'ShopperSEO'`)
                allGood = false
            } else if (content.includes('ShopperSEO')) {
                console.log(`✅ ${file}: Using correct 'ShopperSEO'`)
            }
        } else {
            console.log(`⚠️ ${file}: File not found`)
        }
    }
    
    return allGood
}

// Check 3: Test TypeScript compilation
function checkTypeScriptCompilation() {
    console.log('\n📋 Testing TypeScript compilation...')
    
    try {
        const result = childProc.execSync('npm run typecheck', {
            cwd: commerceSdkPath,
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 300000 // 5 minutes
        })
        
        console.log('✅ TypeScript compilation successful')
        return true
    } catch (error) {
        console.log('❌ TypeScript compilation failed')
        console.log('Error output:')
        console.log(error.stdout || error.stderr || error.message)
        return false
    }
}

// Check 4: Test basic imports
function checkBasicImports() {
    console.log('\n📋 Testing basic imports...')
    
    const testScript = `
        console.log('Testing commerce-sdk-isomorphic imports...');
        try {
            const sdk = require('commerce-sdk-isomorphic');
            console.log('✅ Basic import successful');
            
            if (sdk.ShopperSEO) {
                console.log('✅ ShopperSEO export found');
            } else {
                console.log('❌ ShopperSEO export missing');
                process.exit(1);
            }
            
            if (sdk.ShopperSeo) {
                console.log('⚠️ Old ShopperSeo export still exists');
            }
            
            console.log('Version:', require('commerce-sdk-isomorphic/package.json').version);
            console.log('✅ All imports successful');
        } catch (error) {
            console.log('❌ Import failed:', error.message);
            process.exit(1);
        }
    `
    
    try {
        const result = childProc.execSync(`node -e "${testScript}"`, {
            cwd: commerceSdkPath,
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 60000 // 1 minute
        })
        
        console.log(result)
        return true
    } catch (error) {
        console.log('❌ Import test failed')
        console.log(error.stdout || error.stderr || error.message)
        return false
    }
}

// Check 5: Test build process
function checkBuild() {
    console.log('\n📋 Testing build process...')
    
    try {
        const result = childProc.execSync('npm run build', {
            cwd: commerceSdkPath,
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 600000 // 10 minutes
        })
        
        console.log('✅ Build successful')
        return true
    } catch (error) {
        console.log('❌ Build failed')
        console.log('Error output:')
        console.log(error.stdout || error.stderr || error.message)
        return false
    }
}

// Run all checks
async function runValidation() {
    console.log('Starting validation checks...')
    
    let allChecksPass = true
    
    allChecksPass &= checkVersion()
    allChecksPass &= checkShopperSEOImports()
    allChecksPass &= checkBasicImports()
    allChecksPass &= checkTypeScriptCompilation()
    allChecksPass &= checkBuild()
    
    console.log('\n=== VALIDATION SUMMARY ===')
    if (allChecksPass) {
        console.log('🎉 All checks passed! Commerce SDK upgrade appears successful.')
        process.exit(0)
    } else {
        console.log('❌ Some checks failed. Review the output above for details.')
        console.log('💡 Common issues after commerce-sdk-isomorphic@4.0.0 upgrade:')
        console.log('   - ShopperSeo → ShopperSEO naming changes')
        console.log('   - API method signature changes')
        console.log('   - New TypeScript strict typing requirements')
        process.exit(1)
    }
}

runValidation().catch(error => {
    console.error('❌ Validation script failed:', error)
    process.exit(1)
})
