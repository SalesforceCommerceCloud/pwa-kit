#!/usr/bin/env node
/* eslint-env node */

const sh = require("shelljs")
const path = require("path")

sh.set("-e")
const lernaConfigPath = path.join(__dirname, '..', 'lerna.json')
const rootPkgPath = path.join(__dirname, '..', 'package.json')
const rootPkgLockPath = path.join(__dirname, '..', 'package-lock.json')

const main = () => {
    sh.exec(`lerna version --no-push --no-git-tag-version --yes ${process.argv.slice(2).join(' ')}`)
    sh.exec(`npm install`)
    const lernaConfig = JSON.parse(sh.cat(lernaConfigPath))
    const rootPkg = JSON.parse(sh.cat(rootPkgPath))
    const rootLockPkg = JSON.parse(sh.cat(rootPkgLockPath))

    // find all monorepo packages, look inside each package json, find peerDependency that is a monorepo package
    // and update it with a new version
    sh.exec('lerna -- list --all --json', {silent: true}, function(code, stdout) {
        const packages = JSON.parse(stdout.toString())

        const lernaPackageNames = packages.map(pkg => pkg.name)
        packages.forEach(({location}) => {
            const pkgFilePath = path.join(location, 'package.json')
            const pkg = JSON.parse(sh.cat(pkgFilePath))
            const peerDependencies = pkg.peerDependencies
            peerDependencies && Object.keys(peerDependencies).forEach(dep => {
                if (lernaPackageNames.includes(dep)) {
                    console.log(`Lerna local packages ${dep} is found as a peerDependencies`)
                    peerDependencies[dep] = `^${lernaConfig.version}`
                    new sh.ShellString(JSON.stringify(pkg, null, 2)).to(pkgFilePath)
                }
            })

        });
    })

    // update versions for root package and root package lock
    rootPkg.version = lernaConfig.version
    rootLockPkg.version = lernaConfig.version
    new sh.ShellString(JSON.stringify(rootPkg, null, 2)).to(rootPkgPath)
    new sh.ShellString(JSON.stringify(rootLockPkg, null, 2)).to(rootPkgLockPath)
};

main()
