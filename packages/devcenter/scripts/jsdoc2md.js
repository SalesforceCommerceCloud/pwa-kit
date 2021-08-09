#!/usr/bin/env node
/* eslint-env node */

const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs')
const path = require('path')
const commander = require('commander')
const sh = require('shelljs')
const startCase = require('lodash.startcase')
const helpers = require('./jsdoc2md/helpers/helpers')
const devCenterRoot = path.join(__dirname, '..')
const outputDir = path.join(devCenterRoot, 'content', 'apis-and-sdks')

sh.set('-e')
jsdoc2md.clear()

const ci = path.join(__dirname, '..', '..', 'commerce-integrations')
const pwaSDK = path.join(__dirname, '..', '..', 'progressive-web-sdk')

const packages = [
    {
        pkgName: path.join('@mobify', 'commerce-integrations'),
        files: [path.join(ci, 'src', '**', '*.js')]
    },
    {
        pkgName: 'progressive-web-sdk',
        files: [
            path.join(pwaSDK, 'src', 'analytics-integrations', '**', '*.js'),
            path.join(pwaSDK, 'src', 'utils', '*.js')
        ]
    }
]

const main = () => {
    // Clean existing files in commerce-integrations and progressive-web-sdk

    packages.forEach(({pkgName}) => {
        const dirName = path.join(outputDir, pkgName.replace('@mobify/', ''))
        sh.find(dirName).filter(function(file) {
            if (file.match(/\.mdx$/)) {
                if (
                    !file.includes('overview.mdx') &&
                    !file.includes('index.mdx') &&
                    !file.includes('events.mdx') &&
                    !file.includes('legacy-analytics-manager.mdx')
                ) {
                    sh.rm('-rf', file)
                }
            }
        })
    })

    packages.forEach(async ({pkgName, files}) => {
        // This is something like an AST, parsed by JSDoc
        const data = await jsdoc2md.getTemplateData({
            files,
            'no-cache': true,
            configure: 'conf.json' // jsdoc default pattern will ignore folder starting with _, this configure will override that
        })

        // Find all the module names
        const modules = data
            .filter((identifier) => identifier.kind === 'module' && identifier.access !== 'private')
            .map((identifier) => ({
                moduleName: identifier.name,
                moduleDescription: identifier.decription
            }))

        // Create a markdown file for each module
        modules.forEach(({moduleName, moduleDescription}) => {
            if (!moduleName.startsWith(pkgName)) {
                console.error(
                    `Skipping file: module "${moduleName}" was found inside package "${pkgName}", but it has a broken name. You need to fix the @module tag in the JSDOC for the module.`
                )
                return
            }

            const title = startCase(moduleName.split('/').slice(-1))

            const template = [
                `---`,
                `title: '${title}'`,
                `metaTitle: '${title}'`,
                `metaDescription: '${moduleDescription || ''}'`,
                `collection: 'apis-and-sdks'`,
                `isJsdocPage: true`,
                `---`,
                `<JSDocWrapper>`,
                `{{#module name="${moduleName}"}}{{>docs}}{{/module}}`,
                `</JSDocWrapper>`
            ].join('\n')

            const output = jsdoc2md.renderSync({
                data: data,
                partial: [
                    'scripts/jsdoc2md/theme/link.hbs',
                    'scripts/jsdoc2md/theme/docs.hbs',
                    'scripts/jsdoc2md/theme/body.hbs',
                    'scripts/jsdoc2md/theme/header.hbs',
                    'scripts/jsdoc2md/theme/returns.hbs',
                    'scripts/jsdoc2md/theme/implements.hbs',
                    'scripts/jsdoc2md/theme/see.hbs',
                    'scripts/jsdoc2md/theme/params-table.hbs',
                    'scripts/jsdoc2md/theme/properties-table.hbs',
                    'scripts/jsdoc2md/theme/sig-name.hbs',
                    'scripts/jsdoc2md/theme/see.hbs',
                    'scripts/jsdoc2md/theme/throws.hbs',
                    'scripts/jsdoc2md/theme/defaultvalue.hbs'
                ],
                template: template,
                helper: ['scripts/jsdoc2md/helpers/helpers.js']
            })

            const cleaned = helpers.cleanModuleName(moduleName)

            const segments = cleaned.split('/') // Module names always use "/", regardless of platform
            segments[segments.length - 1] = `${segments[segments.length - 1]}.mdx`

            const fileName = path.resolve(outputDir, ...segments)
            const dirName = path.dirname(fileName)

            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, {recursive: true})
            }
            fs.writeFileSync(fileName, output)
        })
    })
}

main(commander)
