#!/usr/bin/env node
/* eslint-env node */
/**
 * This script sanity checks the package.json files in the monorepo.
 *
 * Among other things, it checks that packages are all using the same versions of
 * various development libraries and config files.
 *
 * WARNING: We know what you're going to say – "But why don't you just copy all the
 * devDependencies to the monorepo root and run 'lerna link convert'?". We have tried
 * to do that and given up.
 *
 * We're aiming to share no dependencies between monorepo packages. Instead, each
 * should install its own dependencies. We're doing this for two reasons:
 *
 *   1. There appear to be bugs in NPM that prevent us from doing `lerna link convert`
 *      and moving devDependencies to the root. We could never get this to work
 *      with packages that depend on each other within the monorepo.
 *
 *   2. When we generate a project we want to be able to make a copy of the pwa
 *      package and give it to an end-user as a starting point. This is *much* easier
 *      to do if that package doesn't have "secret" dependencies on libraries installed
 *      at the root that aren't explicitly listed in the pwa's package.json.
 *
 * Think carefully about those choices before making a change to this setup.
 */
const path = require('path')
const fs = require('fs')
const program = require('commander')
const semver = require('semver')

program.description(
    `Check that all packages are using the same versions of crucial libraries (eg.` +
    `compilers, linters etc) and their config files\n` +
    `Exits with a non-zero status if there is a problem with package dependencies.`
)

program.option('--fix', 'try to fix errors by copying the right dependencies and configs packages')

program.parse(process.argv)

const rootDir = path.join(__dirname, '..')
const packagesDir = path.join(rootDir, 'packages')
const assetsDir = path.join(__dirname, 'assets')

// The devcenter is excluded from all this, because Gatsby comes with its own
// opinionated build pipeline – it configures its own build tools.
const excludedPackages = [
    'devcenter'
]

// We are going to copy these files into each package from this script, in order to
// standardize them.
const commonConfigs = [
    'babel.config.js',
    '.eslintrc.js',
    '.prettierrc.yaml'
]

// We are going to copy these devDependencies into each package from this script,
// in order to standardize them.
const commonDevDeps = {
    '@babel/cli': '^7.4.4',
    '@babel/core': '^7.4.5',
    '@babel/parser': '^7.5.5',
    '@babel/plugin-proposal-object-rest-spread': '^7.4.4',
    '@babel/plugin-transform-async-to-generator': '^7.7.0',
    '@babel/plugin-transform-modules-commonjs': '^7.4.4',
    '@babel/plugin-transform-object-assign': '^7.2.0',
    '@babel/plugin-transform-runtime': '^7.6.2',
    '@babel/preset-env': '^7.4.5',
    '@babel/preset-react': '^7.0.0',
    '@babel/register': '^7.4.4',
    '@babel/runtime': '^7.7.2',
    '@babel/runtime-corejs2': '^7.4.5',
    '@babel/traverse': '^7.5.5',
    '@loadable/babel-plugin': '^5.12.0',
    'babel-eslint': '^7.2.1',
    'babel-jest': '^24.8.0',
    'babel-loader': '^8.0.6',
    'babel-plugin-dynamic-import-node-babel-7': '^2.0.7',
    commander: '^2.20.0',
    'cross-env': '^5.2.0',
    eslint: '^5.0.0',
    'eslint-config-prettier': '4.0.0',
    'eslint-import-resolver-webpack': '0.10.0',
    'eslint-plugin-import': '2.12.0',
    'eslint-plugin-jsx-a11y': '2.2.3',
    'eslint-plugin-prettier': '3.0.1',
    'eslint-plugin-react': '7.12.4',
    jest: '^24.9.0',
    'jest-cli': '^24.9.0',
    'jest-date-mock': '^1.0.7',
    'jest-each': '^24.8.0',
    'jest-environment-jsdom': '^24.8.0',
    'jest-environment-jsdom-global': '^1.2.0',
    'jest-expect-message': '1.0.0',
    'jest-fetch-mock': '^2.1.2',
    'jest-localstorage-mock': '^2.4.0',
    'mobify-code-style': '^2.8.5',
    nock: '^10.0.0',
    prettier: '1.18.2',
    'regenerator-runtime': '^0.11.1',
    semver: '^7.3.2',
    shelljs: '^0.8.4'
}

const readJSON = (path) => JSON.parse(fs.readFileSync(path))

const writeJSON = (path, content) => fs.writeFileSync(path, JSON.stringify(content, null, 2))


const listPackages = () => {
    return fs
        .readdirSync(packagesDir)
        .filter((x) => excludedPackages.indexOf(x) < 0)
        .map((dir) => path.join(packagesDir, dir))
}

/**
 * Try to fix errors by copying dependencies and configs into each package,
 * overwriting changes in the package. This isn't perfect and doesn't handle
 * lockfiles!
 */
const fix = () => {
    listPackages().forEach((pkgDir) => {
        const pkgFile = path.join(pkgDir, 'package.json')
        const pkg = readJSON(pkgFile)
        const all = {
            ...(pkg.devDependencies || {}),
            ...commonDevDeps
        }
        const final = {}
        Object.keys(all)
            .sort()
            .forEach((k) => {
                final[k] = all[k]
            })
        pkg.devDependencies = final
        writeJSON(pkgFile, pkg)
        commonConfigs.forEach((name) => fs.copyFileSync(
            path.join(assetsDir, name),
            path.join(pkgDir, name)
        ))
    })
}

