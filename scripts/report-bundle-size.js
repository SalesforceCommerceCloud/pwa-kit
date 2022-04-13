#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs')
const path = require('path')
const childProc = require('child_process')

/**
 * Send bundle size stats to Datadog
 */
const main = () => {
    const buildDir = path.resolve('packages', 'template-retail-react-app', 'build')
    fs.readdir(buildDir, (err, files) => {
        if (err) {
            console.error(err)
            process.exit(1)
        } else {
            files
                .filter(file => file.includes('-analyzer-stats.json'))
                .forEach(file => {
                    console.log(`Analyzer stats json file found:`, file)
                    const retailReactAppStats = require(path.join(buildDir, file))
                    const bundles = retailReactAppStats.assets
                    bundles.forEach((bundle) => {
                        const metric = `mobify_platform_sdks.bundle_size_byte`
                        const value = bundle.size
                        childProc.spawnSync('dog', ['metric', 'post', metric, value, '--host', bundle.name])
                        console.log(`${metric} ${value} --host ${bundle.name}`)
                    })
                })
        }
    })
}

main()
