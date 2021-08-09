/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */

'use strict'

// This script gets copied into the pwa directory before being executed,
// for historical reasons that we can't change.

const extractRoutes = require('progressive-web-sdk/dist/routing/extract-routes')
const packageJson = require('./package.json')
const path = require('path')
const fs = require('fs')

const main = (
    routerPath = path.join('.', 'app', 'router.jsx'),
    outputPath = path.join('app', 'loader-routes.js')
) => {
    const regexes = packageJson.config.controlsAllPaths
        ? [/.*/]
        : extractRoutes.extractRouteRegexesFromSource(fs.readFileSync(routerPath, 'utf8'))
    const output = [
        `/* eslint-disable */`,
        `// GENERATED FILE DO NOT EDIT`,
        `const routes = [${regexes}]`,
        `export default routes`
    ].join('\n')

    fs.writeFileSync(outputPath, output, 'utf8')
}

main()
