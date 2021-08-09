/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */
/* eslint-disable import/no-commonjs */

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

const common = require('./common')
const generateRootReducer = require('./generate-root-reducer')
const consoleOutput = require('./console-output')

const SKELETON_DIRS = [
    'container-skeleton', // version 0 (maybe this will have pre-PR 438 stuff eventually)
    'container-skeleton', // version 1 (original data architecture)
    'template-skeleton', // version 2 (data architecture 2.0 w/ selectors)
    'template-initpage-skeleton' // version 3 (data architecture 2.0 w/ selectors with initPage action)
]

const USER_INPUT_SCHEMA = [
    {
        name: 'Name',
        description: 'Enter the (PascalCase) name of the container you want to add',
        type: 'string',
        pattern: common.PASCAL_CASE_REGEX,
        message:
            'The name must begin with a upper-case letter, and only contain letters and numbers.' // eslint-disable-line max-len
    }
]

const packageConfig = JSON.parse(fs.readFileSync('./package.json', 'utf8')).config || {}
const generatorVersion = packageConfig.sdk_generator_version || 0
const skeletonDir = SKELETON_DIRS[generatorVersion]

const makeContainerDir = (container) => {
    return fs
        .mkdirAsync(container.path)
        .catch(
            common.errorOut(`\nContainer ${container.Name} (${container.path}) already exists\n`)
        )
}

const updateTemplates = (container) => {
    const templatesFilePath = path.join(common.APP_CONTAINER_DIR, 'templates.js')
    const templateExport = `export const ${container.Name} = PWALoadable(() => import('./${container.dirname}/container' /* webpackChunkName: "${container.dirname}" */), '${container.dirname}')\n`
    return common.appendToFile(templatesFilePath, templateExport)
}

const addContainer = () => {
    common
        .getUserInput(USER_INPUT_SCHEMA)
        .then(common.buildContext(common.container))
        .tap((container) => {
            return common.step(
                `Creating container directory ${container.dirname}`,
                makeContainerDir
            )(container)
        })
        .tap((container) => {
            return common.step('Updating templates.js', updateTemplates)(container)
        })
        .then(common.step('Finding container template', common.findTemplateFilenames(skeletonDir)))
        .tap(() => console.log('Generating container:'))
        .spread((container, filenames) => {
            return Promise.map(filenames, common.fileTransformer(container, skeletonDir))
        })
        .then(consoleOutput.printCheckMark)
        .then(generateRootReducer)
        .then(() => {
            console.log(`Finished!`)
            console.log(`Next steps:`)
            console.log(
                `- Modify 'app/router.jsx' to import the newly generated page from './containers/templates' and use it in a <Route>.`
            )
            console.log(
                `- Import your container's .scss file in 'web/app/styles/_templates.scss' and start adding some styles.`
            )
        })
}

module.exports = addContainer

// run the code if we're called from the command line
if (require.main === module) {
    addContainer()
}
