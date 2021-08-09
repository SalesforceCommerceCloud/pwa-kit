/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */
/* eslint-disable import/no-commonjs */

const Promise = require('bluebird')
const _ = require('lodash')

const path = require('path')
const prompt = Promise.promisifyAll(require('prompt'))

const packageJson = require('../package.json')
const fileUtils = require('./file-utils')
const consoleOutput = require('./console-output')

const ASSET_DIR = path.resolve(__dirname, '..', 'generator-assets')
const asset = _.partial(path.join, ASSET_DIR)

const IN_SDK = process.env.npm_package_name === packageJson.name

// DIFFERENCES BETWEEN SDK AND PROJECT (not testable)
const COMPONENT_NAMESPACE = IN_SDK ? 'pw' : /* istanbul ignore next */ 'c'
const OUTER_DIR = IN_SDK ? 'src' : /* istanbul ignore next */ 'app'

// OUTPUT DIRECTORIES
const APP_CONTAINER_DIR = path.join(OUTER_DIR, 'containers')
const APP_COMPONENT_DIR = path.join(OUTER_DIR, 'components')
const container = _.partial(path.join, APP_CONTAINER_DIR)
const component = _.partial(path.join, APP_COMPONENT_DIR)

// IDENTIFIER CASE CONVERTERS
const PASCAL_CASE_REGEX = /^[A-Z][A-Za-z0-9]+$/
const canonicalizeName = (name) =>
    name.replace(/([A-Z])([A-Z]+)([A-Z]|$)/g, (_, s1, s2, s3) => `${s1}${s2.toLowerCase()}${s3}`)

const camel2Pascal = _.upperFirst
const camel2Dashed = _.kebabCase
const dashed2Camel = _.camelCase
const pascal2Camel = _.lowerFirst
const pascal2Dashed = _.kebabCase

// COLOURED OUTPUT AND ERRORS
// Things that exit aren't testable
/* istanbul ignore next */
const errorOut = (message) => () => {
    consoleOutput.redWrite(message)
    process.exit()
}

// GENERATION FLOW
const getUserInput = (schema) => {
    prompt.start()
    return prompt.getAsync(schema).catch(errorOut('\nOperation cancelled\n'))
}

const buildContext = (pathTransform) => (context) => {
    context.Name = canonicalizeName(context.Name)
    context.name = pascal2Camel(context.Name)
    context.actionsName = `${context.name}Actions`
    context.getSelectorName = `get${context.Name}`
    context.dirname = camel2Dashed(context.name)
    context.path = pathTransform(context.dirname)
    context.IN_SDK = IN_SDK
    context.COMPONENT_NAMESPACE = COMPONENT_NAMESPACE
    return context
}

const findTemplateFilenames = (templateDir) => (context) => [
    context,
    fileUtils.readdirAsync(asset(templateDir))
]

const processTemplate = (context) => (templateString) =>
    _.template(templateString, {
        variable: 'context',
        interpolate: /<%=([\s\S]+?)%>/g // This makes lodash ignore ES6 templates
    })(context)

const transformFile = (inpath, context, outpath, suppress) => {
    return fileUtils
        .readFile(asset(inpath))
        .then(processTemplate(context))
        .then(fileUtils.writeToPath(outpath))
        .tap(() => !suppress && console.log(`Wrote ${outpath}`))
}

const appendToFile = (filePath, text) => {
    return fileUtils
        .readFile(filePath)
        .then((existingFile) => {
            return `${existingFile}${text}`
        })
        .then(fileUtils.writeToPath(filePath))
}

const outputName = (filename, context) =>
    path.join(context.path, filename.replace('example', context.dirname))

const fileTransformer = (context, inDir) => (filename) => {
    return transformFile(path.join(inDir, filename), context, outputName(filename, context))
}

// UTILITIES
const clearNulls = (items) => items.filter((item) => item !== null)

const step = (message, operation) => (value) => {
    return Promise.resolve(value)
        .tap(() => consoleOutput.plainWrite(message))
        .then(operation)
        .tap(consoleOutput.printCheckMark)
}

module.exports = {
    ASSET_DIR,
    APP_CONTAINER_DIR,
    APP_COMPONENT_DIR,
    container,
    component,
    asset,

    PASCAL_CASE_REGEX,
    canonicalizeName,
    camel2Pascal,
    camel2Dashed,
    dashed2Camel,
    pascal2Camel,
    pascal2Dashed,

    errorOut,

    appendToFile,
    getUserInput,
    buildContext,
    findTemplateFilenames,
    processTemplate,
    transformFile,
    outputName,
    fileTransformer,

    clearNulls,
    step
}
