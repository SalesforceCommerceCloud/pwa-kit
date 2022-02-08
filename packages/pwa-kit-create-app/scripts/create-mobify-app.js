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
 * The output of this script is a copy of a project template with the following changes:
 *
 * 1) We update any monorepo-local dependencies to be installed through NPM.
 *
 * 2) We rename the template and configure the generated project based on answers to
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
 * For testing on CI we need to be able to generate projects without running
 * the interactive prompts on the CLI. To support these cases, we have
 * a few presets that are "private" and only usable through the GENERATOR_PRESET
 * env var – this keeps them out of the --help docs.
 *
 * If both the GENERATOR_PRESET env var and --preset arguments are passed, the
 * option set in --preset is used.
 */

const p = require('path')
const fs = require('fs')
const os = require('os')
const {Command} = require('commander')
const inquirer = require('inquirer')
const {URL} = require('url')
const deepmerge = require('deepmerge')
const sh = require('shelljs')
const tar = require('tar')
const semver = require('semver')
const slugify = require('slugify')
const generatorPkg = require('../package.json')

const program = new Command()

sh.set('-e')

const GENERATED_PROJECT_VERSION = '0.0.1'

const HELLO_WORLD_TEST_PROJECT = 'hello-world-test-project'
const HELLO_WORLD = 'hello-world'
const TEST_PROJECT = 'test-project' // TODO: This will be replaced with the `isomorphic-client` config.
const RETAIL_REACT_APP_DEMO = 'retail-react-app-demo'
const RETAIL_REACT_APP = 'retail-react-app'

const PRIVATE_PRESETS = [TEST_PROJECT, HELLO_WORLD, HELLO_WORLD_TEST_PROJECT]
const PUBLIC_PRESETS = [RETAIL_REACT_APP_DEMO, RETAIL_REACT_APP]
const PRESETS = PRIVATE_PRESETS.concat(PUBLIC_PRESETS)

const DEFAULT_OUTPUT_DIR = p.join(process.cwd(), 'pwa-kit-starter-project')

const PROJECT_ID_MAX_LENGTH = 20

const SDK_VERSION = generatorPkg.version

const readJson = (path) => JSON.parse(sh.cat(path))

const writeJson = (path, data) => new sh.ShellString(JSON.stringify(data, null, 2)).to(path)

const replaceJSON = (path, replacements) =>
    writeJson(path, Object.assign(readJson(path), replacements))

const slugifyName = (name) => {
    return slugify(name, {
        lower: true,
        strict: true
    }).slice(0, PROJECT_ID_MAX_LENGTH)
}

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

    const {pkgLocalizationConfig} = require(`../assets/pwa/l10n.config`)
    const pkgJsonPath = p.resolve(outputDir, 'package.json')
    const pkgJSON = readJson(pkgJsonPath)
    const pkgDataWithAnswers = merge(pkgJSON, answers['scaffold-pwa'])
    const finalPkgData = merge(pkgDataWithAnswers, pkgLocalizationConfig)

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

    const PWAKitConfigJsonTemplate = require(`../assets/pwa/pwa-kit.config`)
    const PWAKitConfigJsonPath = p.resolve(outputDir, 'pwa-kit.config.json')
    writeJson(PWAKitConfigJsonPath, PWAKitConfigJsonTemplate)

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

    console.log('Installing dependencies for the generated project...')
    sh.exec(`npm install --no-progress`, {
        env: process.env,
        cwd: outputDir,
        silent: true
    })
}

// Validations
const validProjectName = (s) => {
    const regex = new RegExp(`^[a-zA-Z0-9-\\s]{1,${PROJECT_ID_MAX_LENGTH}}$`)
    return regex.test(s) || 'Value can only contain letters, numbers, space and hyphens.'
}

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
const validShortCode = (s) => /(^[0-9A-Z]{8}$)/i.test(s) || defaultCommerceAPIError
const validClientId = (s) =>
    /(^[0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12}$)/i.test(s) ||
    s === 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' ||
    defaultCommerceAPIError
const validOrganizationId = (s) =>
    /^(f_ecom)_([A-Z]{4})_(prd|stg|dev|[0-9]{3}|s[0-9]{2})$/i.test(s) || defaultCommerceAPIError

const retailReactAppPrompts = () => {
    const questions = [
        {
            name: 'projectName',
            validate: validProjectName,
            message: 'What is the name of your Project?'
        },
        {
            name: 'instanceUrl',
            message: 'What is the URL for your Commerce Cloud instance?',
            validate: validUrl
        },
        {
            name: 'clientId',
            message: 'What is your SLAS API Client ID in Account Manager?',
            validate: validClientId
        },
        {
            name: 'siteId',
            message: 'What is your Site ID in Business Manager?',
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
        }
    ]

    return inquirer.prompt(questions).then((answers) => buildAnswers(answers))
}

const buildAnswers = ({
    projectName,
    instanceUrl,
    clientId,
    siteId,
    organizationId,
    shortCode,
    einsteinId,
    einsteinSiteId
}) => {
    const projectId = slugifyName(projectName)

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
        projectName: 'scaffold-pwa',
        instanceUrl: 'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
        clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
        siteId: 'RefArch',
        organizationId: 'f_ecom_zzrf_001',
        shortCode: 'kv7kzm78',
        einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
        einsteinSiteId: 'aaij-MobileFirst'
    }

    return buildAnswers(config)
}

const demoProjectAnswers = () => {
    const config = {
        projectName: 'demo-storefront',
        instanceUrl: 'https://zzte-053.sandbox.us02.dx.commercecloud.salesforce.com/',
        clientId: '1d763261-6522-4913-9d52-5d947d3b94c4',
        siteId: 'RefArch',
        organizationId: 'f_ecom_zzte_053',
        shortCode: 'kv7kzm78',
        einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
        einsteinSiteId: 'aaij-MobileFirst'
    }

    return buildAnswers(config)
}

