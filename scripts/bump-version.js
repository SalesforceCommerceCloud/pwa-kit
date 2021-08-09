#!/usr/bin/env node
/* eslint-env node */

const sh = require('shelljs')
const path = require('path')

sh.set('-e')

const lernaConfigPath = path.join(__dirname, '..', 'lerna.json')
const rootPkgPath = path.join(__dirname, '..', 'package.json')

const main = () => {
    sh.exec(`lerna version --no-push --no-git-tag-version --yes ${process.argv.slice(2).join(' ')}`)
    sh.exec(`npm install`)
    const lernaConfig = JSON.parse(sh.cat(lernaConfigPath))
    const rootPkg = JSON.parse(sh.cat(rootPkgPath))
    rootPkg.version = lernaConfig.version
    new sh.ShellString(JSON.stringify(rootPkg, null, 2)).to(rootPkgPath)
}

main()
