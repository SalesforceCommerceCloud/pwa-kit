#!/usr/bin/env node

/* eslint import/no-commonjs:0 no-useless-escape:0*/

/**
 * This is a generator for the Mobify platform.
 *
 * The output of this script is a copy of this repository with the following changes:
 *
 * 1) We delete any packages that Mobify wants to maintain as libraries with the
 *    expectation that the end-user will install these from NPM.
 *
 * 2) We rename and assign new version numbers to "templated" packages such as the
 *    PWA, based on a project slug.
 *
 * 3) We fix all references to renamed packages in the output project.
 *
 */
const fs = require('fs')
const os = require('os')
const fsExtra = require('fs-extra')
const path = require('path')
const program = require('commander')
const inquirer = require('inquirer')
const url = require('url')
const deepmerge = require('deepmerge')
const spawnSync = require('cross-spawn').sync

const mkdir = fsExtra.mkdirpSync
const rm = fsExtra.removeSync
const cp = fsExtra.copySync
const mv = fsExtra.moveSync
const readJson = fsExtra.readJsonSync
const writeJson = fsExtra.writeJsonSync
const resolve = path.resolve

const jscodeshift = resolve(path.dirname(__dirname), 'node_modules', '.bin', 'jscodeshift')
const transform = require.resolve('../src/rename-packages-in-imports')

// Version number for generated packages
const OUTPUT_PACKAGES_VERSION = '0.0.1'
const MONOREPO_ROOT = path.resolve(path.dirname(path.dirname(path.dirname(__dirname))))
const GENERATOR_VERSION = readJson(resolve(path.dirname(__dirname), 'package.json')).version
const lernaBin = resolve(MONOREPO_ROOT, 'node_modules', '.bin', 'lerna')

const assetsDir = resolve(path.dirname(__dirname), 'assets')

const TEST_PROJECT = 'test-project'
const TEST_PROJECT_BUNDLED = 'test-project-bundled'
const TRAINING_PROJECT = 'training-project'
const PRODUCTION = 'production'

const presets = [TEST_PROJECT, TEST_PROJECT_BUNDLED, TRAINING_PROJECT, PRODUCTION]
const presetValidatorRegex = new RegExp(`^(${presets.join('|')})$`)

const defaultOutputDir = path.join(process.cwd(), 'generated-project')

// Generator Supported Connectors
const DEFAULT_CONNECTOR = 'scraping'
const SUPPORTED_CONNECTORS = {
    scraping: 'Web Scraping',
    hybris: 'Hybris',
    sfcc: 'Salesforce',
    demo: 'Demo'
}

const testProjectAnswers = {
    'scaffold-pwa': {
        siteName: 'project-blah',
        siteUrl: 'https://www.example.com/',
        projectSlug: 'project-blah',
        aJSSlug: 'project-blah',
        mobifyGAID: 'UA-123456-1',
        mobify: {
            ssrParameters: {
                proxyConfigs: [
                    {
                        protocol: 'https',
                        host: 'www.example.com'
                    }
                ]
            }
        },
        name: 'project-blah-web',
        version: '0.0.1'
    },
    'scaffold-connector': {
        name: 'project-blah-connector',
        version: '0.0.1'
    },
    globals: {
        theme_color: '#ffffff'
    }
}

const trainingProjectAnswers = {
    'scaffold-pwa': {
        siteName: 'Training Project',
        siteUrl: 'https://www.merlinspotions.com/',
        projectSlug: 'training-project',
        aJSSlug: 'training-project',
        mobifyGAID: '123',
        mobify: {
            ssrParameters: {
                proxyConfigs: [
                    {
                        protocol: 'https',
                        host: 'www.merlinspotions.com',
                        path: 'base'
                    }
                ]
            }
        },
        name: 'training-project',
        version: '0.0.1'
    },
    'scaffold-connector': {
        name: 'training-project-connector',
        version: '0.0.1'
    },
    globals: {
        theme_color: '#ffffff'
    }
}

/**
 * Rewrite imports for all renamed packages.
 */
const rewriteImportsInPlace = (answers, packagesDir) => {
    const packageRenames = {}
    Object.keys(answers)
        .filter((k) => k !== 'globals')
        .forEach((k) => {
            packageRenames[k] = answers[k].name
        })
    const proc = spawn(
        jscodeshift,
        [
            '--transform',
            transform,
            '--renames',
            JSON.stringify(packageRenames),
            '--ignore-pattern',
            'pwa/scripts/generator/assets/*',
            '--ignore-pattern',
            'progressive-web-sdk/generator-assets/*',
            '.'
        ],
        {stdio: 'pipe', env: {...process.env, FORCE_COLOR: 0}, cwd: packagesDir}
    )

    if (proc.error) {
        console.log('Child Process exited with errors')
        throw proc.error
    }

    const output = proc.stdout.toString()

    // Jscodeshift exits with status 0, even on an error. Parse output and throw.
    if (!output.match(/Results:\s*0 errors/)) {
        console.error(output)
        throw 'JScodeshift reported errors, see output'
    }
}