/**
 * Sanity-check the monorepo's package.json files.
 */
const check = () => {
    const errors = []
    const rootPkg = readJSON(path.join(rootDir, 'package.json'))

    if (rootPkg.dependencies !== undefined) {
        errors.push(`The root package.json must not have any dependencies (only devDependencies)`)
    }

    // The root can have devDependencies, but only if those are also included in the
    // shared devDependencies - this is to prevent packages accidentally depending
    // on something not included in their own package.json. The only exception here
    // is lerna, that we never want installed in a package.
    Object.entries(rootPkg.devDependencies)
        .forEach(([name, version]) => {
            if(name !== 'lerna' && commonDevDeps[name] !== version) {
                errors.push(
                    `The root package.json has "${name}@${version}" as a devDependency ` +
                    `which is not a whitelisted development package. See the check-dependencies script.`
                )
            }
        })

    // Maps package-name -> the peerDependencies section for each monorepo-local
    // package, used for sense-checking dependencies later on.
    const peerDependenciesByPackage = {}
    listPackages().forEach((pkgDir) => {
        const pkgFile = path.join(pkgDir, 'package.json')
        const pkg = readJSON(pkgFile)
        peerDependenciesByPackage[pkg.name] = pkg.peerDependencies || {}
    })

    listPackages().forEach((pkgDir) => {
        const pkgFile = path.join(pkgDir, 'package.json')
        const pkg = readJSON(pkgFile)
        Object.entries(commonDevDeps)
            .forEach(([name, requiredVersion]) => {
                const foundVersion = pkg.devDependencies[name] || pkg.dependencies[name]
                if (foundVersion && foundVersion !== requiredVersion) {
                    errors.push(
                        `Package "${pkg.name}" requires "${name}@${foundVersion}" but we've standardized on ` +
                        `"${name}@${requiredVersion}" in the monorepo. To fix this, change the version in ${pkg.name} to match "${name}@${requiredVersion}."`)
                }
            })

        commonConfigs.forEach((name) => {
            const src = path.join(assetsDir, name)
            const dest = path.join(pkgDir, name)
            if (!fs.readFileSync(src).equals(fs.readFileSync(dest))) {
                errors.push(`The config file at "${dest}" does not match the template in "${src}"`)
            }
        })

        // If the current package, X, depends on a monorepo local package, Y, then
        // ensure that X installs all of Y's peerDependencies.
        Object.entries(peerDependenciesByPackage).forEach(([localPackageName, localPeerDeps]) => {
            const dependsOnLocalPackage = !!(pkg.dependencies[localPackageName] || pkg.devDependencies[localPackageName])
            if (dependsOnLocalPackage) {
                Object.entries(localPeerDeps).forEach(([requiredPackage, requiredRange]) => {
                    const foundRange = pkg.dependencies[requiredPackage] || pkg.devDependencies[requiredPackage]
                    const satisfied = semver.subset(foundRange, requiredRange)
                    if (!satisfied) {
                        errors.push(
                            `Package "${pkg.name}" depends on package "${localPackageName}", but is missing one of` +
                            ` its peerDependencies "${requiredPackage}@${requiredRange}"`
                        )
                    }
                })
            }
        })

        const intersection = (setA, setB) => {
            let _intersection = []
            for (let elem of setB) {
                if (setA.has(elem)) {
                    _intersection.push(elem)
                }
            }
            return _intersection
        }

        const difference = (setA, setB) => {
            let _difference = new Set(setA)
            for (let elem of setB) {
                _difference.delete(elem)
            }
            return _difference
        }

        const dependencies = new Set(Object.keys(pkg.dependencies || {}))
        const devDependencies = new Set(Object.keys(pkg.devDependencies || {}))
        const peerDependencies = new Set(Object.keys(pkg.peerDependencies || {}))

        // If the current package lists peerDependencies then it must not include them
        // in its own dependencies - it's an end-user's job to provide them.
        const mistakenlySuppliedPeers = intersection(dependencies, peerDependencies)
        if (mistakenlySuppliedPeers.size > 0) {
            errors.push(
                `Package "${pkg.name}" has peerDependencies that also appear in its own dependencies: ` +
                `${Array.from(mistakenlySuppliedPeers).join(", ").toString()}`
            )
        }

        // If the current package lists peerDependencies then it must include them
        // in its own devDependencies for development.
        const peersNotInstalledForDev = difference(peerDependencies, devDependencies)
        if (peersNotInstalledForDev.size > 0) {
            errors.push(
                `Package "${pkg.name}" has peerDependencies that are not installed as devDependencies: ` +
                `${Array.from(peersNotInstalledForDev).join(", ").toString()}`
            )
        }

        // The current package must not have the same library listed in both
        // dependencies and devDependencies – this triggers warnings on NPM install.
        const duplicates = intersection(dependencies, devDependencies);
        if (duplicates.size > 0) {
            errors.push(
                `Package "${pkg.name}" has libraries that appear in both dependencies and devDependencies: "${Array.from(duplicates).join(", ").toString()}"`
            )
        }
    })

    if (errors.length) {
        errors.forEach((err) => console.error(err))
        process.exit(1)
    }
}


const main = (opts) => {
    const action = opts.fix ? fix : check
    action()
}

main(program)
