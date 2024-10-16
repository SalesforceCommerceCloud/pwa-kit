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

const validAppExtensionNameRegex = /^(@[a-zA-Z0-9-_]+\/)?extension-[a-zA-Z0-9-_]+$/
const validProjectAppExtensionName = (input) => {
    if (!validAppExtensionNameRegex.test(input)) {
        return 'The Application Extension name must follow the format @{namespace}/extension-{package-name} (namespace is optional).'
    }
    return true
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

const LOCAL_DEV_PROJECT_DIR = 'dev'

const INITIAL_QUESTION = [
    {
        name: 'project.type',
        message: 'What type of PWA Kit project would you like to create?',
        type: 'list',
        choices: [
            {name: 'PWA Kit App (full project)', value: 'PWAKitProject'},
            {
                name: 'PWA Kit Application Extension (for existing PWA Kit apps)',
                value: 'appExtensionProject'
            }
        ],
        default: 'PWAKitProject'
    }
]

const askApplicationExtensibilityQuestions = (availableAppExtensions) => {
    return [
        {
            name: 'project.useAppExtensibility',
            message: 'Do you want to use Application Extensibility?',
            type: 'confirm',
            default: true
        },
        {
            name: 'project.selectedAppExtensions',
            message: 'Which Application Extensions do you want to install?',
            type: 'checkbox',
            choices: availableAppExtensions,
            when: (answers) => answers.project.useAppExtensibility === true
        },
        {
            name: 'project.extractAppExtensions',
            message:
                '⚠️ WARNING: If you choose to extract the Application Extension code,\n' +
                'you will NO LONGER be able to consume upgrades from NPM. All changes\n' +
                'made to the extracted code will be YOUR RESPONSIBILITY.\n' +
                '\n' +
                'Do you want to proceed with extracting the Application Extensions code?',
            type: 'confirm',
            default: false,
            when: (answers) => answers.project.useAppExtensibility === true
        }
    ]
}

const APPLICATION_EXTENSION_QUESTIONS = [
    {
        name: 'project.extensionName',
        message:
            'What is the name of your Application Extension? \n' +
            'The name must follow the pattern "@{namespace}/extension-{package-name}", where namespace is optional.',
        validate: validProjectAppExtensionName
    }
]

const EXTENSIBILITY_QUESTIONS = [
    {
        name: 'project.extend',
        message: 'Do you wish to use template extensibility?',
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

const RETAIL_REACT_APP_QUESTIONS = [
    {
        name: 'project.name',
        validate: validProjectName,
        message: 'What is the name of your Project?'
    },
    {
        name: 'project.commerce.instanceUrl',
        message: 'What is the URL for your Commerce Cloud instance?',
        validate: validUrl
    },
    {
        name: 'project.commerce.clientId',
        message: 'What is your SLAS Client ID?',
        validate: validClientId
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
        ]
    },
    {
        name: 'project.commerce.siteId',
        message: 'What is your Site ID in Business Manager?',
        validate: validSiteId
    },
    {
        name: 'project.commerce.organizationId',
        message: 'What is your Commerce API organization ID in Business Manager?',
        validate: validOrganizationId
    },
    {
        name: 'project.commerce.shortCode',
        message: 'What is your Commerce API short code in Business Manager?',
        validate: validShortCode
    }
]

// Project dictionary describing details and how the gerator should ask questions etc.
const PRESETS = [
    {
        id: 'retail-react-app',
        name: 'Retail React App',
        description: `
            Generate a project using custom settings by answering questions about a
            B2C Commerce instance.

            Use this preset to connect to an existing instance, such as a sandbox.
        `,
        shortDescription: 'The Retail app using your own Commerce Cloud instance',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        assets: ['translations'],
        private: false
    },
    {
        id: 'retail-react-app-demo',
        name: 'Retail React App Demo',
        description: `
            Generate a project using the settings for a special B2C Commerce
            instance that is used for demo purposes. No questions are asked.

            Use this preset to try out PWA Kit.
        `,
        shortDescription: 'The Retail app with demo Commerce Cloud instance',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: false,
            ['project.name']: 'demo-storefront',
            ['project.commerce.instanceUrl']: 'https://zzte-053.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: '1d763261-6522-4913-9d52-5d947d3b94c4',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzte_053',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: false,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst'
        },
        assets: ['translations'],
        private: false
    },
    {
        id: 'retail-react-app-test-project',
        name: 'Retail React App Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: false,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://zzrf-001.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzrf_001',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: false,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst'
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-private-slas-client',
        name: 'Retail React App Private SLAS client project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: false,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://zzrf-002.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: '89655706-9a0d-49ba-a1e5-18bb2d616374',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzrf_002',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: true,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst'
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-hybrid-test-project',
        name: 'Retail React App Hybrid Test Private SLAS Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...HYBRID_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: true,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://test.phased-launch-testing.com/',
            ['project.commerce.clientId']: '99b4e081-00cf-454a-95b0-26ac2b824931',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_bdpx_dev',
            ['project.commerce.shortCode']: 'xitgmcd3',
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.commerce.isSlasPrivate']: true
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-hybrid-public-client-test-project',
        name: 'Retail React App Hybrid Test Public SLAS client project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...HYBRID_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: true,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://www.phased-launch-testing.com/',
            ['project.commerce.clientId']: 'e7e22b7f-a904-4f3a-8022-49dbee696485',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_bjnl_prd',
            ['project.commerce.shortCode']: 'performance-001',
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.commerce.isSlasPrivate']: false
        },
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
        questions: TYPESCRIPT_MINIMAL_QUESTIONS,
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
        questions: EXPRESS_MINIMAL_QUESTIONS,
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
        questions: EXPRESS_MINIMAL_QUESTIONS,
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
        questions: MRT_REFERENCE_QUESTIONS,
        answers: {
            ['project.name']: 'mrt-reference-app'
        },
        private: true
    },
    {
        id: 'base-app-extension',
        name: 'Template base Application Extension',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'base-app-extension'
        },
        private: true
    },
    {
        id: 'app-extension-sample-extract',
        name: 'Application Extension sample project (Extract Application Extensions code)',
        description:
            'Generate an Application Extension using typescript-minimal template with the Application Extensions code extracted.',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'typescript-minimal'
        },
        questions: TYPESCRIPT_MINIMAL_QUESTIONS,
        answers: {
            ['project.name']: 'app-extension-sample-extract',
            ['project.selectedAppExtensions']: ['extension-sample'],
            ['project.extractAppExtensions']: true
        },
        private: true
    },
    {
        id: 'app-extension-sample-no-extract',
        name: 'Application Extension sample project (Without extracting Application Extensions code)',
        description:
            'Generate an Application Extension using typescript-minimal template without the Applications Extensions code extracted.',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'typescript-minimal'
        },
        questions: TYPESCRIPT_MINIMAL_QUESTIONS,
        answers: {
            ['project.name']: 'app-extension-sample-no-extract',
            ['project.selectedAppExtensions']: ['extension-sample'],
            ['project.extractAppExtensions']: false
        },
        private: true
    }
]

