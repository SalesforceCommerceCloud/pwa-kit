#!/usr/bin/env node
const p = require('path')
const program = require('commander')
const sh = require('shelljs')

sh.set('-e')

const babel = p.resolve(p.join(__dirname, '..', 'node_modules', '.bin', 'babel'))
const babelConfig = p.resolve(p.join(__dirname, 'babel.config.js'))

const main = () => {
    program.description(`Internal build tools for monorepo libraries`)

    program
        .command('build')
        .action(() => {
            sh.rm('-rf', './dist')
            sh.mkdir('./dist')
            sh.exec(`${babel} --config-file ${babelConfig} src -x ".js",".jsx" --ignore "**/test_fixtures/*","*.test.js","test.js" --out-dir dist`)
            sh.exec(`./prepare-dist.js`)
        })

    program.parse(process.argv)
}

main()
