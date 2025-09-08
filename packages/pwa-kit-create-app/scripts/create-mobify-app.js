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
const PROGRAM = require('../program.json')

// Presets, Templates and Validators
const {
    examples: EXAMPLES,
    options: OPTIONS,
    presets: PRESETS,
    templates: TEMPLATES,
    validators: VALIDATORS
} = PROGRAM.data

// Questions composed of public presets and public templates.
// NOTE: We have to do some weird stuff to determine if the thing we are selecting is a preset or a template.
// There might be a better way to do this.
// NOTE: Id's between presets and templates are unique. We should not break this contract.
const INITIAL_QUESTIONS = [
    {
        name: 'general.presetOrTemplateId',
        message: 'Choose a project preset to get started:',
        type: 'list',
        choices: [
            ...PRESETS.filter(({private}) => !private).map(({shortDescription, id}) => ({
                name: shortDescription,
                value: id
            })),
            ...TEMPLATES.filter(({private}) => !private).map(({shortDescription, id}) => ({
                name: shortDescription,
                value: id
            }))
        ].sort((a, b) => (a.name || '').localeCompare(b.name))
    }
]

const program = new Command()

sh.set('-e')

// Handlebars helpers

// Our eslint script uses escaped double quotes to have windows compatibility. This helper
// will ensure those escaped double quotes are still escaped after processing the template.
Handlebars.registerHelper('script', (object) => object.replaceAll('"', '\\"'))

// Helper to convert JavaScript objects to JSON strings
Handlebars.registerHelper('json', (object) => JSON.stringify(object, null, 4))

// Validations
const validPreset = (preset) => {
    return ALL_PRESET_NAMES.includes(preset)
}

// Globals
const GENERATED_PROJECT_VERSION = '0.0.1'

const INITIAL_CONTEXT = {
    template: undefined,
    answers: {
        general: {},
        project: {}
    }
}
const TEMPLATE_SOURCE_NPM = 'npm'
const TEMPLATE_SOURCE_BUNDLE = 'bundle'

const BOOTSTRAP_DIR = p.join(__dirname, '..', 'assets', 'bootstrap', 'js')
const ASSETS_TEMPLATES_DIR = p.join(__dirname, '..', 'assets', 'templates')
const PRIVATE_PRESET_NAMES = PRESETS.filter(({private}) => !!private).map(({id}) => id)
const PUBLIC_PRESET_NAMES = PRESETS.filter(({private}) => !private).map(({id}) => id)
const ALL_PRESET_NAMES = PRIVATE_PRESET_NAMES.concat(PUBLIC_PRESET_NAMES)
const PROJECT_ID_MAX_LENGTH = 20

// Utilities

const readJson = (path) => JSON.parse(sh.cat(path))

const writeJson = (path, data) => new sh.ShellString(JSON.stringify(data, null, 2)).to(path)

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
 * If the generated project is based on a template that includes '.cursor/rules',
 * this function copies the rules from the installed node_modules into the
 * top-level of the generated project.
 * @param {string} outputDir - The directory of the generated project
 * @private
 */
const copyCursorRules = (outputDir) => {
    const cursorRulesFromDir = p.join(
        outputDir,
        'node_modules',
        '@salesforce',
        'retail-react-app',
        '.cursor',
        'rules'
    )
    if (sh.test('-e', cursorRulesFromDir)) {
        const outputCursorRulesDir = p.join(outputDir, '.cursor', 'rules')

        // Create the directory if it doesn't exist
        if (!sh.test('-e', outputCursorRulesDir)) {
            fs.mkdirSync(outputCursorRulesDir, {recursive: true})
        }

        // Copy the contents of cursorRulesFromDir to outputCursorRulesDir
        const files = fs.readdirSync(cursorRulesFromDir)
        files.forEach((file) => {
            sh.cp('-rf', p.join(cursorRulesFromDir, file), outputCursorRulesDir)
        })
    }
}

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
 * This function does the bulk of the project generation given the project config
 * object and the answers returned from the survey process.
 *
 * @param {*} preset
 * @param {*} answers
 * @param {*} param2
 */
