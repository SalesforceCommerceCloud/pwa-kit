#!/usr/bin/env node --inspect
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

// Utilities
const noop = async (x) => x

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

const TEMPLATE_SOURCE_NPM = 'npm'
const TEMPLATE_SOURCE_BUNDLE = 'bundle'

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
        preGenerate: async (context = {}) => {
            const commerceQuestions = [
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
            const commerceAnswers = await inquirer.prompt(commerceQuestions)

            // Update the context.
            context = merge(context, {
                answers: {
                    project: {
                        commerce: commerceAnswers
                    }
                }
            })

            return context
        },
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
        preGenerate: (context = {}) => {
            return merge(context, {
                answers: {
                    project: {
                        name: 'demo-storefront',
                        commerce: {
                            instanceUrl: 'https://zzte-053.dx.commercecloud.salesforce.com',
                            clientId: '1d763261-6522-4913-9d52-5d947d3b94c4',
                            siteId: 'RefArch',
                            organizationId: 'f_ecom_zzte_053',
                            shortCode: 'kv7kzm78'
                        },
                        einstein: {
                            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                            einsteinSiteId: 'aaij-MobileFirst'
                        }
                    }
                }
            })
        },
        postGenerate: (context, {outputDir}) => {
            const {answers} = context

            if (!answers.general.extend) {
                console.log('copying templates')
                bootstrapTemplate(context, {
                    filterRegex: /(sites.js.hbs|default.js.hbs)$/,
                    outputDir
                })
            }
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
        preGenerate: (context = {}) => {
            return merge(context, {
                answers: {
                    project: {
                        name: 'retail-react-app',
                        commerce: {
                            instanceUrl: 'https://zzrf-001.dx.commercecloud.salesforce.com',
                            clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
                            siteId: 'RefArch',
                            organizationId: 'f_ecom_zzrf_001',
                            shortCode: 'kv7kzm78'
                        },
                        einstein: {
                            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
                            einsteinSiteId: 'aaij-MobileFirst'
                        }
                    }
                }
            })
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

const BOOTSTRAP_DIR = p.join(__dirname, '..', 'assets', 'bootstrap')

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
const runGenerator = (context, {outputDir}) => {
    debugger
    const {answers, preset} = context
    const {templateSource} = preset
    const {extend} = answers.general

    // Check if the output directory doesn't already exist.
    checkOutputDir(outputDir)

    if (extend) {
        bootstrapTemplate(context, {outputDir})
    } else {
        prepareTemplate(templateSource.id, {outputDir, source: templateSource.type})
    }
}

/**
 * Return all the generic questions that relate to all projects that can be
 * generated with this tool. In this case it's the type of project you want
 * to generate, but there might be more in the future.
 *
 * @returns
 */
const askGeneralQuestions = async () => {
    const questions = [
        {
            name: 'presetId',
            message: 'Choose a project preset to get started:',
            type: 'list',
            choices: PRESETS.filter(({private}) => !private).map(({shortDescription, id}) => ({
                name: shortDescription,
                value: id
            }))
        },
        {
            name: 'projectName',
            validate: validProjectName,
            message: 'What is the name of your Project?'
        }
    ]
    const answers = await inquirer.prompt(questions)

    answers.projectName = slugifyName(answers.projectName)

    return answers
}

/**
 *
 * @param {*} context
 * @returns
 */
const askExtensibilityQuestions = async (context) => {
    const {templateSource} = context.preset
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
    let pkgJSON

    if (answers.extend) {
        // In the future we might want to ask what version of the selected project they
        // want to extend. But for now lets just get the latest version and synthetically
        // inject it as an "answer"
        pkgJSON = JSON.parse(
            sh.exec(`npm view ${templateSource.id} --json`, {
                silent: true
            }).stdout
        )
    }

    answers = {
        ...answers,
        templatePackageJSON: pkgJSON
    }

    return answers
}

/**
 *
 * @param {*} generatorContext
 * @param {*} param1
 */
const bootstrapTemplate = (context, {lang = 'js', outputDir, filterRegex}) => {
    const inputDir = p.join(BOOTSTRAP_DIR, lang)
    const files = getAllFiles(inputDir)

    files
        .filter((file) => !filterRegex || !!file.match(file))
        .forEach((inputFile) => {
            const outputFile = outputDir + inputFile.replace(inputDir, '')
            const destDir = outputFile.split(p.sep).slice(0, -1).join(p.sep)

            // Create folder if we are doing a deep copy
            if (destDir) {
                fs.mkdirSync(destDir, {recursive: true})
            }

            if (inputFile.endsWith('.hbs')) {
                const templateString = sh.cat(inputFile)
                const template = Handlebars.compile(templateString.stdout)
                fs.writeFileSync(outputFile.replace('.hbs', ''), template(context))
            } else {
                fs.copyFileSync(inputFile, outputFile)
            }
        })
}

/**
 *
 * @param {*} templateName
 * @param {*} param1
 */
const prepareTemplate = (templateName, {outputDir, source = TEMPLATE_SOURCE_BUNDLE}) => {
    const tmp = fs.mkdtempSync(p.resolve(os.tmpdir(), 'extract-template'))
    switch (source) {
        case TEMPLATE_SOURCE_NPM: {
            console.log('Downloading Template from NPM')
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
            console.log('Extracting Template from Bundle')
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

    // The context object will have all the current information, like the selected preset, the answers
    // to "general" and "project" questions. It'll also be populated with details of the selected project,
    // like its `package.json` value.
    let context = {
        preset: undefined,
        answers: {
            general: undefined,
            project: undefined
        }
    }

    const OUTPUT_DIR_FLAG_ACTIVE = !!opts.outputDir

    const presetId = opts.preset || process.env.GENERATOR_PRESET

    // Exit is preset is provided by not valid.
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

    // Step 1: If we aren't using a preset, ask what type of project the user wants to generate.
    if (!presetId) {
        context.answers.general = await askGeneralQuestions()
    }

    // Add the selected preset to the context object.
    const selectedPreset = PRESETS.find(({id}) => id === context.answers.general.presetId)
    const {preGenerate = noop, postGenerate = noop} = selectedPreset

    // Add the preset to the context. TODO: rename to 'selectedPreset'
    context.preset = selectedPreset

    if (!OUTPUT_DIR_FLAG_ACTIVE) {
        opts.outputDir = p.join(process.cwd(), selectedPreset.id)
    }

    // If the template source is NPM then we know the template can be extended.
    const extendable = selectedPreset.templateSource.type === TEMPLATE_SOURCE_NPM

    // Step 2: If extensibility is supported ask if you want to use it.
    let extendableAnswers = {}

    if (extendable) {
        extendableAnswers = await askExtensibilityQuestions(context)
    }

    // Update the context answers.
    context.answers.general = {
        ...context.answers.general,
        ...extendableAnswers
    }

    // Step 3: Run project specific logic there are any and update the context. We mainly
    // use this for assing project specific questions.
    context = await preGenerate(context)

    // Meh! Think about changing me.
    context.answers.project.name = context.answers.general.projectName

    // Step 4: Generate the project.
    runGenerator(context, {outputDir: opts.outputDir, verbose: opts.verbose})

    // Step 5: Run the post process is one exists
    await postGenerate(context, {outputDir: opts.outputDir})

    // Finally we install the newly minted projects dependencies
    npmInstall(opts.outputDir, {verbose: opts.verbose})

    return true
}

if (require.main === module) {
    program.name(`pwa-kit-create-app`)
    program.description(`Generate a new PWA Kit project, optionally using a preset.

 Examples:

   ${PRESETS.filter(({private}) => !private).map(({id, description}) => {
       return `
         ${program.name()} --preset "${id}"
            ${description}
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
