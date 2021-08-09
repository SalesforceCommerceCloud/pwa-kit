#!/usr/bin/env node

/* eslint import/no-commonjs:0 no-useless-escape:0*/

/**
 * This is a generator for projects that run on the Mobify platform.
 *
 * The output of this script is a copy of the pwa package with the following changes:
 *
 * 1) We update any monorepo-local dependencies to be installed through NPM.
 *
 * 2) We rename the PWA and configure the generated project based on answers to
 *    questions that we ask the user on the CLI.
 *
 * ## Basic usage
 *
 * We expect end-users to generate projects by running `npx @mobify/create-app` on
 * the CLI and following the prompts. Users must be able to run that command without
 * installing any dependencies first.
 *
 * ## Advanced usage and integration testing:
 *
 * In order to skip prompts on CircleCI, the generator supports a purposefully
 * undocumented `PRESET` environment variable, which you can use to skip the prompts
 * in a CI environment. These presets run the generator with hard-coded answers to
 * the questions we would normally ask an end-user. Supported presets are:
 *
 *   1. "test-project" - A test project using the demo connector.
 *   2. "test-project-sffc" - A test project using the SFCC connector.
 */
const p = require('path')
const program = require('commander')
const inquirer = require('inquirer')
const url = require('url')
const deepmerge = require('deepmerge')
const sh = require('shelljs')
const generatorPkg = require('../package.json')

sh.set('-e')

const GENERATED_PROJECT_VERSION = '0.0.1'

const TEST_PROJECT = 'test-project'
const TEST_PROJECT_SFCC = 'test-project-sfcc'
const PROMPT = 'prompt'

const PRESETS = [TEST_PROJECT, TEST_PROJECT_SFCC, PROMPT]

const GENERATOR_PRESET = process.env.GENERATOR_PRESET || PROMPT

const DEFAULT_OUTPUT_DIR = p.join(process.cwd(), 'generated-project')

const SDK_VERSION = generatorPkg.version

// Generator Supported Connectors
const DEFAULT_CONNECTOR = 'sfcc'
const SUPPORTED_CONNECTORS = {
    scraping: 'Web Scraping',
    sfcc: 'Salesforce',
    demo: 'Demo'
}

const readJson = (path) => JSON.parse(sh.cat(path))

const writeJson = (path, data) => new sh.ShellString(JSON.stringify(data, null, 2)).to(path)

const testProjectAnswers = (connectorType = DEFAULT_CONNECTOR) => {
    const siteName = `${connectorType}-test-project`
    const proxyConfigs = {
        scraping: {
            protocol: 'https',
            host: 'www.merlinspotions.com',
            path: 'api'
        },
        sfcc: {
            protocol: 'https',
            host: 'zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
            path: 'api'
        },
        demo: {
            protocol: 'https',
            host: 'example.com',
            path: 'api'
        }
    }
    return {
        'scaffold-pwa': {
            siteName,
            siteUrl: 'https://www.example.com/',
            projectSlug: siteName,
            aJSSlug: siteName,
            name: siteName,
            version: '0.0.1',
            mobify: {
                ssrParameters: {
                    proxyConfigs: [proxyConfigs[connectorType]]
                }
            }
        },
        globals: {
            theme_color: '#ffffff',
            connectorType
        }
    }
}

const replaceJSON = (path, replacements) =>
    writeJson(path, Object.assign(readJson(path), replacements))

const getConnectorType = (answers) => (answers.globals || {}).connectorType || DEFAULT_CONNECTOR

/**
 * Deeply merge two objects in such a way that all array entries in b replace array
 * entries in a, eg:
 *
 * merge(
 *   {foo: 'foo', items: [{thing: 'a'}]},
 *   {bar: 'bar', items: [{thing: 'b'}]}
 *  )
 * > {foo: 'foo', bar: 'bar', items: [{thing: 'b'}]}
 *
 * @param a
 * @param b
 * @return {*}
 */
const merge = (a, b) => deepmerge(a, b, {arrayMerge: (orignal, replacement) => replacement})

/**
 * @param answers - a map of package-names to package.json values that are
 *   deep-merged with each package's original package.json data. Eg:
 *
 *   {
 *      "scaffold-pwa": {
 *          "name": "new-project-web",
 *          "version": "0.0.1",
 *      }
 *   }
 *
 * Each package name included in the object's keys will be copied into the
 * generated project, all others are excluded.
 */