const runGenerator = (context, {outputDir, templateVersion, verbose}) => {
    const {answers, template} = context
    const {id, source} = template
    const {extend = false} = answers.project

    // Check if the output directory doesn't already exist.
    checkOutputDir(outputDir)

    // We need to get some assets from the base template. So extract it after
    // downloading from NPM or copying from the template bundle folder.
    const tmp = fs.mkdtempSync(p.resolve(os.tmpdir(), 'extract-template'))
    const packagePath = p.join(tmp, 'package')
    let tarPath

    switch (source.type) {
        case TEMPLATE_SOURCE_NPM: {
            const tarFile = sh
                .exec(`npm pack ${source.name}@${templateVersion} --pack-destination="${tmp}"`, {
                    silent: true
                })
                .stdout.trim()
            tarPath = p.join(tmp, tarFile)
            break
        }
        case TEMPLATE_SOURCE_BUNDLE:
            tarPath = p.join(__dirname, '..', 'templates', `${source?.name || id}.tar.gz`)
            break
        default: {
            const msg = `Error: Cannot handle template source type ${source.type}.`
            console.error(msg)
            process.exit(1)
        }
    }

    // Extract the source
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
        const {assets = []} = template
        assets.forEach((asset) => {
            sh.cp('-rf', p.join(packagePath, asset), outputDir)
        })
        // Install dependencies for the newly minted project.
        npmInstall(outputDir, {verbose})

        // Extended project does not contain cursor rules and need explicit copy
        copyCursorRules(outputDir)
    } else {
        console.log('Copying base template from package or npm: ', packagePath, outputDir)
        // Copy the base template either from the package or npm.
        sh.cp('-rf', packagePath, outputDir)

        // Copy template specific assets over, if they exist.
        const assetsDir = p.join(ASSETS_TEMPLATES_DIR, source.name || id)
        if (sh.test('-e', assetsDir)) {
            console.log(`Copying template-specific assets from ${assetsDir}`)
            getFiles(assetsDir)
                .map((file) => file.replace(assetsDir, ''))
                .forEach((relFilePath) =>
                    processTemplate(relFilePath, assetsDir, outputDir, context)
                )
        } else {
            // However, we expected to see assetsDir for retail-react-app template
            if (source.name === '@salesforce/retail-react-app') {
                console.error(
                    `Error: cannot find template-specific assets for retail-react-app in directory ${assetsDir}`
                )
                process.exit(1)
            }
        }

        // Update the generated projects version. NOTE: For bootstrapped projects this
        // can be done in the template building. But since we have two types of project builds,
        // (bootstrap/bundle) we'll do it here where it works in both scenarios.
        const pkgJsonPath = p.resolve(outputDir, 'package.json')
        const pkgJSON = readJson(pkgJsonPath)
        const finalPkgData = merge(pkgJSON, {
            name: slugifyName(context.answers.project.name || context.template.id),
            version: GENERATED_PROJECT_VERSION
        })
        writeJson(pkgJsonPath, finalPkgData)

        // Clean up
        sh.rm('-rf', tmp)

        // Install dependencies for the newly minted project.
        npmInstall(outputDir, {verbose})
    }
}

const foundNode = process.versions.node
const requiredNode = generatorPkg.engines.node
const isUsingCompatibleNode = semver.satisfies(foundNode, new semver.Range(requiredNode))

/**
 * Reads all data from standard input (stdin) asynchronously and resolves with the complete input as a string.
 * Useful for accepting piped or redirected input, such as JSON answers for non-interactive CLI usage.
 *
 * @returns {Promise<string>} A promise that resolves with the full stdin input as a string.
 */
const readStdin = async () => {
    return new Promise((resolve, reject) => {
        let input = ''
        process.stdin.setEncoding('utf8')

        process.stdin.on('data', (chunk) => {
            input += chunk
        })

        process.stdin.on('end', () => {
            resolve(input)
        })

        process.stdin.on('error', (err) => {
            reject(err)
        })
    })
}

/**
 * Validates the parsed answers object for required fields and structure.
 * Currently only checks for 'general.presetOrTemplateId', but can be extended for more robust validation.
 * Throws an error if validation fails.
 *
 * @param {Object} answers - The parsed answers object from stdin.
 */
const validateAnswers = (answers) => {
    if (!answers['general.presetOrTemplateId']) {
        throw new Error('Missing required field: "general.presetOrTemplateId"')
    }

    // Future enhancement: Add validation for template specific answers.
}

/**
 * Reads and parses JSON input from stdin for non-interactive CLI usage.
 * Exits the process with an error message if input is invalid or missing required fields.
 *
 * @returns {Promise<Object>} - The merged answers object.
 */
const getAnswersFromStdin = async () => {
    try {
        const input = await readStdin()
        if (!input.trim()) {
            throw new Error('No input received. Please pipe valid JSON to stdin.')
        }
        const parsedInput = JSON.parse(input)

        // Do answer validation.
        validateAnswers(parsedInput)

        return expandObject(parsedInput)
    } catch (err) {
        if (err instanceof SyntaxError) {
            console.error('Invalid JSON format in stdin input')
        } else {
            console.error('Failed to process stdin input:', err.message)
        }
        process.exit(1)
    }
}

/**
 * Prints the contents of program.json in a nicely formatted way and exits the process.
 */
