#!/usr/bin/env node
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
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
 *   2. When we generate a project we want to be able to make a copy of the
 *      template-retail-react-app package and give it to an end-user as a starting point.
 *      This is *much* easier to do if that package doesn't have "secret" dependencies on
 *      libraries installed at the root that aren't explicitly listed in the pwa's package.json.
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

const excludedPackages = [
    // The 'template-express-minimal' app is explicitly designed to show what
    // you can do without our whole toolchain!
    'template-express-minimal'
]

// We are going to copy these files into each package from this script, in order to
// standardize them.
const commonConfigs = ['.prettierrc.yaml']

// We are going to copy these devDependencies into each package from this script,
// in order to standardize them.
const commonDevDeps = {
    'cross-env': '^5.2.0'
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
        commonConfigs.forEach((name) =>
            fs.copyFileSync(path.join(assetsDir, name), path.join(pkgDir, name))
        )
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

    // Maps package-name -> the peerDependencies section for each monorepo-local
    // package, used for sense-checking dependencies later on.
    const peerDependenciesByPackage = {}

    // Maps package-name -> the peerDependenciesMeta section for each monorepo-local
    // package, used for sense-checking dependencies later on.
    const peerDependenciesMetaByPackage = {}

    listPackages().forEach((pkgDir) => {
        const pkgFile = path.join(pkgDir, 'package.json')
        const pkg = readJSON(pkgFile)
        peerDependenciesByPackage[pkg.name] = pkg.peerDependencies || {}
        peerDependenciesMetaByPackage[pkg.name] = pkg.peerDependenciesMeta || {}
    })

    listPackages().forEach((pkgDir) => {
        const pkgFile = path.join(pkgDir, 'package.json')
        const pkg = readJSON(pkgFile)

        if (pkg.version !== rootPkg.version) {
            errors.push(
                `Package "${pkg.name}" is at version "${pkg.version}" but it needs to match the root package version at "${rootPkg.version}"`
            )
        }

        const nodeVersion = (pkg.engines || {}).node
        const npmVersion = (pkg.engines || {}).npm

        if (nodeVersion !== rootPkg.engines.node) {
            errors.push(
                `Package "${pkg.name}" has engines.node set to "${nodeVersion}", but it must match the root package engines.node at "${rootPkg.engines.node}"`
            )
        }

        if (npmVersion !== rootPkg.engines.npm) {
            errors.push(
                `Package "${pkg.name}" has engines.npm set to "${npmVersion}", but it must match the root package engines.npm at "${rootPkg.engines.npm}"`
            )
        }

        Object.entries(commonDevDeps).forEach(([name, requiredVersion]) => {
            const foundVersion = (pkg.devDependencies || {})[name] || (pkg.dependencies || {})[name]
            if (foundVersion && foundVersion !== requiredVersion) {
                errors.push(
                    `Package "${pkg.name}" requires "${name}@${foundVersion}" but we've standardized on ` +
                        `"${name}@${requiredVersion}" in the monorepo. To fix this, change the version in ${pkg.name} to match "${name}@${requiredVersion}."`
                )
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
            const dependsOnLocalPackage = !!(
                (pkg.dependencies || {})[localPackageName] ||
                (pkg.devDependencies || {})[localPackageName]
            )
            const dependencyIsOptional = Boolean(
                (peerDependenciesMetaByPackage[pkg.name][localPackageName] || {})['optional']
            )

            if (dependsOnLocalPackage) {
                Object.entries(localPeerDeps).forEach(([requiredPackage, requiredRange]) => {
                    const peerIsOptional = Boolean(
                        (peerDependenciesMetaByPackage[localPackageName][requiredPackage] || {})[
                            'optional'
                        ]
                    )

                    const isCircular = pkg.name === requiredPackage

                    if (isCircular) {
                        if (!dependencyIsOptional && !peerIsOptional) {
                            errors.push(
                                [
                                    `Forbidden circular dependency found:`,
                                    ``,
                                    `  "${pkg.name}" => (${
                                        dependencyIsOptional ? 'optional' : 'required'
                                    }) "${localPackageName}" => (${
                                        peerIsOptional ? 'optional' : 'required'
                                    }) "${requiredPackage}".`,
                                    ``,
                                    `  If "${pkg.name}" and "${localPackageName}" have required dependencies on each other,`,
                                    `  they are better combined into one package – one can't work without the other.`,
                                    ``
                                ].join('\n')
                            )
                        } else {
                            // Optional circular dependencies are okay – eg. the runtime is usable without having
                            // build tools installed, but build tools might depend on the runtime.
                            const circularSatisfied = semver.satisfies(pkg.version, requiredRange)
                            if (!circularSatisfied) {
                                errors.push(
                                    `Circular dependency not satisfied "${pkg.name}@${pkg.version}" -> "${localPackageName}" -> "${requiredPackage}@${requiredRange}"`
                                )
                            }
                        }
                    } else {
                        const foundRange =
                            (pkg.dependencies || {})[requiredPackage] ||
                            (pkg.devDependencies || {})[requiredPackage]
                        const satisfied = foundRange && semver.subset(foundRange, requiredRange)
                        if (!peerIsOptional && !satisfied) {
                            errors.push(
                                `Package "${pkg.name}" depends on package "${localPackageName}", but is missing one of` +
                                    ` its peerDependencies "${requiredPackage}@${requiredRange}"`
                            )
                        }
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
                    `${Array.from(mistakenlySuppliedPeers)
                        .join(', ')
                        .toString()}`
            )
        }

        // If the current package lists required – not optional! – peerDependencies then it
        // must include them in its own devDependencies for development.
        const peersNotInstalledForDev = difference(peerDependencies, devDependencies)

        const optionalPeers = Object.entries(pkg.peerDependenciesMeta || {})
            .map(([peer, data]) => ((data || {})['optional'] ? peer : undefined))
            .filter(Boolean)

        const peersNotInstalledForDevAndRequired = difference(
            peersNotInstalledForDev,
            optionalPeers
        )

        if (peersNotInstalledForDevAndRequired.size > 0) {
            errors.push(
                `Package "${pkg.name}" has peerDependencies that are not installed as devDependencies: ` +
                    `${Array.from(peersNotInstalledForDev)
                        .join(', ')
                        .toString()}`
            )
        }

        // The current package must not have the same library listed in both
        // dependencies and devDependencies – this triggers warnings on NPM install.
        const duplicates = intersection(dependencies, devDependencies)
        if (duplicates.size > 0) {
            errors.push(
                `Package "${
                    pkg.name
                }" has libraries that appear in both dependencies and devDependencies: "${Array.from(
                    duplicates
                )
                    .join(', ')
                    .toString()}"`
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
