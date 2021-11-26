#!/usr/bin/env node
const p = require('path')
const fs = require('fs')
const program = require('commander')
const isEmail = require('validator/lib/isEmail')
const {execSync} = require('child_process')
const scriptUtils = require('../scripts/utils')
const sh = require('shelljs')

// TODO: Won't work when deployed to NPM - need to resolve differently
const webpack = require.resolve('webpack/bin/webpack')
const webpackConf = p.resolve(p.join(__dirname, '..', 'webpack', 'config.js'))

const prettier = p.resolve(p.join(__dirname, '..', 'node_modules', '.bin', 'prettier'))

const main = () => {
    process.env.CONTEXT = process.cwd()
    program.description(`The Managed Runtime CLI`)

    program
        .command('login')
        .description(`login to Managed Runtime`)
        .requiredOption(
            '-u, --user <email>',
            `the e-mail address you used to register with Mobify Cloud`,
            (val) => {
                if (!isEmail(val)) {
                    throw new program.InvalidArgumentError(`"${val}" is not a valid email`)
                } else {
                    return val
                }
            }
        )
        .requiredOption(
            '-k --key <api-key>',
            `find your API key at https://runtime.commercecloud.com/account/settings`,
            (val) => {
                if (!(typeof val === 'string') && val.length > 0) {
                    throw new program.InvalidArgumentError(`"${val}" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .action(({user, key}) => {
            try {
                const settingsPath = scriptUtils.getSettingsPath()
                fs.writeFileSync(
                    settingsPath,
                    JSON.stringify({username: user, api_key: key}, null, 4)
                )
                console.log(`Saved credentials to "${settingsPath}".`)
            } catch (e) {
                console.error('Failed to save credentials.')
                console.error(e)
                process.exit(1)
            }
        })

    program
        .command('dev')
        .description(`develop your app locally`)
        .action(() => {
            execSync(`node ${p.join(process.cwd(), 'app', 'ssr.js')}`, {stdio: 'inherit'})
        })

    program
        .command('build')
        .description(`build your app for production`)
        .action(() => {
            const original = sh.config.silent
            sh.config.silent = true
            try {
                sh.rm('-rf', './build')
                sh.mkdir('-p', './build/node_modules')
                sh.exec(`${webpack} --config ${webpackConf}`)
                sh.cp('-RL', './node_modules/*', './build/node_modules')
                sh.cp('./app/ssr.js', './package.json', './package-lock.json', './build/')
                sh.pushd('./build')
                sh.exec('npm prune --production')
                sh.popd()
            } finally {
                sh.config.silent = original
            }
        })

    program
        .command('push')
        .description(`push a bundle to managed runtime`)
        .action(() => {
            console.log('Pushing...')
        })

    program
        .command('format')
        .description(`automatically re-format all source files`)
        .action(() => {
            execSync(`${prettier} --write ${p.join(process.cwd(), 'app')}`, {stdio: 'inherit'})
        })

    program
        .command('generate')
        .description(`generate a new project, based on a template`)
        .action(() => {
            console.log('Generating a new project')
        })

    program
        .command('test')
        .description(`run your project's tests`)
        .action(() => {
            console.log('Running tests')
        })

    program.parse(process.argv)
}

main()
