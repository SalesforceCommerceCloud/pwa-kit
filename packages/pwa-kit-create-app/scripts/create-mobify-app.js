#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a generator for PWA Kit projects that run on the Managed Runtime.
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
 * We expect end-users to generate projects by running `npx pwa-kit-create-app` on
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
const fs = require('fs')
const os = require('os')
const {Command, Option} = require('commander')
const inquirer = require('inquirer')
const {URL} = require('url')
const deepmerge = require('deepmerge')
const sh = require('shelljs')
const tar = require('tar')
const generatorPkg = require('../package.json')

const program = new Command()

sh.set('-e')

const GENERATED_PROJECT_VERSION = '0.0.1'

const HELLO_WORLD_TEST_PROJECT = 'hello-world-test-project'
const HELLO_WORLD = 'hello-world'
const TEST_PROJECT = 'test-project' // TODO: This will be replaced with the `isomorphic-client` config.
const DEMO_PROJECT = 'demo-project'
const PROMPT = 'prompt'

const PRESETS = [TEST_PROJECT, PROMPT, HELLO_WORLD, HELLO_WORLD_TEST_PROJECT, DEMO_PROJECT]
const PUBLIC_PRESETS = [PROMPT, DEMO_PROJECT]

const DEFAULT_OUTPUT_DIR = p.join(process.cwd(), 'pwa-kit-starter-project')

const SDK_VERSION = generatorPkg.version

const readJson = (path) => JSON.parse(sh.cat(path))

const writeJson = (path, data) => new sh.ShellString(JSON.stringify(data, null, 2)).to(path)