const spawn = (cmd, args, opts = {}) => {
    const defaults = {stdio: 'inherit'}
    opts = Object.assign({}, defaults, opts)
    console.log([cmd, ...args].join(' '))
    const proc = spawnSync(cmd, args, opts)
    if (proc.status !== 0) {
        throw new Error(proc.stderr)
    } else {
        return proc
    }
}

const replaceJSON = (path, replacements) => {
    writeJson(path, Object.assign(readJson(path), replacements), {spaces: 2})
}

const getConnectorType = (answers) => (answers.globals || {}).connectorType || DEFAULT_CONNECTOR

const updateScaffoldPWAInPlace = (packagePath, pkgJSON, answers) => {
    console.log('Updating generated PWA in-place')
    const manifest = resolve(packagePath, 'app', 'static', 'manifest.json')
    replaceJSON(manifest, {
        name: pkgJSON.siteName,
        short_name: pkgJSON.siteName,
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

    cp(
        resolve(assetsDir, 'pwa', `${getConnectorType(answers)}-connector.tmpl`),
        resolve(packagePath, 'app', 'connector.js'),
        {
            overwrite: true
        }
    )
}

const updateScaffoldConnectorInPlace = (packagePath, pkgJSON, answers) => {
    console.log('Updating generated Connector in-place')

    cp(
        resolve(assetsDir, 'connector', `${getConnectorType(answers)}-index.tmpl`),
        resolve(packagePath, 'src', 'index.js'),
        {
            overwrite: true
        }
    )
}

const getPWADependencies = () => {
    const proc = spawn(
        lernaBin,
        ['ls', '--scope', 'scaffold-pwa', '--include-filtered-dependencies', '--json', '--all'],
        {cwd: MONOREPO_ROOT, stdio: 'pipe'}
    )
    return JSON.parse(proc.stdout.toString().trim()).map((dependency) => dependency.name)
}

/**
 * When we generate a project we delete local versions of packages and get users
 * to install them from NPM instead. However, Lerna doesn't produce working entries
 * for local packages. To make generated projects work with `npm ci`, we need to
 * update entries in lock files for all local packages that we want end users
 * to install from npm.
 */
const updateLockFilesInPlace = (pkgPath, pkg, localPackageNames) => {
    const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'

    const lockPath = path.join(pkgPath, 'package-lock.json')
    const contents = readJson(lockPath)
    localPackageNames.forEach((name) => {
        if (contents.dependencies.hasOwnProperty(name)) {
            console.log(`Deleting ${name} from ${lockPath}`)
            delete contents.dependencies[name]
        }
    })
    writeJson(lockPath, contents, {spaces: 2})

    // Find the monorepo-local packages this package depends on and update
    // their entries in the lock file.
    const fields = ['dependencies', 'devDependencies']
    fields.forEach((field) => {
        const fieldValue = pkg[field] || {}
        const localDependencies = Object.entries(fieldValue)
            .filter(([name]) => localPackageNames.indexOf(name) >= 0)
            .map(([name, version]) => [name, version].join('@'))

        if (localDependencies.length) {
            spawn(npmCmd, ['install', '--package-lock-only', ...localDependencies], {
                env: process.env,
                cwd: pkgPath,
                stdio: 'inherit'
            })
        }
    })
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
const merge = (a, b) => {
    const overwriteArrays = (orignal, replacement) => replacement
    return deepmerge(a, b, {arrayMerge: overwriteArrays})
}

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
 *
 */
const runGenerator = (answers, {outputDir, preset}) => {
    const isTestProject = [TEST_PROJECT, TEST_PROJECT_BUNDLED].indexOf(preset) >= 0
    const shouldBundleDependencies = [TEST_PROJECT_BUNDLED].indexOf(preset) >= 0
    const checkForReleaseBranch = !isTestProject
    const bundledDependencies = shouldBundleDependencies ? getPWADependencies() : []

    const tmp = fs.mkdtempSync(path.resolve(os.tmpdir(), 'generator-'))
    const dest = path.resolve(tmp, 'project')

    const branchName = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: MONOREPO_ROOT,
        stdio: 'pipe'
    })
        .stdout.toString()
        .trim()

    const isReleaseBranch = branchName === 'master' || branchName.startsWith('release-')
    if (checkForReleaseBranch && !isReleaseBranch) {
        console.log(
            'The generator can only be run on `master` or a `release-*` branch. ' +
                'Please switch branches and run again.'
        )
        process.exit(1)
    }

    rm(dest)
    mkdir(dest)

    spawn('git', ['clone', MONOREPO_ROOT, dest])
    spawn('git', ['checkout', branchName], {cwd: dest})

    rm(resolve(dest, '.git'))
    rm(resolve(dest, '.circleci'))
    mv(resolve(dest, 'README_PUBLIC.md'), resolve(dest, 'README.md'), {overwrite: true})

    replaceJSON(resolve(dest, 'lerna.json'), {version: OUTPUT_PACKAGES_VERSION})
    replaceJSON(resolve(dest, 'package.json'), {generatorVersion: GENERATOR_VERSION})

    const packagesDir = path.join(dest, 'packages')

    const localPackages = fs
        .readdirSync(packagesDir)
        .map((dir) => resolve(packagesDir, dir))
        .map((pkgPath) => {
            const pkgJsonPath = resolve(pkgPath, 'package.json')
            if (fs.existsSync(pkgJsonPath)) {
                return {
                    pkgPath,
                    pkgJsonPath,
                    pkg: readJson(pkgJsonPath)
                }
            } else {
                return null
            }
        })
        .filter((entry) => entry !== null)

    const localPackageNames = localPackages.map(({pkg}) => pkg.name)

    localPackages.forEach(({pkgPath, pkgJsonPath, pkg}) => {
        if (!(pkg.name in answers)) {
            if (bundledDependencies.indexOf(pkg.name) < 0) {
                console.log(`Removing non-whitelisted package ${pkg.name}`)
                rm(pkgPath)
            }
        } else {
            const replacements = answers[pkg.name]
            console.log(`Updating package.json for (${pkg.name} -> ${replacements.name})`)

            // Rewrite dependencies and package.json for renamed packages
            Object.keys(answers).forEach((original) => {
                if (original in pkg.dependencies) {
                    const replacement = answers[original]
                    delete pkg.dependencies[original]
                    pkg.dependencies[replacement.name] = replacement.version
                }
            })
            const finalPkgData = merge(pkg, replacements)
            writeJson(pkgJsonPath, finalPkgData, {spaces: 2})

            // For each generated package, do some renames as standard.
            mv(resolve(pkgPath, 'README_PUBLIC.md'), resolve(pkgPath, 'README.md'), {
                overwrite: true
            })

            if (!isTestProject) {
                console.log(`Updating lock file for ${pkg.name} to use npm-installed dependencies`)
                updateLockFilesInPlace(pkgPath, finalPkgData, localPackageNames)
            }

            // Then run package-specific in-place updaters.
            switch (pkg.name) {
                case 'scaffold-pwa':
                    updateScaffoldPWAInPlace(pkgPath, finalPkgData, answers)
                    break

                case 'scaffold-connector':
                    updateScaffoldConnectorInPlace(pkgPath, finalPkgData, answers)
                    break

                default:
                    throw new Error(`No update method found for ${pkg.name}`)
            }
        }
    })

    // Since we rename packages when generating, we also need to fix any
    // corresponding import statements in JS code.
    rewriteImportsInPlace(answers, packagesDir)

    outputDir = outputDir || dest
    if (outputDir !== dest) {
        // It's only safe to overwrite if users are generating to the default
        // directory at ./generated-project. Don't try to overwrite sensitive
        // dirs like '/'!
        const overwrite = outputDir === defaultOutputDir
        mv(dest, outputDir, {overwrite})
    }
    console.log(`Project successfully generated at ${outputDir}`)
    return outputDir
}

const prompts = () => {
    const projectName = (x) => x.globals.projectName
    const hostFromURL = (x) => url.parse(x).host
    const protocolFromURL = (x) => url.parse(x).protocol.slice(0, -1)
    const slug = (x) => Boolean(/^[a-z0-9_-]+$/.exec(x)) || 'Value must be a slug'
    const validHex = (s) => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(s)
    const validUrl = (s) => Boolean(url.parse(s).protocol) || 'Value must be a URL'

    const questions = [
        // Globals
        {
            name: 'globals.projectName',
            validate: slug,
            message: '[Global] Project name, must be a slug, eg. "new-project-name"'
        },
        {
            name: `globals.connectorType`,
            default: 'CommerceConnector',
            message: '[Connector] Connector Type',
            type: 'list',
            choices: Object.entries(SUPPORTED_CONNECTORS)
                .map(([v, k]) => ({
                    name: `${k} ${v === DEFAULT_CONNECTOR ? '(default)' : ''}`,
                    value: v
                }))
                .sort(({name}) => -1 * name.indexOf(`(default)`))
        },
        {
            name: 'globals.theme_color',
            default: '#000',
            message: 'Theme color for Project:',
            validate: validHex
        },

        // Web
        {
            name: 'scaffold-pwa.siteName',
            default: projectName,
            message: '[PWA] Human-readable site name, eg. "Bob\'s Burgers"'
        },
        {
            name: 'scaffold-pwa.mobifyGAID',
            default: '',
            message: '[PWA] Mobify internal Google Analytics ID (mobifyGAID)'
        },
        {
            name: 'scaffold-pwa.siteUrl',
            default: 'https://www.example.com/',
            message: '[PWA] Site URL',
            validate: validUrl
        },
        {
            name: 'scaffold-pwa.projectSlug',
            default: projectName,
            message: '[PWA] Project Slug'
        },
        {
            name: 'scaffold-pwa.aJSSlug',
            default: projectName,
            message: '[PWA] AJS Slug'
        },
        {
            name: 'scaffold-pwa.mobify.ssrParameters.proxyConfigs[0].protocol',
            message: '[PWA] Protocol for the customers Ecommerce backend (eg. http/https)',
            default: (answers) => protocolFromURL(answers['scaffold-pwa'].siteUrl)
        },
        {
            name: 'scaffold-pwa.mobify.ssrParameters.proxyConfigs[0].host',
            message: "[PWA] Host for the customer's ecommerce backend (eg. www.example.com)",
            default: (answers) => hostFromURL(answers['scaffold-pwa'].siteUrl)
        }
    ]
    return inquirer.prompt(questions).then((answers) => {
        const fixed = {
            'scaffold-pwa': {
                name: `${answers.globals.projectName}`,
                version: OUTPUT_PACKAGES_VERSION
            },
            'scaffold-connector': {
                name: `${answers.globals.projectName}-connector`,
                version: OUTPUT_PACKAGES_VERSION
            }
        }

        return merge(answers, fixed)
    })
}

const main = (opts) => {
    if (!(opts.outputDir === defaultOutputDir) && fs.existsSync(opts.outputDir)) {
        console.error(
            `The output directory "${opts.outputDir}" already exists. Try, eg. ` +
                `"~/Desktop/my-project" instead of "~/Desktop"`
        )
        process.exit(1)
    }

    switch (opts.preset) {
        case TEST_PROJECT:
        case TEST_PROJECT_BUNDLED:
            return runGenerator(testProjectAnswers, opts)
        case PRODUCTION:
            return prompts().then((answers) => runGenerator(answers, opts))
        case TRAINING_PROJECT:
            return runGenerator(trainingProjectAnswers, opts)
        default:
            console.error(`Invalid preset name ${opts.preset}`)
            process.exit(1)
    }
}

if (require.main === module) {
    program.description(`Generate a new Mobify project using one of these presets:

    1. "${PRODUCTION}" (the default) - generate a production-quality project that
       installs Mobify package dependencies from NPM, prompting for configuration
       values on the CLI.

       You can only run this on master or on a release-* branch, to ensure Mobify
       dependencies have been released to NPM.

    2. "${TEST_PROJECT}" - a test project that is similar to the "${PRODUCTION}" preset,
       but uses hard-coded config values and skips the master/release-branch check.

       The generated project is not functional - you can't run "npm install" on it
       because its dependencies haven't been deployed to NPM. We use it internally
       to test the generator itself.

    3. "${TEST_PROJECT_BUNDLED}" - a test project that is similar to the "${TEST_PROJECT}"
       preset, but bundles Mobify package dependencies in the generated project.

       This is NOT what we want to ship to customers, but it allows us to generate
       working projects during development. We use these to ensure that generated
       projects work properly, as opposed to the generator itself.

       The generated project is "npm installable".

    4. "${TRAINING_PROJECT}" - same as ${PRODUCTION}, but with hard-coded config
       values that are used for Mobify training projects.

    `)
    program.option(
        '--outputDir <path>',
        `Path to the output directory for the new project (default: "${defaultOutputDir}")`,
        defaultOutputDir
    )
    program.option(
        '--preset <presetName>',
        `Use a named project preset. You should use "${PRODUCTION}" for real projects, which will prompt for config values (default: "${PRODUCTION}")`,
        presetValidatorRegex,
        PRODUCTION
    )

    program.parse(process.argv)
    main(program)
}

exports.main = main
exports.runGenerator = runGenerator
exports.testProjectAnswers = testProjectAnswers
