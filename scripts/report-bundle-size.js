#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs')
const path = require('path')
const childProc = require('child_process')

/**
 * Send bundle size stats to Datadog
 */
const main = () => {
    const buildDir = path.join(path.resolve(''), 'packages', 'pwa', 'build')
    fs.readdir(buildDir, (err, files) => {
        if (err)
            console.log(err);
        else {
            files.forEach(file => {
                // bundle report stats files are name as `*-analyzer-stats.json`
                if (file.includes('-analyzer-stats.json')) {
                    console.log(`Analyzer stats json file found:`, file)
                    const pwaStats = require(path.join(path.resolve(''), 'packages', 'pwa', 'build', file))
                    const bundles = pwaStats.assets
                    bundles.forEach((bundle) => {
                        const metric = `mobify_platform_sdks.bundle_size_byte`
                        const value = bundle.size
                        childProc.spawnSync('dog', ['metric', 'post', metric, value, '--host', bundle.name])
                        console.log(`${metric} ${value} --host ${bundle.name}`)
                    })
                }
            })
        }
    })
}

main()
