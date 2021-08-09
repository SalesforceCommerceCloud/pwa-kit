/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */
/* eslint-disable import/no-commonjs */

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))

const common = require('./common')
const fileUtils = require('./file-utils')
const consoleOutput = require('./console-output')

const USER_INPUT_SCHEMA = [
    {
        name: 'Name',
        description: 'Enter the (PascalCase) name of the form you want to add',
        type: 'string',
        pattern: common.PASCAL_CASE_REGEX,
        message:
            'The name must begin with a upper-case letter, and only contain letters and numbers.' // eslint-disable-line max-len
    }
]
const SKELETON_DIR = 'form-skeleton'

const makeComponentDir = (component) => {
    return fs
        .mkdirAsync(component.path)
        .catch(
            common.errorOut(`\nComponent ${component.Name} (${component.path}) already exists\n`)
        ) // eslint-disable-line max-len
}

const addComponent = () => {
    fileUtils
        .mkdirIfNonexistent(common.APP_COMPONENT_DIR)
        .then(() => common.getUserInput(USER_INPUT_SCHEMA))
        .then(common.buildContext(common.component))
        .tap(common.step('Creating component directory', makeComponentDir))
        .then(common.step('Finding component template', common.findTemplateFilenames(SKELETON_DIR)))
        .tap(() => console.log('Generating component:'))
        .spread((component, filenames) => {
            return Promise.map(filenames, common.fileTransformer(component, SKELETON_DIR))
        })
        .then(consoleOutput.printCheckMark)
        .then(() => console.log('Finished'))
}

module.exports = addComponent
