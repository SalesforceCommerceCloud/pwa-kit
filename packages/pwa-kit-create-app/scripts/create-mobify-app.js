#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
const program = require('commander')
const inquirer = require('inquirer')
const {URL} = require('url')
const deepmerge = require('deepmerge')
const sh = require('shelljs')
const generatorPkg = require('../package.json')

sh.set('-e')

const GENERATED_PROJECT_VERSION = '0.0.1'

const TEST_PROJECT = 'test-project' // TODO: This will be replaced with the `isomorphic-client` config.
const PROMPT = 'prompt'

const PRESETS = [TEST_PROJECT, PROMPT]

const GENERATOR_PRESET = process.env.GENERATOR_PRESET || PROMPT

const DEFAULT_OUTPUT_DIR = p.join(process.cwd(), 'generated-project')

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

    const commerceAPIConfigTemplate = require(`../assets/pwa/commerce-api.config`).template
    const commerceData = {
        proxyPath: answers['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[0].path,
        clientId: answers['commerce-api'].clientId,
        organizationId: answers['commerce-api'].organizationId,
        shortCode: answers['commerce-api'].shortCode,
        siteId: answers['commerce-api'].siteId
    }

    new sh.ShellString(commerceAPIConfigTemplate(commerceData)).to(
        p.resolve(outputDir, 'app', 'commerce-api.config.js')
    )

    const einsteinAPIConfigTemplate = require(`../assets/pwa/einstein-api.config`).template
    const einsteinData = {
        proxyPath: answers['scaffold-pwa'].mobify.ssrParameters.proxyConfigs[2].path,
        einsteinId: answers['einstein-api'].einsteinId,
        siteId: answers['commerce-api'].siteId
    }
    new sh.ShellString(einsteinAPIConfigTemplate(einsteinData)).to(
        p.resolve(outputDir, 'app', 'einstein-api.config.js')
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

    // To see definitions for Commerce API configuration values, refer to these
    // doc --> https://developer.commercecloud.com/s/article/CommerceAPI-ConfigurationValues.
    const defaultCommerceAPIError =
        'Invalid format. Follow this link for configuration documentation https://developer.commercecloud.com/s/article/CommerceAPI-ConfigurationValues'
    const defaultEinsteinAPIError =
        'Invalid format. Follow this link for configuration documentation https://developer.commercecloud.com/s/api-details/a003k00000UI4hPAAT/commerce-cloud-developer-centereinsteinrecommendations'
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
                'What is the URL (https://example_instance_id.sandbox.us01.dx.commercecloud.salesforce.com) for your Commerce Cloud instance?',
            validate: validUrl
        },
        {
            name: 'clientId',
            message: 'What is your Commerce API client ID in Account Manager?',
            validate: validClientId
        },
        {
            name: 'siteId',
            message: "What is your site's ID (examples: RefArch, SiteGenesis) in Business Manager?",
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
    einsteinId
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
        'einstein-api': {einsteinId}
    }
}

const testProjectAnswers = () => {
    const config = {
        projectId: 'scaffold-pwa',
        instanceUrl: 'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
        clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
        siteId: 'RefArch',
        organizationId: 'f_ecom_zzrf_001',
        shortCode: 'kv7kzm78',
        einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1'
    }

    return buildAnswers(config)
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
            return runGenerator(testProjectAnswers(), opts)
        case PROMPT:
            console.log(
                'See https://developer.commercecloud.com/s/article/CommerceAPI-ConfigurationValues for details on configuration values\n'
            )
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