const replaceJSON = (path, replacements) =>
    writeJson(path, Object.assign(readJson(path), replacements))

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
    const npmInstallables = ['pwa-kit-react-sdk']

    // Check specified SDK versions actually exist on NPM.
    npmInstallables.forEach((pkgName) => {
        const versions = JSON.parse(sh.exec(`npm view ${pkgName} versions --json`, {silent: true}))
        if (versions.indexOf(SDK_VERSION) < 0) {
            const msg =
                `Error: You're generating a project using version "${SDK_VERSION}" of ` +
                `PWA Kit, but "${pkgName}@${SDK_VERSION}" does not exist on NPM.\n` +
                `The available versions are:\n${versions.map((v) => `  ${v}`).join('\n')}`
            console.error(msg)
            process.exit(1)
        }
    })

    extractTemplate('pwa', outputDir)

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

    const APIConfigTemplate = require(`../assets/pwa/api.config`).template
    const commerceApi = {
        proxyPath: answers['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[0].path,
        clientId: answers['commerce-api'].clientId,
        organizationId: answers['commerce-api'].organizationId,
        shortCode: answers['commerce-api'].shortCode,
        siteId: answers['commerce-api'].siteId
    }
    const einsteinApi = {
        proxyPath: answers['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[2].path,
        einsteinId: answers['einstein-api'].einsteinId,
        siteId: answers['einstein-api'].siteId || answers['commerce-api'].siteId
    }

    new sh.ShellString(APIConfigTemplate({commerceApi, einsteinApi})).to(
        p.resolve(outputDir, 'app', 'api.config.js')
    )

    console.log('Installing dependencies for the generated project (this can take a while)')
    sh.exec(`npm install --no-progress`, {
        env: process.env,
        cwd: outputDir,
        silent: true
    })
}

const prompts = () => {
    const validProjectId = (s) =>
        /^[a-z0-9-]{1,20}$/.test(s) ||
        'Value can only contain lowercase letters, numbers, and hyphens.'

    const validUrl = (s) => {
        try {
            new URL(s)
            return true
        } catch (err) {
            return 'Value must be an absolute URL'
        }
    }

    const validSiteId = (s) =>
        /^[a-z0-9_-]+$/i.test(s) || 'Valid characters are alphanumeric, hyphen, or underscore'

    // To see definitions for Commerce API configuration values, go to
    // https://developer.salesforce.com/docs/commerce/commerce-api/guide/commerce-api-configuration-values.
    const defaultCommerceAPIError =
        'Invalid format. Use docs to find more information about valid configurations: https://developer.salesforce.com/docs/commerce/commerce-api/guide/commerce-api-configuration-values'
    const defaultEinsteinAPIError =
        'Invalid format. Use docs to find more information about valid configurations: https://developer.salesforce.com/docs/commerce/einstein-api/references#einstein-recommendations:Summary'
    const validShortCode = (s) => /(^[0-9A-Z]{8}$)/i.test(s) || defaultCommerceAPIError
    const validClientId = (s) =>
        /(^[0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12}$)/i.test(s) ||
        s === 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' ||
        defaultCommerceAPIError
    const validOrganizationId = (s) =>
        /^(f_ecom)_([A-Z]{4})_(prd|stg|dev|[0-9]{3}|s[0-9]{2})$/i.test(s) || defaultCommerceAPIError
    const validEinsteinId = (s) =>
        /(^[0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12}$)/i.test(s) ||
        s === '' ||
        defaultEinsteinAPIError

    const questions = [
        {
            name: 'projectId',
            validate: validProjectId,
            message: 'What is your project ID (example-project) in Managed Runtime Admin?'
        },
        {
            name: 'instanceUrl',
            message:
                'What is the URL (https://example_instance_id.sandbox.us01.dx.commercecloud.salesforce.com) for your B2C Commerce instance?',
            validate: validUrl
        },
        {
            name: 'clientId',
            message: 'What is your API client ID?',
            validate: validClientId
        },
        {
            name: 'siteId',
            message:
                "What is your site's ID (examples: RefArch, RefArchGlobal) in Business Manager?",
            validate: validSiteId
        },
        {
            name: 'organizationId',
            message: 'What is your Commerce API organization ID in Business Manager?',
            validate: validOrganizationId
        },
        {
            name: 'shortCode',
            message: 'What is your Commerce API short code in Business Manager?',
            validate: validShortCode
        },
        {
            name: 'einsteinId',
            message: 'What is your API Client ID in the Einstein Configurator? (optional)',
            validate: validEinsteinId
        }
        // NOTE: there's no question about Einstein's _site_ id because we currently assume that the site id will be the same for both Commerce API and Einstein
    ]

    return inquirer.prompt(questions).then((answers) => buildAnswers(answers))

}

const buildAnswers = ({
    projectId,
    instanceUrl,
    clientId,
    siteId,
    organizationId,
    shortCode,
    einsteinId,
    einsteinSiteId
}) => {
    return {
        globals: {projectId},
        'scaffold-pwa': {
            name: projectId,
            version: GENERATED_PROJECT_VERSION,
            mobify: {
                ssrParameters: {
                    proxyConfigs: [
                        {
                            path: 'api',
                            host: `${shortCode}.api.commercecloud.salesforce.com`
                        },
                        {
                            path: 'ocapi',
                            host: new URL(instanceUrl).hostname
                        },
                        {
                            path: 'einstein',
                            host: 'api.cquotient.com'
                        }
                    ]
                }
            }
        },

        'commerce-api': {clientId, siteId, organizationId, shortCode},
        'einstein-api': {einsteinId, siteId: einsteinSiteId || siteId}
    }
}

const testProjectAnswers = () => {
    const config = {
        projectId: 'scaffold-pwa',
        instanceUrl: 'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
        clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
        siteId: 'RefArchGlobal',
        organizationId: 'f_ecom_zzrf_001',
        shortCode: 'kv7kzm78',
        einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
        einsteinSiteId: 'aaij-MobileFirst'
    }

    return buildAnswers(config)
}

const demoProjectAnswers = () => {
    const config = {
        projectId: 'demo-storefront',
        instanceUrl: 'https://zzte-053.sandbox.us02.dx.commercecloud.salesforce.com/',
        clientId: '1d763261-6522-4913-9d52-5d947d3b94c4',
        siteId: 'RefArchGlobal',
        organizationId: 'f_ecom_zzte_053',
        shortCode: 'kv7kzm78'
    }

    return buildAnswers(config)
}

const helloWorldPrompts = () => {
    const validProjectId = (s) =>
        /^[a-z0-9-]{1,20}$/.test(s) ||
        'Value can only contain lowercase letters, numbers, and hyphens.'
    const questions = [
        {
            name: 'projectId',
            validate: validProjectId,
            message: 'What is your project ID (example-project) in Managed Runtime Admin?'
        }
    ]
    return inquirer.prompt(questions)
}

const generateHelloWorld = ({projectId}, {outputDir}) => {
    extractTemplate('hello-world', outputDir)
    const pkgJsonPath = p.resolve(outputDir, 'package.json')
    const pkgJSON = readJson(pkgJsonPath)
    const finalPkgData = merge(pkgJSON, {name: projectId})
    writeJson(pkgJsonPath, finalPkgData)

    console.log('Installing dependencies for the generated project (this can take a while)')
    sh.exec(`npm install --no-progress`, {
        env: process.env,
        cwd: outputDir,
        silent: true
    })
}

const extractTemplate = (templateName, outputDir) => {
    const tmp = fs.mkdtempSync(p.resolve(os.tmpdir(), 'extract-template'))
    tar.x({
        file: p.join(__dirname, '..', 'templates', `${templateName}.tar.gz`),
        cwd: p.join(tmp),
        sync: true
    })
    sh.mv(p.join(tmp, templateName), outputDir)
    sh.rm('-rf', tmp)
}

const main = (opts) => {
    if (!(opts.outputDir === DEFAULT_OUTPUT_DIR) && sh.test('-e', opts.outputDir)) {
        console.error(
            `The output directory "${opts.outputDir}" already exists. Try, eg. ` +
                `"~/Desktop/my-project" instead of "~/Desktop"`
        )
        process.exit(1)
    }

    switch (opts.preset) {
        case HELLO_WORLD_TEST_PROJECT:
            return generateHelloWorld({projectId: 'hello-world'}, opts)
        case HELLO_WORLD:
            return helloWorldPrompts(opts).then((answers) => generateHelloWorld(answers, opts))
        case TEST_PROJECT:
            return runGenerator(testProjectAnswers(), opts)
        case DEMO_PROJECT:
            return runGenerator(demoProjectAnswers(), opts)
        case PROMPT:
            console.log(
                'For details on configuration values, see https://developer.salesforce.com/docs/commerce/commerce-api/guide/commerce-api-configuration-values\n'
            )
            return prompts(opts).then((answers) => runGenerator(answers, opts))
        default:
            console.error(
                `The preset "${opts.preset}" is not valid. Valid presets are: ${PRESETS.map(
                    (x) => `"${x}"`
                ).join(' ')}.`
            )
            process.exit(1)
    }
}

if (require.main === module) {
    program.name(`pwa-kit-create-app`)
    program.description(`Generate a new PWA Kit project, optionally using a preset.
    
Examples:

  ${program.name()} --preset "${PROMPT}"
    Generate a project using custom settings for B2CCommerce, by answering 
    questions on the CLI.
    
    Use this to connect to an existing instance.

  ${program.name()} --preset "${DEMO_PROJECT}"
    Generate a project using default settings for an existing demo B2CCommerce
    backend. This preset does not ask for input.
    
    Use this to try out SDK features against an existing backend.
  `)
    program.option(
        '--outputDir <path>',
        `Path to the output directory for the new project`,
        DEFAULT_OUTPUT_DIR
    )
    program.addOption(
        new Option(
            '--preset <name>',
            `The name of a project preset to use`
        )
            .default(PROMPT)
            .choices(
                Boolean(process.env.GENERATOR_PRESET) ? PRESETS : PUBLIC_PRESETS
            )
            .env('GENERATOR_PRESET')
    )
    program.parse(process.argv)

    return Promise.resolve()
        .then(() => main(program.opts()))
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