const printProgramJsonAndExit = async () => {
    const output = JSON.stringify(PROGRAM, null, 2)
    await new Promise((resolve) => {
        process.stdout.write(output + '\n', () => {
            resolve()
        })
    })
    process.exit(0)
}

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
    let isPreset = false
    let answers = {}
    let selectedTemplate
    let {outputDir, verbose, preset, templateVersion, stdio, displayProgram} = opts
    const {prompt} = inquirer
    const OUTPUT_DIR_FLAG_ACTIVE = !!outputDir
    const presetId = preset || process.env.GENERATOR_PRESET

    // Exit if the preset provided is not valid.
    if (displayProgram) {
        await printProgramJsonAndExit()
    }

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

    // If there is no preset provided via the CLI, check for stdio input or prompt the user
    if (stdio) {
        answers = await getAnswersFromStdin()
    } else {
        answers = await prompt(
            INITIAL_QUESTIONS,
            presetId ? {general: {presetOrTemplateId: presetId}} : {}
        )
    }

    // Determine if the selection is a preset or template.
    isPreset = PRESETS.some(({id}) => id === answers?.general?.presetOrTemplateId)

    // Update the answer with the actual template id.
    if (isPreset) {
        const selectedPreset = PRESETS.find(({id}) => id === answers.general.presetOrTemplateId)

        // NOTE: This is a little weird, but we'll set this value to the template id and treat is as such from this point forward..
        answers.general.presetOrTemplateId = selectedPreset.templateId

        // Expand the preset answers into the answers object.
        answers = merge(answers, expandObject(selectedPreset.answers))
    }

    // Since we know we have the template id, we can find the template.
    selectedTemplate = TEMPLATES.find(({id}) => id === answers.general.presetOrTemplateId)

    // Give some feedback to the user.
    console.log(`Using template "${selectedTemplate.id}"`)

    // Assign the  preset to the context.
    context.template = selectedTemplate
    context.answers = answers

    if (!OUTPUT_DIR_FLAG_ACTIVE) {
        outputDir = p.join(process.cwd(), selectedTemplate.id)
    }

    // Ask template specific questions and merge into the current context.
    // NOTE: Only questions that don't have supplied answers will be asked. This is how we get away with simplifying the code.
    let {questions} = selectedTemplate

    // Inquirer doesn't support Regex values for the "validate" property. So lets make a function for it.
    questions = questions.map((question) => {
        const validator = VALIDATORS.find(({id}) => id === question.validator)

        return {
            ...question,
            validate: validator?.regex
                ? (input) => new RegExp(validator.regex, 'i').test(input) || validator.message
                : undefined
        }
    })

    // As the template specific questions. If we already have answers from the preset, then no questions
    // will be asked.
    const projectAnswers = await prompt(questions, answers)

    // Update the context.
    context = merge(context, {
        answers: expandObject(projectAnswers)
    })

    if (context.answers.project.commerce?.instanceUrl) {
        // Remove protocol since we only use this to setup the OCAPI proxy
        const url = new URL(context.answers.project.commerce.instanceUrl)
        context.answers.project.commerce.instanceUrl = url.hostname
    }

    // Inject the packageJSON into the context for extensible projects.
    if (context.answers.project.extend) {
        const pkgJSON = JSON.parse(
            sh.exec(`npm view ${selectedTemplate.source.name}@${templateVersion} --json`, {
                silent: true
            }).stdout
        )

        // NOTE: Here we are rewriting a specific script (extract-default-translations) in order
        // to update the script location for extensibility. In the future we'll hopefully
        // move translations outside of the template and into the sdk where the script for
        // building translations will ultimately live, meaning we won't have to do this. So
        // its OK for now.
        if (pkgJSON?.scripts['extract-default-translations']) {
            pkgJSON.scripts['extract-default-translations'] = pkgJSON.scripts[
                'extract-default-translations'
            ].replace('./', `./node_modules/${selectedTemplate.source.name}/`)
        }
        if (pkgJSON?.scripts['compile-translations']) {
            pkgJSON.scripts['compile-translations'] = pkgJSON.scripts[
                'compile-translations'
            ].replace('./', `./node_modules/${selectedTemplate.source.name}/`)
        }
        if (pkgJSON?.scripts['compile-translations:pseudo']) {
            pkgJSON.scripts['compile-translations:pseudo'] = pkgJSON.scripts[
                'compile-translations:pseudo'
            ].replace('./', `./node_modules/${selectedTemplate.source.name}/`)
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
    program.description(`Generates a new PWA Kit project.

Example Usage:
   ${EXAMPLES.map(
       (example) => `
// ${example.description}\n${example.command}`
   ).join('\n')}
   `)

    OPTIONS.forEach((option) => {
        if (option.name === '--preset') {
            program.option(
                option.name,
                `The name of a project preset to use (choices: ${PUBLIC_PRESET_NAMES.map(
                    (x) => `"${x}"`
                ).join(', ')})`
            )
        } else {
            program.option(option.name, option.description, option.defaultValue)
        }
    })

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
