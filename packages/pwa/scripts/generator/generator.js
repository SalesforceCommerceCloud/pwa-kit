#!/usr/bin/env node

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */
/* eslint-disable import/no-commonjs */
const Promise = require('bluebird')
const path = require('path')
const fs = Promise.promisifyAll(require('fs'))
const _ = require('lodash')
const program = require('commander')
const common = require('progressive-web-sdk/scripts/common')

const buildContext = (ctx) => {
    ctx.name = _.lowerFirst(ctx.Name)
    ctx.dirname = _.kebabCase(ctx.name)
    ctx.NAME = _.snakeCase(ctx.Name).toUpperCase()
    ctx.actionsName = `${ctx.name}Actions`
    ctx.getSelectorName = `get${ctx.Name}`
    ctx.COMPONENT_NAMESPACE = 'c'
    return ctx
}

const askQuestions = () =>
    common.getUserInput([
        {
            name: 'Name',
            description: 'Enter the (PascalCase) name of the container you want to add',
            type: 'string',
            pattern: common.PASCAL_CASE_REGEX,
            message:
                'The name must begin with a upper-case letter, and only contain letters and numbers.' // eslint-disable-line max-len
        }
    ])

const processFile = (inFileAbsolute, outFileAbsolute, ctx) =>
    fs
        .readFileAsync(inFileAbsolute)
        .then((templateStr) =>
            _.template(templateStr, {
                variable: 'context',
                interpolate: /<%=([\s\S]+?)%>/g // This makes lodash ignore ES6 templates
            })(ctx)
        )
        .then((contents) => fs.writeFileAsync(outFileAbsolute, contents, 'utf8'))

const main = ({inputDir, outputDir}) =>
    askQuestions()
        .then(buildContext)
        .then((ctx) => {
            outputDir = path.resolve(outputDir, ctx.dirname)

            return Promise.resolve()
                .then(fs.mkdirAsync(outputDir))
                .then(() => fs.readdirAsync(inputDir))
                .then((files) =>
                    files.map((f) => [path.resolve(inputDir, f), path.resolve(outputDir, f)])
                )
                .then((files) =>
                    Promise.all(files.map(([src, dest]) => processFile(src, dest, ctx)))
                )
                .then(() => console.log(`New component written to ${outputDir}`))
        })

if (require.main === module) {
    program.description(`Generate a new component from a template`)
    program.option(
        '--inputDir [path]',
        'Absolute path to the template directory for the new component'
    )
    program.option(
        '--outputDir [path]',
        'Absolute path to the output directory for the new component'
    )
    program.parse(process.argv)
    main(program)
}

module.exports = {buildContext, askQuestions, processFile, main}
