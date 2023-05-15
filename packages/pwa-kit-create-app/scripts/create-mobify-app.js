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

const GENERATED_PROJECT_VERSION = '0.0.1'

// Validations
const validPreset = (preset) => {
    return Object.keys(PRESETS).includes(preset)
}

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

// Project name constants.
const RETAIL_REACT_APP_DEMO = 'retail-react-app-demo'
const RETAIL_REACT_APP_TEST_PROJECT = 'retail-react-app-test-project' // TODO: update the ci scripts
const RETAIL_REACT_APP = 'retail-react-app'
const TYPESCRIPT_MINIMAL_TEST_PROJECT = 'typescript-minimal-test-project'
const TYPESCRIPT_MINIMAL = 'typescript-minimal'
const EXPRESS_MINIMAL_TEST_PROJECT = 'express-minimal-test-project'
const EXPRESS_MINIMAL = 'express-minimal'
const MRT_REFERENCE_APP = 'mrt-reference-app'

// Project dictionary describing details and how the gerator should ask questions etc.
const PRESETS = {
    [RETAIL_REACT_APP]: {
        id: RETAIL_REACT_APP,
        name: 'Retail React App',
        description: 'The Retail app using your own Commerce Cloud instance',
        templateSources: [
            {
                type: 'npm',
                id: 'retail-react-app'
            },
            {
                type: 'bundle',
                id: 'template-retail-react-app'
            }
        ],
        preProcess: async (answers = {}) => {
            // "answers" are the answers up until asking the detailed project quesions.
            const questions = [
                {
                    name: 'instanceUrl',
                    message: 'What is the URL for your Commerce Cloud instance?',
                    validate: validUrl
                },
                {
                    name: 'clientId',
                    message: 'What is your SLAS Client ID?',
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
            const projectAnswers = await inquirer.prompt(questions)

            return {
                ...answers,
                project: projectAnswers
            }
        },
        private: false
    },
    [RETAIL_REACT_APP_DEMO]: {
        id: RETAIL_REACT_APP_DEMO,
        name: 'Retail React App Demo',
        description: 'The Retail app with demo Commerce Cloud instance',
        templateSources: [
            {
                type: 'bundle',
                id: 'template-retail-react-app'
            }
        ],
        preProcess: (answers = {}) => {
            return {
                ...answers,
                project: {
                    projectName: 'demo-storefront',
                    instanceUrl: 'https://zzte-053.dx.commercecloud.salesforce.com',
                    clientId: '1d763261-6522-4913-9d52-5d947d3b94c4',
                    siteId: 'RefArch',
                    organizationId: 'f_ecom_zzte_053',
                    shortCode: 'kv7kzm78',
                    einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                    einsteinSiteId: 'aaij-MobileFirst'
                }
            }
        },
        private: false
    },
    [RETAIL_REACT_APP_TEST_PROJECT]: {
        id: RETAIL_REACT_APP_TEST_PROJECT,
        name: 'Retail React App Test Project',
        description: '',
        templateSources: [
            {
                type: 'bundle',
                id: 'template-retail-react-app'
            }
        ],
        preProcess: () => {
            return {
                projectName: 'retail-react-app',
                instanceUrl: 'https://zzrf-001.dx.commercecloud.salesforce.com',
                clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
                siteId: 'RefArch',
                organizationId: 'f_ecom_zzrf_001',
                shortCode: 'kv7kzm78',
                einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                einsteinSiteId: 'aaij-MobileFirst'
            }
        },
        private: false
    },
    [TYPESCRIPT_MINIMAL_TEST_PROJECT]: {
        id: TYPESCRIPT_MINIMAL_TEST_PROJECT,
        name: 'Template Minimal Test Project',
        description: '',
        templateSources: [
            {
                type: 'bundle',
                id: 'template-typescript-minimal'
            }
        ],
        private: true
    },
    [TYPESCRIPT_MINIMAL]: {
        id: TYPESCRIPT_MINIMAL,
        name: 'Template Minimal Project',
        description: '',
        templateSources: [
            {
                type: 'bundle',
                id: 'template-typescript-minimal'
            }
        ],
        private: true
    },
    [EXPRESS_MINIMAL_TEST_PROJECT]: {
        id: EXPRESS_MINIMAL_TEST_PROJECT,
        name: 'Express Minimal Test Project',
        description: '',
        templateSources: [
            {
                type: 'bundle',
                id: 'template-express-minimal'
            }
        ],
        private: true
    },
    [EXPRESS_MINIMAL]: {
        id: EXPRESS_MINIMAL,
        name: 'Express Minimal Project',
        description: '',
        templateSources: [
            {
                type: 'bundle',
                id: 'template-express-minimal'
            }
        ],
        private: true
    },
    [MRT_REFERENCE_APP]: {
        id: MRT_REFERENCE_APP,
        name: 'Managed Runtime Reference App',
        description: '',
        templateSources: [
            {
                type: 'bundle',
                id: 'template-mrt-reference-app'
            }
        ],
        private: true
    }
}

const PRIVATE_PRESET_NAMES = Object.values(PRESETS)
    .filter(({private}) => !!private)
    .map(({id}) => id)

const PUBLIC_PRESET_NAMES = Object.values(PRESETS)
    .filter(({private}) => !private)
    .map(({id}) => id)

const ALL_PRESET_NAMES = PRIVATE_PRESET_NAMES.concat(PUBLIC_PRESET_NAMES)

const PROJECT_ID_MAX_LENGTH = 20

const SDK_VERSION = generatorPkg.version

// Utilities

const readJson = (path) => JSON.parse(sh.cat(path))

const writeJson = (path, data) => new sh.ShellString(JSON.stringify(data, null, 2)).to(path)

const replaceJSON = (path, replacements) =>
    writeJson(path, Object.assign(readJson(path), replacements))

const slugifyName = (name) =>
    slugify(name, {
        lower: true,
        strict: true
    }).slice(0, PROJECT_ID_MAX_LENGTH)

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
const getAllFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath)

    files.forEach(function (file) {
        if (fs.statSync(p.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(p.join(dirPath, file), arrayOfFiles)
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
 *
 * @param {*} outputDir
 * @param {*} param1
 */
const npmInstall = (outputDir, {verbose}) => {
    console.log('Installing dependencies... This may take a few minutes.\n')
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
 * This function does the bulk of the project generation given the project config
 * object and the answers returned from the survey process.
 *
 * @param {*} preset
 * @param {*} answers
 * @param {*} param2
 */
const runGenerator = (preset, answers, {outputDir, verbose}) => {
    console.log('runGenerator: ')
    console.log('preset: ', preset)
    console.log('answers: ', answers)
    const {templateSource, projectId} = answers.general
    const templateSourceType = templateSource.type

    // Check if the output directory doesn't already exist.
    checkOutputDir(outputDir)

    switch (templateSourceType) {
        case 'npm': {
            const inputDir = p.join(__dirname, '..', 'assets', 'bootstrap-templates', 'pwa-kit-js')

            // Copy folder to destination and process template if required.
            getAllFiles(inputDir).forEach((inputFile) => {
                const outputFile = outputDir + inputFile.replace(inputDir, '')
                const destDir = outputFile.split(p.sep).slice(0, -1).join(p.sep)

                // Create folder if we are doing a deep copy
                if (destDir) {
                    fs.mkdirSync(destDir, {recursive: true})
                }

                if (inputFile.endsWith('.hbs')) {
                    const templateString = sh.cat(inputFile)
                    const template = Handlebars.compile(templateString.stdout)
                    fs.writeFileSync(outputFile.replace('.hbs', ''), template({answers}))
                } else {
                    fs.copyFileSync(inputFile, outputFile)
                }
            })
            break
        }
        case 'bundle':
            prepareTemplate(templateSource.id, {outputDir, source: templateSourceType})
            break
        default:
            console.error('Unknown template source type. How did I get here?')
            process.exit(1)
    }

    // This is where we do post processing of the project. Like updating package json values,
    // etc.
    const pkgJsonPath = p.resolve(outputDir, 'package.json')
    const pkgJSON = readJson(pkgJsonPath)
    const finalPkgData = merge(pkgJSON, {name: projectId})
    writeJson(pkgJsonPath, finalPkgData)

    // Finally we install the newly minted projects dependencies
    npmInstall(outputDir, {verbose})
}

/**
 * Return all the generic questions that relate to all projects that can be
 * generated with this tool. In this case it's the type of project you want
 * to generate, but there might be more in the future.
 *
 * @returns
 */
const askGeneralQuestions = async () => {
    // 'projectId' is synonymous with the package name.
    const questions = [
        {
            name: 'presetId',
            message: 'Choose a project preset to get started:',
            type: 'list',
            choices: Object.values(PRESETS)
                .filter(({private}) => !private)
                .map(({description, id}) => ({name: description, value: id}))
        },
        {
            name: 'projectName',
            validate: validProjectName,
            message: 'What is the name of your Project?'
        }
    ]

    return await inquirer.prompt(questions)
}

const askExtensibilityQuestions = async () => {
    // Returns the extends, and version, and output dir (leave that out for now.)
    const questions = [
        {
            name: 'extend',
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

    let answers = await inquirer.prompt(questions)
    let version

    if (answers.extendable) {
        // In the future we might want to ask what version of the selected project they
        // want to extend. But for now lets just get the latest version and synthetically
        // inject it as an "answer"
        version = sh.execSync(`npm view ${'pwa-kit-react-sdk'} version`).stdout
    }

    answers = {
        ...answers,
        templateVersion: version
    }

    return answers
}

const prepareTemplate = (templateName, {outputDir, source = 'bundle'}) => {
    console.log('prepareTemplate: ', templateName, outputDir, source)
    const tmp = fs.mkdtempSync(p.resolve(os.tmpdir(), 'extract-template'))

    switch (source) {
        case 'npm': {
            const {stdout} = sh.exec(
                `npm pack ${templateName}@latest --pack-destination="${tmp}"`,
                {
                    silent: true
                }
            )
            tar.x({
                file: p.join(tmp, stdout.trim()),
                cwd: p.join(tmp),
                sync: true
            })
            sh.cp('-R', p.join(tmp, 'package', '*'), outputDir)

            break
        }
        default:
            tar.x({
                file: p.join(__dirname, '..', 'templates', `${templateName}.tar.gz`),
                cwd: p.join(tmp),
                sync: true
            })
            sh.cp('-R', p.join(tmp, templateName), outputDir)
            sh.rm('-rf', tmp)
    }

    // Clean up
    sh.rm('-rf', tmp)
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

    const OUTPUT_DIR_FLAG_ACTIVE = !!opts.outputDir

    const presetId = opts.preset || process.env.GENERATOR_PRESET
    let preset
    let answers = {
        general: {
            projectId: preset
        }
    }

    // Exit is preset is provided by not valid.
    if (presetId && !validPreset(presetId)) {
        console.error(
            `The preset "${preset}" is not valid. Valid presets are: ${
                process.env.GENERATOR_PRESET
                    ? ALL_PRESET_NAMES.map((x) => `"${x}"`).join(' ')
                    : PUBLIC_PRESET_NAMES.map((x) => `"${x}"`).join(' ')
            }.`
        )
        process.exit(1)
    }

    // Step 1: If we aren't using a preset ask what type of project the user wants to generate.
    // TODO: We need a flag to show private projects.
    if (!presetId) {
        answers.general = await askGeneralQuestions()
    }

    // Assign project details for use in following steps.
    preset = PRESETS[answers.general.presetId]

    // For convenience access only
    const noop = async (x) => x // TODO: Move me.
    const {preProcess = noop, postProcess = noop} = preset

    if (!OUTPUT_DIR_FLAG_ACTIVE) {
        opts.outputDir = p.join(process.cwd(), preset.id)
    }

    // If the preset is configured to allow its template source to be "NPM"
    // then that means it supports extensibility.
    const extendable = preset.templateSources.find(({type}) => type === 'npm')

    // Step 2: If extensibility is supported ask if you want to use it.
    let templateSource
    let extendableAnswers = {}

    if (extendable) {
        extendableAnswers = await askExtensibilityQuestions(preset)
    }

    // Get the templateSource object based on the `extendable` answer.
    const {extend = false} = extendableAnswers
    templateSource = preset.templateSources.find(({type}) =>
        extend || false ? type === 'npm' : type === 'bundle'
    )

    // TODO: Maybe error when template source is not defined.
    console.log('templateSource: ', templateSource)
    answers.general = {
        ...answers.general,
        ...extendableAnswers,
        templateSource
    }

    // Step 3: Ask project specific questions if there are any.
    answers = await preProcess(answers)

    // Step 4: Generate the project.
    runGenerator(preset, answers, {outputDir: opts.outputDir, verbose: opts.verbose})

    // Step 5: Run the post process is one exists
    await postProcess(opts.outputDir)

    return true
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

   ${program.name()} --preset "${EXPRESS_MINIMAL}"
     Generate a project using a bare-bones express app template.

     Use this as a starting point for APIs or as a base on top of
     which to build new project templates for Managed Runtime.
     
   ${program.name()} --preset "${TYPESCRIPT_MINIMAL}"
     Generate a project using a bare-bones TypeScript app template.
     
     Use this as a TypeScript starting point or as a base on top of 
     which to build new TypeScript project templates for Managed Runtime.
   `)
    program
        .option('--outputDir <path>', `Path to the output directory for the new project`)
        .option(
            '--preset <name>',
            `The name of a project preset to use (choices: ${PUBLIC_PRESET_NAMES.map(
                (x) => `"${x}"`
            ).join(', ')})`
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
