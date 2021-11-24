#!/usr/bin/env node
const p = require('path');
const program = require('commander');
const {execSync} = require('child_process');


// TODO: Won't work when deployed to NPM - need to resolve differently
const webpack = require.resolve('webpack/bin/webpack')
const webpackConf = p.resolve(p.join(__dirname, '..', 'webpack', 'config-modern.js'))

const prettier = p.resolve(p.join(__dirname, '..', 'node_modules', '.bin', 'prettier'))

const main = () => {
    process.env.CONTEXT = process.cwd();
    program.description(`The Managed Runtime CLI`)

    program.command('login')
        .description(`login to Managed Runtime and save your credentials`)
        .action(() => {
            console.log('Logging in...')
        })

    program.command('dev')
        .description(`develop your app locally`)
        .action(() => {
            execSync(`node ${p.join(process.cwd(), 'app', 'ssr.js')}`, {stdio: 'inherit'})
        })

    program.command('build')
        .description(`build your app for production`)
        .action(() => {
            execSync(`${webpack} --config ${webpackConf}`, {stdio: 'inherit'})
        })

    program.command('push')
        .description(`push a bundle to managed runtime`)
        .action(() => {
            console.log('Pushing...')
        })

    program.command('format')
        .description(`automatically re-format all source files`)
        .action(() => {
            execSync(`${prettier} --write ${p.join(process.cwd(), 'app')}`, {stdio: 'inherit'})
        })

    program.command('generate')
        .description(`generate a new project, based on a template`)
        .action(() => {
            console.log('Generating a new project')
        })

    program.command('test')
        .description(`run your project's tests`)
        .action(() => {
            console.log('Running tests')
        })

    program.parse(process.argv)
}

main()