#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */

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
 * We expect end-users to generate projects by running `npx @salesforce/pwa-kit-create-app` on
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
const child_proc = require('child_process')
const {Command} = require('commander')
const inquirer = require('inquirer')
const {URL} = require('url')
const deepmerge = require('deepmerge')
const sh = require('shelljs')
const tar = require('tar')
const semver = require('semver')
const slugify = require('slugify')
const generatorPkg = require('../package.json')
const Handlebars = require('handlebars')
const trimExtensions = require('./trim-extensions')
const pluginConfig = require('../assets/plugin-config')
const computeChecksum = require('./checksum')

const program = new Command()

sh.set('-e')

// Handlebars helpers

// Our eslint script uses exscaped double quotes to have windows compatibility. This helper
// will ensure those escaped double quotes are still escaped after processing the template.
Handlebars.registerHelper('script', (object) => object.replaceAll('"', '\\"'))

// Validations
const validPreset = (preset) => {
    return ALL_PRESET_NAMES.includes(preset)
}

const validProjectName = (s) => {
    if (s.length > PROJECT_ID_MAX_LENGTH) {
        return `Maximum length is ${PROJECT_ID_MAX_LENGTH} characters.`
    }
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

// Globals
const GENERATED_PROJECT_VERSION = '0.0.1'

const INITIAL_CONTEXT = {
    preset: undefined,
    answers: {
        general: {},
        project: {}
    }
}
const TEMPLATE_SOURCE_NPM = 'npm'
const TEMPLATE_SOURCE_BUNDLE = 'bundle'
const DEFAULT_TEMPLATE_VERSION = 'latest'

const selectedPlugins = {}

const HYBRID_QUESTIONS = [
    {
        name: 'project.hybrid',
        message: 'Do you wish to set up a phased headless rollout?',
        type: 'list',
        choices: [
            {
                name: 'No',
                value: false
            },
            {
                name: 'Yes',
                value: true
            }
        ]
    }
]

const MRT_REFERENCE_QUESTIONS = [
    {
        name: 'project.name',
        validate: validProjectName,
        message: 'What is the name of your Project?'
    }
]

const EXPRESS_MINIMAL_QUESTIONS = [
    {
        name: 'project.name',
        validate: validProjectName,
        message: 'What is the name of your Project?'
    }
]

const TYPESCRIPT_MINIMAL_QUESTIONS = [
    {
        name: 'project.name',
        validate: validProjectName,
        message: 'What is the name of your Project?'
    }
]

const createRetailReactAppQuestions = (defaults = {}) => [
    {
        name: 'project.name',
        validate: validProjectName,
        message: 'What is the name of your Project?',
        default: defaults['project.name'] || 'chakra-storefront'
    },
    {
        name: 'project.commerce.instanceUrl',
        message: 'What is the URL for your Commerce Cloud instance?',
        validate: validUrl,
        default:
            defaults['project.commerce.instanceUrl'] ||
            'https://zzrf-001.dx.commercecloud.salesforce.com'
    },
    {
        name: 'project.commerce.clientId',
        message: 'What is your SLAS Client ID?',
        validate: validClientId,
        default: defaults['project.commerce.clientId'] || 'c9c45bfd-0ed3-4aa2-9971-40f88962b836'
    },
    {
        name: 'project.commerce.isSlasPrivate',
        message: 'Is your SLAS client private?',
        type: 'list',
        choices: [
            {
                name: 'Yes',
                value: true
            },
            {
                name: 'No',
                value: false
            }
        ],
        default: defaults['project.commerce.isSlasPrivate'] || false
    },
    {
        name: 'project.commerce.siteId',
        message: 'What is your Site ID in Business Manager?',
        validate: validSiteId,
        default: defaults['project.commerce.siteId'] || 'RefArch'
    },
    {
        name: 'project.commerce.organizationId',
        message: 'What is your Commerce API organization ID in Business Manager?',
        validate: validOrganizationId,
        default: defaults['project.commerce.organizationId'] || 'f_ecom_zzrf_001'
    },
    {
        name: 'project.commerce.shortCode',
        message: 'What is your Commerce API short code in Business Manager?',
        validate: validShortCode,
        default: defaults['project.commerce.shortCode'] || 'kv7kzm78'
    }
]

// Project dictionary describing details and how the generator should ask questions etc.
const PRESETS = [
    {
        id: 'chakra-storefront',
        name: 'Chakra Storefront',
        description: `
            Generate a project using custom settings by answering questions about a
            B2C Commerce instance.

            Use this preset to connect to an existing instance, such as a sandbox.
        `,
        shortDescription: 'The Retail app using your own Commerce Cloud instance',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'chakra-storefront'
        },
        interactive: true,
        getQuestions: () =>
            createRetailReactAppQuestions({
                'project.hybrid': false,
                'project.name': 'chakra-storefront',
                'project.commerce.instanceUrl': 'https://zzrf-001.dx.commercecloud.salesforce.com',
                'project.commerce.clientId': 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
                'project.commerce.siteId': 'RefArch',
                'project.commerce.organizationId': 'f_ecom_zzrf_001',
                'project.commerce.shortCode': 'kv7kzm78',
                'project.commerce.isSlasPrivate': false,
                'project.einstein.clientId': '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                'project.einstein.siteId': 'aaij-MobileFirst',
                'project.dataCloud.appSourceId': 'fb81edab-24c6-4b40-8684-b67334dfdf32',
                'project.dataCloud.tenantId': 'mmyw8zrxhfsg09lfmzrd1zjqmg',
                'project.demo.enableDemoSettings': false
            }),
        assets: ['translations'],
        private: false
    },
    {
        id: 'chakra-storefront-demo',
        name: 'Chakra Storefront Demo',
        description: `
            Generate a project using the settings for a special B2C Commerce
            instance that is used for demo purposes. No questions are asked.

            Use this preset to try out PWA Kit.
        `,
        shortDescription: 'The Retail app with demo Commerce Cloud instance',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'chakra-storefront'
        },
        getQuestions: () =>
            createRetailReactAppQuestions({
                'project.hybrid': false,
                'project.name': 'demo-storefront',
                'project.commerce.instanceUrl': 'https://zzte-053.dx.commercecloud.salesforce.com',
                'project.commerce.clientId': '1d763261-6522-4913-9d52-5d947d3b94c4',
                'project.commerce.siteId': 'RefArch',
                'project.commerce.organizationId': 'f_ecom_zzte_053',
                'project.commerce.shortCode': 'kv7kzm78',
                'project.commerce.isSlasPrivate': false,
                'project.einstein.clientId': '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                'project.einstein.siteId': 'aaij-MobileFirst',
                'project.dataCloud.appSourceId': 'fb81edab-24c6-4b40-8684-b67334dfdf32',
                'project.dataCloud.tenantId': 'mmyw8zrxhfsg09lfmzrd1zjqmg',
                'project.demo.enableDemoSettings': false
            }),
        assets: ['translations'],
        private: false
    },
    {
        id: 'chakra-storefront-demo-site-internal',
        name: 'Chakra Storefront Demo Store',
        description: `
            Generates a project using the settings for a special B2C Commerce instance that is used
            for demo purposes. The demo site is accessible at https://pwa-kit.mobify-storefront.com/

            This environment uses a SLAS private client and has social and passwordless login enabled.
            This environment is set up to use multiple locales.
            Future features that are enabled for the demo environment may be added to this preset.
        `,
        shortDescription:
            'The Retail app with demo Commerce Cloud instance and a private SLAS client',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'chakra-storefront'
        },
        answers: {
            ['project.hybrid']: false,
            ['project.name']: 'demo-storefront',
            ['project.commerce.instanceUrl']: 'https://zzrf-001.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: '083859f2-5d93-4209-b999-a112266d63a0',
            ['project.commerce.siteId']: 'RefArchGlobal',
            ['project.commerce.organizationId']: 'f_ecom_zzrf_001',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: true,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.dataCloud.appSourceId']: 'fb81edab-24c6-4b40-8684-b67334dfdf32',
            ['project.dataCloud.tenantId']: 'mmyw8zrxhfsg09lfmzrd1zjqmg',
            ['project.demo.enableDemoSettings']: true // True only for presets deployed to demo environments like pwa-kit.mobify-storefront.com
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'chakra-storefront-test-project',
        name: 'Chakra Storefront Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'typescript-minimal'
        },
        getQuestions: () =>
            createRetailReactAppQuestions({
                'project.hybrid': false,
                'project.name': 'chakra-storefront',
                'project.commerce.instanceUrl': 'https://zzrf-001.dx.commercecloud.salesforce.com',
                'project.commerce.clientId': 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
                'project.commerce.siteId': 'RefArch',
                'project.commerce.organizationId': 'f_ecom_zzrf_001',
                'project.commerce.shortCode': 'kv7kzm78',
                'project.commerce.isSlasPrivate': false,
                'project.einstein.clientId': '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                'project.einstein.siteId': 'aaij-MobileFirst',
                'project.dataCloud.appSourceId': 'fb81edab-24c6-4b40-8684-b67334dfdf32',
                'project.dataCloud.tenantId': 'mmyw8zrxhfsg09lfmzrd1zjqmg',
                'project.demo.enableDemoSettings': false
            }),
        assets: ['translations'],
        private: true
    },
    {
        id: 'chakra-storefront-private-slas-client',
        name: 'Chakra Storefront Private SLAS client project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'chakra-storefront'
        },
        getQuestions: () =>
            createRetailReactAppQuestions({
                'project.hybrid': false,
                'project.name': 'chakra-storefront',
                'project.commerce.instanceUrl': 'https://zzrf-002.dx.commercecloud.salesforce.com',
                'project.commerce.clientId': '89655706-9a0d-49ba-a1e5-18bb2d616374',
                'project.commerce.siteId': 'RefArch',
                'project.commerce.organizationId': 'f_ecom_zzrf_002',
                'project.commerce.shortCode': 'kv7kzm78',
                'project.commerce.isSlasPrivate': true,
                'project.einstein.clientId': '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                'project.einstein.siteId': 'aaij-MobileFirst',
                'project.dataCloud.appSourceId': 'fb81edab-24c6-4b40-8684-b67334dfdf32',
                'project.dataCloud.tenantId': 'mmyw8zrxhfsg09lfmzrd1zjqmg',
                'project.demo.enableDemoSettings': false
            }),
        assets: ['translations'],
        private: true
    },
    {
        id: 'chakra-storefront-bug-bounty',
        name: 'Chakra Storefront Bug Bounty Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'chakra-storefront'
        },
        getQuestions: () =>
            createRetailReactAppQuestions({
                'project.hybrid': false,
                'project.name': 'chakra-storefront',
                'project.commerce.instanceUrl': 'https://zzec-006.dx.commercecloud.salesforce.com',
                'project.commerce.clientId': 'b56e7ad3-2237-42c9-8f55-41e63ebca420',
                'project.commerce.siteId': 'RefArch',
                'project.commerce.organizationId': 'f_ecom_zzec_006',
                'project.commerce.shortCode': 'staging-001',
                'project.einstein.clientId': '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                'project.einstein.siteId': 'aaij-MobileFirst',
                'project.dataCloud.appSourceId': 'fb81edab-24c6-4b40-8684-b67334dfdf32',
                'project.dataCloud.tenantId': 'mmyw8zrxhfsg09lfmzrd1zjqmg',
                'project.commerce.isSlasPrivate': true,
                'project.demo.enableDemoSettings': false
            }),
        assets: ['translations'],
        private: true
    },
    {
        id: 'chakra-storefront-hybrid-test-project',
        name: 'Chakra Storefront Hybrid Test Private SLAS Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'chakra-storefront'
        },
        getQuestions: () => [
            ...HYBRID_QUESTIONS,
            ...createRetailReactAppQuestions({
                'project.hybrid': true,
                'project.name': 'chakra-storefront',
                'project.commerce.instanceUrl': 'https://test.phased-launch-testing.com/',
                'project.commerce.clientId': '99b4e081-00cf-454a-95b0-26ac2b824931',
                'project.commerce.siteId': 'RefArch',
                'project.commerce.organizationId': 'f_ecom_bdpx_dev',
                'project.commerce.shortCode': 'xitgmcd3',
                'project.einstein.clientId': '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                'project.einstein.siteId': 'aaij-MobileFirst',
                'project.commerce.isSlasPrivate': true,
                'project.dataCloud.appSourceId': 'fb81edab-24c6-4b40-8684-b67334dfdf32',
                'project.dataCloud.tenantId': 'mmyw8zrxhfsg09lfmzrd1zjqmg',
                'project.demo.enableDemoSettings': false
            })
        ],
        assets: ['translations'],
        private: true
    },
    {
        id: 'chakra-storefront-hybrid-public-client-test-project',
        name: 'Chakra Storefront Hybrid Test Public SLAS client project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'chakra-storefront'
        },
        getQuestions: () => [
            ...HYBRID_QUESTIONS,
            ...createRetailReactAppQuestions({
                'project.hybrid': true,
                'project.name': 'chakra-storefront',
                'project.commerce.instanceUrl': 'https://www.phased-launch-testing.com/',
                'project.commerce.clientId': 'e7e22b7f-a904-4f3a-8022-49dbee696485',
                'project.commerce.siteId': 'RefArch',
                'project.commerce.organizationId': 'f_ecom_bjnl_prd',
                'project.commerce.shortCode': 'performance-001',
                'project.einstein.clientId': '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                'project.einstein.siteId': 'aaij-MobileFirst',
                'project.commerce.isSlasPrivate': false,
                'project.dataCloud.appSourceId': 'fb81edab-24c6-4b40-8684-b67334dfdf32',
                'project.dataCloud.tenantId': 'mmyw8zrxhfsg09lfmzrd1zjqmg',
                'project.demo.enableDemoSettings': false
            })
        ],
        assets: ['translations'],
        private: true
    },
    {
        id: 'typescript-minimal-test-project',
        name: 'Template Minimal Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'typescript-minimal'
        },
        private: true
    },
    {
        id: 'typescript-minimal',
        name: 'Template Minimal Project',
        description: `
            Generate a project using a bare-bones TypeScript app template.

            Use this as a TypeScript starting point or as a base on top of
            which to build new TypeScript project templates for Managed Runtime.
        `,
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'typescript-minimal'
        },
        interactive: true,
        getQuestions: () => TYPESCRIPT_MINIMAL_QUESTIONS,
        private: true
    },
    {
        id: 'express-minimal-test-project',
        name: 'Express Minimal Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'express-minimal'
        },
        getQuestions: () => EXPRESS_MINIMAL_QUESTIONS,
        answers: {
            ['project.name']: 'express-minimal'
        },
        private: true
    },
    {
        id: 'express-minimal',
        name: 'Express Minimal Project',
        description: `
            Generate a project using a bare-bones express app template.

            Use this as a starting point for APIs or as a base on top of
            which to build new project templates for Managed Runtime.
        `,
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'express-minimal'
        },
        getQuestions: () => EXPRESS_MINIMAL_QUESTIONS,
        private: true
    },
    {
        id: 'mrt-reference-app',
        name: 'Managed Runtime Reference App',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'mrt-reference-app'
        },
        getQuestions: () => MRT_REFERENCE_QUESTIONS,
        answers: {
            ['project.name']: 'mrt-reference-app'
        },
        private: true
    }
]

