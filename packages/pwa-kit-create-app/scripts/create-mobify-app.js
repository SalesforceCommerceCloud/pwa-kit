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

// Register Handlebars helper to allow use to display objects.
Handlebars.registerHelper('json', (context) => JSON.stringify(context, null, 4))

const program = new Command()

sh.set('-e')

const GENERATED_PROJECT_VERSION = '0.0.1'

const INITIAL_CONTEXT = {
    preset: undefined,
    answers: {
        general: {},
        project: {}
    }
}

// Validations
const validPreset = (preset) => {
    return ALL_PRESET_NAMES.includes(preset)
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

const TEMPLATE_SOURCE_NPM = 'npm'
const TEMPLATE_SOURCE_BUNDLE = 'bundle'

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
            id: 'retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
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
            id: 'retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.name']: 'demo-storefront',
            ['project.commerce.instanceUrl']: 'https://zzte-053.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: '1d763261-6522-4913-9d52-5d947d3b94c4',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzte_053',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst'
        },
        private: false
    },
    {
        id: 'retail-react-app-test-project',
        name: 'Retail React App Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'template-retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://zzrf-001.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzrf_001',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst'
        },
        private: true
    },
    {
        id: 'typescript-minimal-test-project',
        name: 'Template Minimal Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'template-typescript-minimal'
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
            id: 'template-typescript-minimal'
        },
        private: true
    },
    {
        id: 'express-minimal-test-project',
        name: 'Express Minimal Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'template-express-minimal'
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
            id: 'template-express-minimal'
        },
        private: true
    },
    {
        id: 'mrt-reference-app',
        name: 'Managed Runtime Reference App',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'template-mrt-reference-app'
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

    files.forEach((file) => {
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
 * @param {*} key
 * @param {*} value
 * @returns
 */
const expand = (key, value) =>
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
 *
 * @param {*} answers
 * @returns
 */
// TODO: Think of better names.
const expandDotNotationObject = (answers = {}) =>
    Object.keys(answers).reduce((acc, curr) => merge(acc, expand(curr, answers[curr])), {})

/**
 * Envoke the "npm install" command for the provided project directory.
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
 *
 * @param {*} inputFile
 * @param {*} outputDir
 * @param {*} context
 */
const processTemplate = (inputFile, outputDir, context, baseDir) => {
    const outputFile = outputDir + inputFile.replace(baseDir, '')
    const destDir = outputFile.split(p.sep).slice(0, -1).join(p.sep)

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
 * This function does the bulk of the project generation given the project config
 * object and the answers returned from the survey process.
 *
 * @param {*} preset
 * @param {*} answers
 * @param {*} param2
 */
const runGenerator = (context, {outputDir, verbose}) => {
    const {answers, preset} = context
    const {templateSource} = preset
    const {extend = false} = answers.project

    // Check if the output directory doesn't already exist.
    checkOutputDir(outputDir)

    if (extend) {
        getAllFiles(BOOTSTRAP_DIR).forEach((inputFile) =>
            // TODO: Clean up this sig
            processTemplate(inputFile, outputDir, context, BOOTSTRAP_DIR)
        )
    } else {
        const tmp = fs.mkdtempSync(p.resolve(os.tmpdir(), 'extract-template'))
        const {id, type} = templateSource

        switch (type) {
            case TEMPLATE_SOURCE_NPM: {
                const {stdout} = sh.exec(`npm pack ${id}@latest --pack-destination="${tmp}"`, {
                    silent: true
                })
                tar.x({
                    file: p.join(tmp, stdout.trim()),
                    cwd: p.join(tmp),
                    sync: true
                })
                sh.mv(p.join(tmp, 'package'), outputDir)
                break
            }
            case TEMPLATE_SOURCE_BUNDLE:
                tar.x({
                    file: p.join(__dirname, '..', 'templates', `${id}.tar.gz`),
                    cwd: p.join(tmp),
                    sync: true
                })
                sh.cp('-R', p.join(tmp, id), outputDir)
                break
            default: {
                const msg = `Error: Cannot handle template source type ${type}.`
                console.error(msg)
                process.exit(1)
            }
        }

        // Copy template specific assets over.
        const assetsDir = p.join(ASSETS_TEMPLATES_DIR, id)
        if (sh.test('-e', assetsDir)) {
            getAllFiles(assetsDir).forEach((inputFile) =>
                processTemplate(inputFile, outputDir, context, assetsDir)
            )
        }

        // Clean up
        sh.rm('-rf', tmp)
    }

    // Update the generated projects version. NOTE: For bootstrapped projects this
    // can be done in the template building. But since we have two types of project builds,
    // (bootstrap/bundle) we'll do it here where it works in both scenarios.
    const pkgJsonPath = p.resolve(outputDir, 'package.json')
    const pkgJSON = readJson(pkgJsonPath)
    const finalPkgData = merge(pkgJSON, {
        name: context.preset.id,
        version: GENERATED_PROJECT_VERSION
    })
    writeJson(pkgJsonPath, finalPkgData)

    // Install dependencies for the newly minted project.
    npmInstall(outputDir, {verbose})
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
    let {outputDir, verbose, preset} = opts
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

    // If there is no preset arg, prompt the user with a selection of presets.
    if (!presetId) {
        context.answers = await prompt(PRESET_QUESTIONS)
    }

    // Add the selected preset to the context object.
    const selectedPreset = PRESETS.find(
        ({id}) => id === (presetId || context.answers.general.presetId)
    )

    // Add the preset to the context.
    context.preset = selectedPreset

    if (!OUTPUT_DIR_FLAG_ACTIVE) {
        outputDir = p.join(process.cwd(), selectedPreset.id)
    }

    // Ask preset specific questions.
    const {questions = {}, answers = {}} = selectedPreset
    if (questions) {
        const projectAnswers = await prompt(questions, answers)

        // Merge answers into context.
        context.answers = {
            ...context.answers,
            ...expandDotNotationObject(projectAnswers)
        }
    }

    // If the project is using extensibility, add the package.json content
    // to the context.
    if (context.answers.project.extend) {
        // In the future we might want to ask what version of the selected project they
        // want to extend. But for now lets just get the latest version and synthetically
        // inject it as an "answer"
        const pkgJSON = JSON.parse(
            sh.exec(`npm view ${selectedPreset.templateSource.id} --json`, {
                silent: true
            }).stdout
        )

        // TODO: Can we make a util for this to make it look nicer.
        context = merge(
            context,
            expandDotNotationObject({
                ['answers.general.packageJSON']: pkgJSON
            })
        )
    }
    console.log('context: ', context)
    // Generate the project.
    runGenerator(context, {outputDir, verbose})

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