const runGenerator = (answers, {outputDir}) => {
    // These are the public, mobify-owned packages that can be installed through NPM.
    const npmInstallables = ['@mobify/commerce-integrations', 'progressive-web-sdk']

    // Check specified SDK versions actually exist on NPM.
    npmInstallables.forEach((pkgName) => {
        const versions = JSON.parse(sh.exec(`npm view ${pkgName} versions --json`, {silent: true}))
        if (versions.indexOf(SDK_VERSION) < 0) {
            const msg =
                `Error: You're generating a project using version "${SDK_VERSION}" of ` +
                `Mobify's SDKs, but "${pkgName}@${SDK_VERSION}" does not exist on NPM.\n` +
                `The available versions are:\n${versions.map((v) => `  ${v}`).join('\n')}`
            console.error(msg)
            process.exit(1)
        }
    })

    sh.cp('-R', p.join(__dirname, '..', 'template'), outputDir)

    const pkgJsonPath = p.resolve(outputDir, 'package.json')
    const pkgJSON = readJson(pkgJsonPath)
    const finalPkgData = merge(pkgJSON, answers['scaffold-pwa'])

    npmInstallables.forEach((pkgName) => {
        const keys = ['dependencies', 'devDependencies']
        keys.forEach((key) => {
            const deps = finalPkgData[key]
            if (deps && deps[pkgName]) {
                deps[pkgName] = SDK_VERSION
            }
        })
    })

    writeJson(pkgJsonPath, finalPkgData)

    const manifest = p.resolve(outputDir, 'app', 'static', 'manifest.json')
    replaceJSON(manifest, {
        name: finalPkgData.siteName,
        short_name: finalPkgData.siteName,
        start_url: '/?homescreen=1',
        theme_color: answers.globals.theme_color,
        icons: [
            {
                src: './img/global/app-icon-192.png',
                sizes: '192x192'
            },
            {
                src: './img/global/app-icon-512.png',
                sizes: '512x512'
            }
        ]
    })
    const template = require(`../assets/pwa/${getConnectorType(answers)}-connector`).template
    const data = {
        proxyPath: answers['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[0].path
    }
    new sh.ShellString(template(data)).to(p.resolve(outputDir, 'app', 'connector.js'))

    console.log('Installing dependencies for the generated project (this can take a while)')
    sh.exec(`npm install --no-progress`, {
        env: process.env,
        cwd: outputDir,
        silent: true
    })
}

const prompts = () => {
    const slug = (x) => Boolean(/^[a-z0-9_-]+$/.exec(x)) || 'Value must be a slug'
    const validHex = (s) => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(s)
    const validUrl = (s) => Boolean(url.parse(s).protocol) || 'Value must be a URL'

    const questions = [
        {
            name: 'globals.projectName',
            validate: slug,
            message: 'What is the name of your project (it must be a slug, eg. "my-project")?'
        },
        {
            name: 'scaffold-pwa.siteUrl',
            default: 'https://www.example.com/',
            message: 'Where do you plan to host your project (eg. "https://www.example.com/")?',
            validate: validUrl
        },
        {
            name: 'globals.theme_color',
            default: '#000',
            message: "What color should we use for your PWA's title bar?",
            validate: validHex
        },
        {
            name: `globals.connectorType`,
            default: 'CommerceConnector',
            message: 'Which ecommerce connector would you like to use?',
            type: 'list',
            choices: Object.entries(SUPPORTED_CONNECTORS)
                .map(([v, k]) => ({
                    name: `${k} ${v === DEFAULT_CONNECTOR ? '(default)' : ''}`,
                    value: v
                }))
                .sort(({name}) => -1 * name.indexOf(`(default)`))
        },
        {
            name: 'scaffold-pwa.mobify.ssrParameters.proxyConfigs[0].protocol',
            message: 'What is the protocol for your ecommerce backend (eg. http/https)?',
            default: (answers) => {
                const defaults = testProjectAnswers(answers.globals.connectorType)
                return defaults['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[0].protocol
            }
        },
        {
            name: 'scaffold-pwa.mobify.ssrParameters.proxyConfigs[0].host',
            message: 'What is the host for your ecommerce backend (eg. www.example.com)',
            default: (answers) => {
                const defaults = testProjectAnswers(answers.globals.connectorType)
                return defaults['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[0].host
            }
        },
        {
            name: 'scaffold-pwa.mobify.ssrParameters.proxyConfigs[0].path',
            message:
                'We\'re going to set up a proxy for your ecommerce backend at "/mobify/proxy/api". Do you want to use a different path for it, or keep "api"? (Most people keep it)',
            default: (answers) => {
                const defaults = testProjectAnswers(answers.globals.connectorType)
                return defaults['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[0].path
            }
        }
    ]
    return inquirer.prompt(questions).then((answers) => {
        const derived = {
            'scaffold-pwa': {
                name: answers.globals.projectName,
                version: GENERATED_PROJECT_VERSION,
                aJSSlug: answers.globals.projectName,
                projectSlug: answers.globals.projectName,
                siteName: answers.globals.projectName
            }
        }
        let finalAnswers = {}
        finalAnswers = merge(finalAnswers, answers)
        finalAnswers = merge(finalAnswers, derived)
        return finalAnswers
    })
}

const main = (opts) => {
    if (!(opts.outputDir === DEFAULT_OUTPUT_DIR) && sh.test('-e', opts.outputDir)) {
        console.error(
            `The output directory "${opts.outputDir}" already exists. Try, eg. ` +
                `"~/Desktop/my-project" instead of "~/Desktop"`
        )
        process.exit(1)
    }

    switch (GENERATOR_PRESET) {
        case TEST_PROJECT:
            return runGenerator(testProjectAnswers('demo'), opts)
        case TEST_PROJECT_SFCC:
            return runGenerator(testProjectAnswers('sfcc'), opts)
        case PROMPT:
            return prompts(opts).then((answers) => runGenerator(answers, opts))
        default:
            console.error(
                `The preset "${GENERATOR_PRESET}" is not valid. Valid presets are: ${PRESETS.map(
                    (x) => `"${x}"`
                ).join(' ')}.`
            )
            process.exit(1)
    }
}

if (require.main === module) {
    program.description(`Generate a new Mobify project`)
    program.option(
        '--outputDir <path>',
        `Path to the output directory for the new project`,
        DEFAULT_OUTPUT_DIR
    )
    program.parse(process.argv)

    return Promise.resolve()
        .then(() => main(program))
        .then(() => {
            console.log('')
            console.log(`Successfully generated project in ${program.outputDir}`)
            process.exit(0)
        })
        .catch((err) => {
            console.error('Failed to generate project')
            console.error(err)
            process.exit(1)
        })
}