const ASSETS_TEMPLATES_DIR = p.join(__dirname, '..', 'assets', 'templates')

const PRIVATE_PRESET_NAMES = PRESETS.filter(({private}) => !!private).map(({id}) => id)

const PUBLIC_PRESET_NAMES = PRESETS.filter(({private}) => !private).map(({id}) => id)

const ALL_PRESET_NAMES = PRIVATE_PRESET_NAMES.concat(PUBLIC_PRESET_NAMES)

const PROJECT_ID_MAX_LENGTH = 20

// Utilities
const readJson = (path) => JSON.parse(sh.cat(path))

const writeJson = (path, data) => new sh.ShellString(JSON.stringify(data, null, 2)).to(path)

/**
 * Updates the `package.json` file in place by merging new updates with the existing content.
 *
 * @param {string} pkgJsonPath - The file path to the `package.json` file that needs to be updated.
 * @param {Object} updates - An object containing the updates to be merged into the existing `package.json`.
 */
const updatePackageJson = (pkgJsonPath, updates) => {
    const pkgJSON = readJson(pkgJsonPath)
    const finalPkgData = merge(pkgJSON, updates)
    writeJson(pkgJsonPath, finalPkgData)
}

const slugifyName = (name) =>
    slugify(name, {
        lower: true,
        strict: true
    }).slice(0, PROJECT_ID_MAX_LENGTH)

