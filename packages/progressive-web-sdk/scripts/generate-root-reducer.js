/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */
/* eslint-disable import/no-commonjs */

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

const common = require('./common')
const fileUtils = require('./file-utils')
const consoleOutput = require('./console-output')

const TEMPLATE_FILENAMES = [
    'reducers.template.js', // version 0
    'reducers.template.js', // version 1
    'reducers-2.template.js', // version 2 (new data architecture)
    'reducers-2.template.js' // version 3 (same as version 2)
]

const packageConfig = JSON.parse(fs.readFileSync('./package.json', 'utf8')).config || {}
const generatorVersion = packageConfig.sdk_generator_version || 0
const templateFile = TEMPLATE_FILENAMES[generatorVersion]

const filterReducers = fileUtils.filterFiles((dir) =>
    common.container(path.join(dir, 'reducer.js'))
)

const containersFromDirs = (dirs) =>
    dirs.map((directory) => {
        return {
            directory,
            identifier: common.dashed2Camel(directory)
        }
    })

const getContainers = () => {
    return fs
        .readdirAsync(common.APP_CONTAINER_DIR)
        .then(fileUtils.filterDirectories(common.container))
        .then(filterReducers)
        .then(containersFromDirs)
}

const generateRootReducer = () => {
    return Promise.resolve()
        .then(common.step('Finding container directories', getContainers))
        .then(
            common.step('Generating root reducer program text\n', (containers) =>
                common.transformFile(
                    templateFile,
                    {
                        containers,
                        custom: fileUtils.existsSync(common.container('custom-reducers.js'))
                    },
                    common.container('reducers.js')
                )
            )
        )
}

module.exports = generateRootReducer

// run the code if we're called from the command line
if (require.main === module) {
    generateRootReducer().then(() => consoleOutput.greenWrite('Finished successfully\n'))
}
