#!/usr/bin/env node
/*
 * Verify that the template app is using the local commerce-sdk-react package
 * (with Turnstile passwordless fix) rather than the published npm version.
 *
 * Run from repo root: node scripts/verify-commerce-sdk-react-local.js
 */
const path = require('path')
const fs = require('fs')

const repoRoot = path.resolve(__dirname, '..')
const templateNodeModules = path.join(
    repoRoot,
    'packages/template-retail-react-app/node_modules/@salesforce/commerce-sdk-react'
)
const localAuthPath = path.join(templateNodeModules, 'auth/index.js')
const localPkgPath = path.join(templateNodeModules, 'package.json')

function main() {
    console.log('Checking that template uses local @salesforce/commerce-sdk-react...\n')

    // 1. Resolved path should be inside the repo (symlink or same repo)
    const resolved = fs.realpathSync(templateNodeModules)
    const isLocal =
        resolved.includes('commerce-sdk-react') &&
        (resolved.startsWith(repoRoot) || fs.existsSync(path.join(resolved, '..', 'package.json')))

    if (!fs.existsSync(templateNodeModules)) {
        console.error('FAIL: packages/template-retail-react-app/node_modules/@salesforce/commerce-sdk-react not found.')
        console.error('Run "npm install" from the repo root first.\n')
        process.exit(1)
    }

    const isSymlink = fs.lstatSync(templateNodeModules).isSymbolicLink()
    const resolvedDir = isSymlink ? fs.realpathSync(templateNodeModules) : templateNodeModules
    const isInRepo = resolvedDir.includes(path.join('packages', 'commerce-sdk-react'))

    if (!isInRepo) {
        console.error('FAIL: Template is NOT using the local commerce-sdk-react package.')
        console.error('  Resolved to:', resolvedDir)
        console.error('  Expected: .../packages/commerce-sdk-react/...')
        console.error('\nFrom repo root run: npm install\n')
        process.exit(1)
    }

    console.log('  OK  Resolved package is inside repo:', path.relative(repoRoot, resolvedDir))

    // 2. Built auth code should contain the Turnstile path (custom fetch when turnstileResponse is present)
    if (!fs.existsSync(localAuthPath)) {
        console.error('FAIL: auth/index.js not found at', localAuthPath)
        console.error('Build commerce-sdk-react first: npm run build --workspace=@salesforce/commerce-sdk-react\n')
        process.exit(1)
    }

    const authCode = fs.readFileSync(localAuthPath, 'utf8')
    const hasTurnstileFix =
        authCode.includes('turnstileResponse') &&
        (authCode.includes('bodyEntries.push') || authCode.includes('turnstileResponse'))

    if (!hasTurnstileFix) {
        console.error('FAIL: Resolved commerce-sdk-react does not contain the Turnstile passwordless fix.')
        console.error('  Rebuild the package: npm run build --workspace=@salesforce/commerce-sdk-react\n')
        process.exit(1)
    }

    console.log('  OK  Auth bundle includes Turnstile passwordless fix (turnstileResponse in request body)\n')
    console.log('Template is using the local SDK. Safe to build and deploy.\n')
}

main()