const getSlugifiedProjectName = (projectName) => {
    // Split the project name into namespace and name if it's in the format @namespace/name
    const [slugifiedNamespace, slugifiedName] = projectName.includes('/')
        ? projectName.split('/').map(slugifyName)
        : ['', slugifyName(projectName)]

    return slugifiedNamespace ? `@${slugifiedNamespace}/${slugifiedName}` : slugifiedName
}

/**
 * Check if the provided path is an empty directory.
 * @param {*} path
 * @returns
 */
const isDirEmpty = (path) => fs.readdirSync(path).length === 0

/**
 * Logs an error and exits the process if the provided path points at a
 * non-empty directory.
 *
 * @param {*} path
 */
const checkOutputDir = (path) => {
    if (sh.test('-e', path) && !isDirEmpty(path)) {
        console.error(
            `The output directory "${path}" already exists. Try, for example, ` +
                `"~/Desktop/my-project" instead of "~/Desktop"`
        )
        process.exit(1)
    }
}

/**
 * Returns a list of absolute file paths for a given folder. This will recursively
 * list files in child folders.
 *
 * @param {*} dirPath
 * @param {*} arrayOfFiles
 * @returns
 */
const getFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath)

    files.forEach((file) => {
        if (fs.statSync(p.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getFiles(p.join(dirPath, file), arrayOfFiles)
        } else {
            arrayOfFiles.push(p.join(dirPath, file))
        }
    })

    return arrayOfFiles
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
 * Provided a dot notation key, and a value, return an expanded object splitting
 * the key.
 *
 * @example
 * const expandedObj = expand('parent.child.grandchild': { name: 'Preseley' })
 * console.log(expandedObj) // {parent: { child: {grandchild: {name: 'Presley}}}}
 *
 * @param {string} key
 * @param {Object} value
 * @returns
 *
 */
const expandKey = (key, value) =>
    key
        .split('.')
        .reverse()
        .reduce(
            (acc, curr) =>
                acc
                    ? {
                          [curr]: acc
                      }
                    : {
                          [curr]: value
                      },
            undefined
        )

/**
 * Provided an object there the keys use "dot notation", expand each individual key.
 * NOTE: This only expands keys at the root level, and not those nested.
 *
 * @example
 * const expandedObj = expand({'coolthings.babynames': 'Preseley', 'coolthings.cars': 'bmws'})
 * console.log(expandedObj) // {coolthings: { babynames: 'Presley', cars: 'bmws'}}
 *
 * @param {Object} answers
 * @returns {Object} The expanded object.
 *
 */
const expandObject = (obj = {}) =>
    Object.keys(obj).reduce((acc, curr) => merge(acc, expandKey(curr, obj[curr])), {})

/**
 * Envoke the "npm install" command for the provided project directory.
 *
 * @param {*} outputDir
 * @param {*} param1
 */
const npmInstall = (outputDir, {verbose, projectName}) => {
    console.log(`Installing dependencies${
        projectName ? ` for ${projectName}` : ''
    }... This may take a few minutes.
`)
    const npmLogLevel = verbose ? 'notice' : 'error'
    const disableStdOut = ['inherit', 'ignore', 'inherit']
    const stdio = verbose ? 'inherit' : disableStdOut
    try {
        child_proc.execSync(`npm install --color always --loglevel ${npmLogLevel}`, {
            cwd: outputDir,
            stdio,
            env: {
                ...process.env,
                OPENCOLLECTIVE_HIDE: 'true',
                DISABLE_OPENCOLLECTIVE: 'true',
                OPEN_SOURCE_CONTRIBUTOR: 'true'
            }
        })
    } catch {
        // error is already displayed on the console by child process.
        // exit the program
        process.exit(1)
    }
}

/**
 * Execute and copy the handlebars template to the output directory using
 * the provided context object. If the file isn't a template, simply copy
 * it to the destination.
 *
 * @param {string} inputFile
 * @param {string} outputDir
 * @param {Object} context
 */
const processTemplate = (relFile, inputDir, outputDir, context) => {
    const inputFile = p.join(inputDir, relFile)
    const outputFile = p.join(outputDir, relFile)
    const destDir = p.join(outputFile, '..')

    // Create folder if we are doing a deep copy
    if (destDir) {
        fs.mkdirSync(destDir, {recursive: true})
    }

    if (inputFile.endsWith('.hbs')) {
        const template = sh.cat(inputFile).stdout
        fs.writeFileSync(outputFile.replace('.hbs', ''), Handlebars.compile(template)(context))
    } else {
        fs.copyFileSync(inputFile, outputFile)
    }
}

/**
 * Copy all files, including subdirectories and hidden files
 */
const copyAllFiles = (fromDirectory, targetDirectory) => {
    try {
        fs.cpSync(fromDirectory, targetDirectory, {recursive: true, force: true})
        // NOTE: we've tried using `sh.cp` but it errors out when copying hidden files on Windows machine.
        // See: https://github.com/shelljs/shelljs/issues/711
    } catch (err) {
        console.error(`Error copying files from ${fromDirectory} to ${targetDirectory}:`, err)
        process.exit(1)
    }
}

/**
 * This function does the bulk of the project generation given the project config
 * object and the answers returned from the survey process.
 *
 * @param {*} preset
 * @param {*} answers
 * @param {*} param2
 */
const runGenerator = (
    context,
    {outputDir, templateVersion, verbose, installDependencies = true}
) => {
    const {preset} = context
    const {templateSource} = preset

    // Check if the output directory doesn't already exist.
    checkOutputDir(outputDir)

    // Ensure the output directory exists
    fs.mkdirSync(outputDir, {recursive: true})

    // We need to get some assets from the base template. So extract it after
    // downloading from NPM or copying from the template bundle folder.
    const tmp = fs.mkdtempSync(p.resolve(os.tmpdir(), 'extract-template'))
    const packagePath = p.join(tmp, 'package')
    const {id, type} = templateSource
    let tarPath

    switch (type) {
        case TEMPLATE_SOURCE_NPM: {
            const tarFile = sh
                .exec(`npm pack ${id}@${templateVersion} --pack-destination="${tmp}"`, {
                    silent: true
                })
                .stdout.trim()
            tarPath = p.join(tmp, tarFile)
            break
        }
        case TEMPLATE_SOURCE_BUNDLE:
            tarPath = p.join(__dirname, '..', 'templates', `${id}.tar.gz`)
            break
        default: {
            const msg = `Error: Cannot handle template source type ${type}.`
            console.error(msg)
            process.exit(1)
        }
    }

    // Extract the main template
    tar.x({
        file: tarPath,
        cwd: tmp,
        sync: true
    })

    // Copy the base template either from the package or npm.
    copyAllFiles(packagePath, outputDir)

    // Convert selected plugins array to object with true values
    if (Object.keys(pluginConfig?.plugins || {}).length > 0 && selectedPlugins) {
        trimExtensions(outputDir, selectedPlugins)
    }

    // Compute the checksum of the output directory
    const checksums = computeChecksum(outputDir)
    const checksumFilePath = p.join(outputDir, 'checksum.json')
    const timestamp = new Date().toISOString()
    fs.writeFileSync(
        checksumFilePath,
        JSON.stringify({checksums, timestamp, selectedPlugins}, null, 2)
    )

    // Copy template specific assets over.
    const assetsDir = p.join(ASSETS_TEMPLATES_DIR, id)
    if (sh.test('-e', assetsDir)) {
        getFiles(assetsDir)
            .map((file) => {
                const relFilePath = file.replace(assetsDir, '')
                return relFilePath
            })
            .forEach((relFilePath) => {
                processTemplate(relFilePath, assetsDir, outputDir, context)
            })
    }

    // Prepare updates for package.json
    const pkgUpdates = {
        name: getSlugifiedProjectName(context.answers.project.name || context.preset.id),
        version: GENERATED_PROJECT_VERSION
    }

    // Update the root package.json
    updatePackageJson(p.resolve(outputDir, 'package.json'), pkgUpdates)

    // Clean up the temporary directory
    sh.rm('-rf', tmp)

    if (installDependencies) {
        // Install dependencies for the newly minted project.
        npmInstall(outputDir, {verbose, projectName: context.answers.project.name})
    }
}

const foundNode = process.versions.node
const requiredNode = generatorPkg.engines.node
const isUsingCompatibleNode = semver.satisfies(foundNode, new semver.Range(requiredNode))

const main = async (opts) => {
    if (!isUsingCompatibleNode) {
        console.log('')
        console.warn(
            `Warning: You are using Node ${foundNode}. ` +
                `Your app may not work as expected when deployed to Managed ` +
                `Runtime servers which are compatible with Node ${requiredNode}`
        )
        console.log('')
    }

    let context = INITIAL_CONTEXT
    let {outputDir, verbose, preset, templateVersion} = opts
    const {prompt} = inquirer
    const OUTPUT_DIR_FLAG_ACTIVE = !!outputDir
    const presetId = preset || process.env.GENERATOR_PRESET

    if (presetId && !validPreset(presetId)) {
        console.error(
            `The preset "${presetId}" is not valid. Valid presets are: ${
                process.env.GENERATOR_PRESET
                    ? ALL_PRESET_NAMES.map((x) => `"${x}"`).join(' ')
                    : PUBLIC_PRESET_NAMES.map((x) => `"${x}"`).join(' ')
            }.`
        )
        process.exit(1)
    }

    // If no preset is provided, use the first preset or the preset specified by the GENERATOR_PRESET environment variable
    if (!context.preset) {
        context.preset = presetId ? PRESETS.find(({id}) => id === presetId) : PRESETS[0]
    }

    const {interactive = false, getQuestions, answers = {}} = context.preset
    if (interactive) {
        const questions = getQuestions ? getQuestions() : []
        const projectAnswers = await prompt(questions, answers)
        context = merge(context, {
            answers: expandObject(projectAnswers)
        })
    } else {
        context = merge(context, {
            answers: expandObject(answers)
        })
    }

    // Prompt user for plugin selection
    if (Object.keys(pluginConfig?.plugins || {}).length > 0) {
        const pluginChoices = Object.entries(pluginConfig.plugins).map(([key, config]) => ({
            name: config.description,
            value: key
        }))

        const pluginAnswers = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selectedPlugins',
                message: 'Which extensions would you like to enable?',
                choices: pluginChoices
            }
        ])

        // Convert selected plugins array to object with true values
        pluginAnswers.selectedPlugins.forEach((plugin) => {
            selectedPlugins[plugin] = true
        })
    }

    if (!OUTPUT_DIR_FLAG_ACTIVE) {
        // For extension projects, use the extension name as the output directory
        outputDir = p.join(process.cwd(), context.answers.project.name || context.preset.id)
    }

    if (context.answers.project.commerce?.instanceUrl) {
        // Remove protocol since we only use this to setup the OCAPI proxy
        const url = new URL(context.answers.project.commerce.instanceUrl)
        context.answers.project.commerce.instanceUrl = url.hostname
    }

    // Generate the project.
    runGenerator(context, {outputDir, templateVersion, verbose})

    // Return the folder in which the project was generated in.
    return outputDir
}

if (require.main === module) {
    program.name(`pwa-kit-create-app`)
    program.description(`Generate a new PWA Kit project, optionally using a preset.

Examples:

   ${PRESETS.filter(({private}) => !private).map(({id, description}) => {
       return `
  ${program.name()} --preset "${id}"\n${description}
        `
   })}

   `)
    program
        .option('--outputDir <path>', `Path to the output directory for the new project`)
        .option(
            '--preset <name>',
            `The name of a project preset to use (choices: ${PUBLIC_PRESET_NAMES.map(
                (x) => `"${x}"`
            ).join(', ')})`
        )
        .option(
            '--templateVersion <version>',
            `The version of the template to be generated when it's source is NPM.`,
            DEFAULT_TEMPLATE_VERSION
        )
        .option('--verbose', `Print additional logging information to the console.`, false)

    program.parse(process.argv)

    Promise.resolve()
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