const PRESET_QUESTIONS = [
    {
        name: 'general.presetId',
        message: 'Choose a project preset to get started:',
        type: 'list',
        choices: PRESETS.filter(({private}) => !private).map(({shortDescription, id}) => ({
            name: shortDescription,
            value: id
        }))
    }
]

const BOOTSTRAP_DIR = p.join(__dirname, '..', 'assets', 'bootstrap', 'js')

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
    // Split the project name into namespace and actual name if in the format @namespace/name
    const [namespace, slugifiedName] = projectName.includes('/')
        ? projectName.split('/').map(slugifyName)
        : ['', slugifyName(projectName)]

    const result = namespace ? `${namespace}/${slugifiedName}` : slugifiedName

    return result
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
 * Creates an .npmignore file at the root of the generated project.
 * Ensures the specified directories and files are excluded from being published to npm.
 *
 * @param {string} outputDir - The path to the root of the generated project.
 * @param {string[]} ignorePaths - An array of directory or file paths to ignore in the npm package.
 */
const createNpmIgnoreFile = (outputDir, ignorePaths = []) => {
    const npmIgnoreContent = ignorePaths.join('\n') + '\n'

    fs.writeFileSync(p.join(outputDir, '.npmignore'), npmIgnoreContent)
}

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
 * Process the Application Extensions into the application-extensions directory.
 *
 * @param appExtensions - An array of the Application Extension names.
 * @param extractAppExtensions - A boolean indicating whether to extract the Application Extensions code from the npm package
 * @param appExtensionsDir - The path to the application-extensions directory.
 */
const processAppExtensions = (
    appExtensions = [],
    extractAppExtensions = false,
    appExtensionsDir
) => {
    if (appExtensions.length > 0 && extractAppExtensions) {
        appExtensions.forEach((appExtensionName) => {
            // Create the full path for the temporary directory, preserving the namespace
            const appExtensionTmp = p.join(os.tmpdir(), `extract-${appExtensionName}`)
            fs.mkdirSync(appExtensionTmp, {recursive: true})

            const appExtensionTarFile = sh
                .exec(`npm pack ${appExtensionName} --pack-destination="${appExtensionTmp}"`, {
                    silent: true
                })
                .stdout.trim()

            const appExtensionTarPath = p.join(appExtensionTmp, appExtensionTarFile)

            // Extract the Application Extension
            tar.x({
                file: appExtensionTarPath,
                cwd: appExtensionTmp,
                sync: true
            })

            // Copy the Application Extension into the appropriate folder inside application-extensions
            const appExtensionTmpPath = p.join(appExtensionTmp, 'package')
            const appExtensionDestDir = p.join(appExtensionsDir, appExtensionName)
            sh.mkdir('-p', appExtensionDestDir)

            sh.cp('-rf', p.join(appExtensionTmpPath, '*'), appExtensionDestDir)

            // Clean up the temporary Application Extension directory
            sh.rm('-rf', appExtensionTmp)
        })
    }
}

