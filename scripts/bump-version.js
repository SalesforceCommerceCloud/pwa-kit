#!/usr/bin/env node
/* eslint-env node */

const sh = require("shelljs")
const path = require("path")
const fs = require("fs")

sh.set("-e")
const lernaConfigPath = path.join(__dirname, "..", "lerna.json")
const rootPkgPath = path.join(__dirname, "..", "package.json")
const rootPkgLockPath = path.join(__dirname, "..", "package-lock.json")

const main = () => {
    sh.exec(`lerna version --no-push --no-git-tag-version --yes ${process.argv.slice(2).join(' ')}`)
    sh.exec(`npm install`)
    const lernaConfig = JSON.parse(sh.cat(lernaConfigPath));
    const rootPkg = JSON.parse(sh.cat(rootPkgPath))
    const rootLockPkg = JSON.parse(sh.cat(rootPkgLockPath))

    // find all packages
    sh.exec('npm run --silent lerna -- list --all --json', function(code, stdout, stderr) {
        const packages = JSON.parse(stdout.toString())

        const lernaPackageNames = packages.map(pkg => pkg.name)
        packages.forEach(async ({location}) => {
            const pkgFile = path.join(location, 'package.json')
            const pkg =  await fs.promises.readFile(pkgFile, 'utf-8')
            const peerDependencies = JSON.parse(pkg).peerDependencies
            peerDependencies && Object.keys(peerDependencies).forEach(dep => {
                if (lernaPackageNames.includes(dep)) {
                    console.log(`Lerna local packages ${dep} is found as a peerDependencies`)
                    peerDependencies[dep] = `^${lernaConfig.version}`
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

main();