const helloWorldPrompts = () => {
    const questions = [
        {
            name: 'projectName',
            validate: validProjectName,
            message: 'What is the name of your Project?'
        }
    ]
    return inquirer.prompt(questions)
}

const generateHelloWorld = (projectId, {outputDir}) => {
    extractTemplate('hello-world', outputDir)
    const pkgJsonPath = p.resolve(outputDir, 'package.json')
    const pkgJSON = readJson(pkgJsonPath)
    const finalPkgData = merge(pkgJSON, {name: projectId})
    writeJson(pkgJsonPath, finalPkgData)

    console.log('Installing dependencies for the generated project...')
    sh.exec(`npm install --no-progress`, {
        env: process.env,
        cwd: outputDir,
        silent: true
    })
}

const presetPrompt = () => {
    const questions = [
        {
            name: 'preset',
            message: 'Choose a project to get started:',
            type: 'list',
            choices: [
                {
                    name: 'The Retail app with demo Commerce Cloud instance',
                    value: RETAIL_REACT_APP_DEMO
                },
                {
                    name: 'The Retail app using your own Commerce Cloud instance',
                    value: RETAIL_REACT_APP
                }
            ]
        }
    ]
    return inquirer.prompt(questions).then((answers) => answers['preset'])
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

const userNode = process.versions.node
const requiredNode = new semver.Range(generatorPkg.engines.node)
const isUsingCompatibleNode = semver.satisfies(userNode, requiredNode)

const main = (opts) => {
    if (!isUsingCompatibleNode) {
        console.log('')
        console.warn(
            `Warning: You are using Node ${userNode}. ` +
                `Your app may not work as expected when deployed to Managed ` +
                `Runtime servers which are compatible with Node ${requiredNode}`
        )
        console.log('')
    }

    const OUTPUT_DIR_FLAG_ACTIVE = !(opts.outputDir === DEFAULT_OUTPUT_DIR)
    if (OUTPUT_DIR_FLAG_ACTIVE && sh.test('-e', opts.outputDir)) {
        console.error(
            `The output directory "${opts.outputDir}" already exists. Try, for example, ` +
                `"~/Desktop/my-project" instead of "~/Desktop"`
        )
        process.exit(1)
    }

    return Promise.resolve()
        .then(() => opts.preset || process.env.GENERATOR_PRESET || presetPrompt())
        .then((preset) => {
            switch (preset) {
                case HELLO_WORLD_TEST_PROJECT:
                    return generateHelloWorld({projectId: 'hello-world'}, opts)
                case HELLO_WORLD:
                    return helloWorldPrompts(opts).then((answers) => {
                        const projectId = slugifyName(answers.projectName)
                        if (!OUTPUT_DIR_FLAG_ACTIVE) {
                            opts.outputDir = p.join(process.cwd(), projectId)
                        }
                        generateHelloWorld(projectId, opts)
                        return opts.outputDir
                    })
                case TEST_PROJECT:
                    return runGenerator(testProjectAnswers(), opts)
                case RETAIL_REACT_APP_DEMO:
                    return Promise.resolve()
                        .then(() => runGenerator(demoProjectAnswers(), opts))
                        .then((result) => {
                            console.log(
                                '\nTo change your ecommerce back end you will need to update your storefront configuration. More information: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/configuration-options'
                            )
                            return result
                        })
                case RETAIL_REACT_APP:
                    console.log(
                        'For details on configuration options, see https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/configuration-options\n'
                    )
                    return retailReactAppPrompts(opts).then((answers) => {
                        if (!OUTPUT_DIR_FLAG_ACTIVE) {
                            opts.outputDir = p.join(
                                process.cwd(),
                                slugifyName(answers.globals.projectId)
                            )
                        }

                        runGenerator(answers, opts)
                        return opts.outputDir
                    })
                default:
                    console.error(
                        `The preset "${preset}" is not valid. Valid presets are: ${
                            process.env.GENERATOR_PRESET
                                ? PRESETS.map((x) => `"${x}"`).join(' ')
                                : PUBLIC_PRESETS.map((x) => `"${x}"`).join(' ')
                        }.`
                    )
                    process.exit(1)
            }
        })
}

if (require.main === module) {
    program.name(`pwa-kit-create-app`)
    program.description(`Generate a new PWA Kit project, optionally using a preset.

Examples:

  ${program.name()} --preset "${RETAIL_REACT_APP}"
    Generate a project using custom settings by answering questions about a
    B2C Commerce instance.

    Use this preset to connect to an existing instance, such as a sandbox.

  ${program.name()} --preset "${RETAIL_REACT_APP_DEMO}"
    Generate a project using the settings for a special B2C Commerce
    instance that is used for demo purposes. No questions are asked.

    Use this preset to try out PWA Kit.
  `)
    program
        .option(
            '--outputDir <path>',
            `Path to the output directory for the new project`,
            DEFAULT_OUTPUT_DIR
        )
        .option(
            '--preset <name>',
            `The name of a project preset to use (choices: "retail-react-app" "retail-react-app-demo")`
        )

    program.parse(process.argv)

    return Promise.resolve()
        .then(() => main(program.opts()))
        .then((outputDir) => {
            console.log('')
            console.log(
                `Successfully generated a project in ${outputDir ? outputDir : program.outputDir}`
            )
            process.exit(0)
        })
        .catch((err) => {
            console.error('Failed to generate a project')
            console.error(err)
            process.exit(1)
        })
}