/**
 * Fetch available Application Extensions using npm search command.
 * The command searches for packages starting with '@salesforce/extension-'.
 *
 * @returns {Array} A list of available Application Extension names and their versions.
 */
const fetchAvailableAppExtensions = () => {
    try {
        const result = child_proc.execSync('npm search @salesforce/extension- --json', {
            encoding: 'utf-8'
        })
        const parsedData = JSON.parse(result)

        // Include both name and version in the choices
        return parsedData.map((pkg) => {
            const latestVersion = pkg['dist-tags'].latest
            return {
                name: `${pkg.name} (v${latestVersion})`,
                value: pkg.name,
                version: latestVersion
            }
        })
    } catch (error) {
        console.error('Failed to fetch Application Extensions via npm search:', error.message)
        return []
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
const runGenerator = async (
    context,
    {outputDir, templateVersion, verbose, installDependencies = true}
) => {
    const {answers, preset} = context
    const {templateSource} = preset

    const {
        extend = false,
        selectedAppExtensions = [],
        extractAppExtensions = false
    } = answers.project

    // Check if the output directory doesn't already exist.
    checkOutputDir(outputDir)

    // Ensure the output directory exists
    fs.mkdirSync(outputDir, {recursive: true})

    // We need to get some assets from the base template. So extract it after
    // downloading from NPM or copying from the template bundle folder.
    const tmp = fs.mkdtempSync(p.resolve(os.tmpdir(), 'extract-template'))
    const packagePath = p.join(tmp, 'package')
    const appExtensionsDir = p.join(outputDir, 'app', 'application-extensions')
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

    if (extend) {
        // Bootstrap the projects.
        getFiles(BOOTSTRAP_DIR)
            .map((file) => file.replace(BOOTSTRAP_DIR, ''))
            .forEach((relFilePath) =>
                processTemplate(relFilePath, BOOTSTRAP_DIR, outputDir, context)
            )

        // Copy required assets defined on the preset level.
        const {assets = []} = preset
        assets.forEach((asset) => {
            sh.cp('-rf', p.join(packagePath, asset), outputDir)
        })
    } else {
        // Copy the base template either from the package or npm.
        sh.cp('-rf', p.join(packagePath, '*'), outputDir)

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

        // Check project type and handle appropriately
        if (answers.project.type === 'appExtensionProject') {
            const devOutputDir = p.join(outputDir, LOCAL_DEV_PROJECT_DIR)

            // Update the root package.json to add a start script
            updatePackageJson(p.resolve(outputDir, 'package.json'), {
                scripts: {
                    start: 'npm --prefix ./dev start'
                }
            })

            // Recursively call runGenerator for the 'typescript-minimal' local dev project
            const localDevProjectContext = {
                ...context,
                preset: {
                    id: 'typescript-minimal',
                    templateSource: {type: TEMPLATE_SOURCE_BUNDLE, id: 'typescript-minimal'},
                    private: true
                },
                answers: {project: {type: 'PWAKitProject', name: 'local-dev-project'}}
            }

            await runGenerator(localDevProjectContext, {
                outputDir: devOutputDir,
                templateVersion,
                verbose,
                installDependencies: false
            })

            // Update the typescript-minimal dev package.json with dependencies
            updatePackageJson(p.resolve(devOutputDir, 'package.json'), {
                devDependencies: {[answers.project.name]: 'file:../'},
                mobify: {app: {extensions: [answers.project.name]}}
            })

            // Create the .npmignore file, excluding the typescript-minimal local dev project folder
            createNpmIgnoreFile(outputDir, [`${LOCAL_DEV_PROJECT_DIR}/`])

            npmInstall(devOutputDir, {
                verbose,
                projectName: localDevProjectContext.answers.project.name
            })
        } else {
            processAppExtensions(selectedAppExtensions, extractAppExtensions, appExtensionsDir)
        }

        // Add selected Application Extensions to devDependencies and mobify object
        const appExtensionDeps = selectedAppExtensions.reduce((acc, appExtensionName) => {
            // Find the corresponding Application Extension details
            const appExtensionDetails = context.availableAppExtensions.find(
                (ext) => ext.value === appExtensionName
            )
            const version = appExtensionDetails ? appExtensionDetails.version : '1.0.0-dev'

            acc[appExtensionName] = extractAppExtensions
                ? `file:./app/application-extensions/${appExtensionName}`
                : version
            return acc
        }, {})

        updatePackageJson(p.resolve(outputDir, 'package.json'), {
            name: getSlugifiedProjectName(context.answers.project.name || context.preset.id),
            version: GENERATED_PROJECT_VERSION,
            devDependencies: appExtensionDeps,
            ...(selectedAppExtensions.length > 0 && {
                mobify: {
                    app: {
                        extensions: selectedAppExtensions.map((appExtensionName) => [
                            appExtensionName
                        ])
                    }
                }
            })
        })

        // Clean up the temporary directory
        sh.rm('-rf', tmp)
    }

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

    // The context object will have all the current information, like the selected preset, the answers
    // to "general" and "project" questions. It'll also be populated with details of the selected project,
    // like its `package.json` value.
    let context = INITIAL_CONTEXT
    let {outputDir, verbose, preset, templateVersion} = opts
    const {prompt} = inquirer
    const OUTPUT_DIR_FLAG_ACTIVE = !!outputDir
    const presetId = preset || process.env.GENERATOR_PRESET

    // Exit if the preset provided is not valid.
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

    // If no preset argument is provided, ask Application Extensibility questions
    if (!presetId) {
        // Ask initial question
        const initialAnswers = await inquirer.prompt(INITIAL_QUESTION)
        context = {...context, answers: {project: initialAnswers.project}}

        if (initialAnswers.project.type === 'appExtensionProject') {
            // Ask for extension name if Application Extension is selected
            const extensionNameAnswers = await inquirer.prompt(APPLICATION_EXTENSION_QUESTIONS)
            context.answers.project.name = extensionNameAnswers.project.extensionName
            context.preset = PRESETS.find(({id}) => id === 'base-app-extension')
        } else {
            const availableAppExtensions = fetchAvailableAppExtensions()

            // Include version info in context
            context.availableAppExtensions = availableAppExtensions

            const generationAnswers = await prompt(
                askApplicationExtensibilityQuestions(availableAppExtensions)
            )
            context = merge(context, {answers: expandObject(generationAnswers)})

            if (context.answers.project.useAppExtensibility) {
                // Add the 'typescript-minimal' preset for Application Extension
                context.preset = PRESETS.find(({id}) => id === 'typescript-minimal')
            }
        }
    }

    // If no preset is provided, prompt the user with available preset options
    if (!presetId && !context.preset) {
        context.answers = await prompt(PRESET_QUESTIONS)
    }

    // Set the preset to the selected preset or based on presetId
    const selectedPreset =
        context.preset ||
        PRESETS.find(({id}) => id === (presetId || context.answers.general.presetId))
    context.preset = selectedPreset

    // Ask preset specific questions and merge into the current context.
    const {questions = {}, answers = {}} = selectedPreset
    if (questions) {
        const projectAnswers = await prompt(questions, answers)

        context = merge(context, {
            answers: expandObject(projectAnswers)
        })
    }

    if (!OUTPUT_DIR_FLAG_ACTIVE) {
        outputDir = p.join(process.cwd(), context.answers.project.name || selectedPreset.id)
    }

    if (context.answers.project.commerce?.instanceUrl) {
        // Remove protocol since we only use this to setup the OCAPI proxy
        const url = new URL(context.answers.project.commerce.instanceUrl)
        context.answers.project.commerce.instanceUrl = url.hostname
    }

    // Inject the packageJSON into the context for extensibile projects.
    if (context.answers.project.extend) {
        const pkgJSON = JSON.parse(
            sh.exec(`npm view ${selectedPreset.templateSource.id}@${templateVersion} --json`, {
                silent: true
            }).stdout
        )

        // NOTE: Here we are rewriting a specific script (extract-default-translations) in order
        // to update the script location for extensibility. In the future we'll hopefully
        // move transations outside of the template and into the sdk where the script for
        // building translations will ultimately live, meaning we won't have to do this. So
        // its OK for now.
        if (pkgJSON?.scripts['extract-default-translations']) {
            pkgJSON.scripts['extract-default-translations'] = pkgJSON.scripts[
                'extract-default-translations'
            ].replace('./', `./node_modules/${selectedPreset.templateSource.id}/`)
        }
        if (pkgJSON?.scripts['compile-translations']) {
            pkgJSON.scripts['compile-translations'] = pkgJSON.scripts[
                'compile-translations'
            ].replace('./', `./node_modules/${selectedPreset.templateSource.id}/`)
        }
        if (pkgJSON?.scripts['compile-translations:pseudo']) {
            pkgJSON.scripts['compile-translations:pseudo'] = pkgJSON.scripts[
                'compile-translations:pseudo'
            ].replace('./', `./node_modules/${selectedPreset.templateSource.id}/`)
        }

        context = merge(
            context,
            expandObject({
                ['answers.general.packageJSON']: pkgJSON
            })
        )
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
