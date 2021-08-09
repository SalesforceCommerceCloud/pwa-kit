#!/usr/bin/env node

/* eslint import/no-commonjs:0 no-useless-escape:0*/

const fs = require('fs')
const rimraf = require('rimraf')
const path = require('path')
const childProcess = require('child_process')
const program = require('commander')
const utils = require('../src/utils')

// Do not hard-code - users must run this in their project directory.
const projectPkg = require(path.join(process.cwd(), 'package.json'))

/**
 * Get a parameter value, falling back to environment variables, package.json
 * or a default value.
 */
const getParam = (cmdValue, envKey, defaultVal) => {
    const values = [
        cmdValue,
        process.env[envKey],
        ((projectPkg.mobify || {}).testFrameworkConfig || {})[envKey],
        defaultVal
    ]
    return values.find((x) => x !== undefined)
}

const parseBoolean = (val) => {
    return val === true || val === 'true'
}

const runLighthouse = (
    urls,
    {
        maxTTI,
        minPWAScore,
        minSEOScore,
        minAccessibilityScore,
        checkConsoleErrors,
        mobifyPreview,
        device,
        outputDir
    }
) => {
    outputDir = outputDir || path.resolve(process.cwd(), 'tests', 'lighthouse-reports')
    const nodeModules = utils.findNodeModules(require.resolve('lighthouse'))
    const lighthouse = path.resolve(nodeModules, '.bin', 'lighthouse')
    if (fs.existsSync(outputDir)) {
        rimraf.sync(outputDir)
    }
    fs.mkdirSync(outputDir)

    const lighthouseConfig = path.resolve(path.dirname(__dirname), 'src', 'lighthouse-config.js')
    const sharedChromeFlags = '--headless --allow-insecure-localhost --ignore-certificate-errors'

    urls.forEach((url) => {
        // If in preview mode, append the preview fragment to the URL, and update Chrome
        // flags to ignore certificate errors, etc. Note that for preview mode we
        // _need_ the user-agent "MobifyPreview" or else the v8 tag and loader.js will not treat
        // it as a supported browser

        url = mobifyPreview
            ? `${url}#mobify-override\&mobify-path=true\&mobify-url=https://localhost:8443/loader.js\&mobify-global=true\&mobify-domain=\&mobify-all=true\&mobify=1\&mobify-debug=1&mobify-js=1`
            : url
        const opts = mobifyPreview
            ? `--disable-device-emulation=true --chrome-flags='--user-agent="MobileMobifyPreview" ${sharedChromeFlags}'`
            : `--chrome-flags='${sharedChromeFlags}'`
        const cmd = `${lighthouse} "${url}" --config-path ${lighthouseConfig} --emulated-form-factor ${device} --quiet --output json --output html ${opts}`
        console.log(cmd)
        childProcess.execSync(cmd, {cwd: outputDir, stdio: [0, 1, 2]})
    })

    const jsonFiles = fs
        .readdirSync(outputDir)
        .filter((fileName) => fileName.match(/\.json$/))
        .map((fileName) => path.resolve(outputDir, fileName))

    const results = []

    jsonFiles.forEach((fileName) => {
        const report = JSON.parse(fs.readFileSync(fileName))

        const pwaScore = 100 * report.categories.pwa.score
        const pwaScoreBelow = pwaScore < minPWAScore

        const seoScore = 100 * report.categories.seo.score
        const seoScoreBelow = seoScore < minSEOScore

        const accessibilityScore = 100 * report.categories.accessibility.score
        const accessibilityScoreBelow = accessibilityScore < minAccessibilityScore

        const tti = report.audits.interactive.rawValue
        const ttiOver = tti > maxTTI

        const url = report.requestedUrl

        results.push({
            error: ttiOver,
            msg: `[${url}] Time to first interactive of ${tti} was ${
                ttiOver ? 'above' : 'below'
            } the maximum (${maxTTI})`
        })
        results.push({
            error: pwaScoreBelow,
            msg: `[${url}] Lighthouse PWA score of ${pwaScore} was ${
                pwaScoreBelow ? 'below' : 'above or equal to'
            } the minimum (${minPWAScore})`
        })
        results.push({
            error: seoScoreBelow,
            msg: `[${url}] Lighthouse SEO score of ${seoScore} was ${
                seoScoreBelow ? 'below' : 'above or equal to'
            } the minimum (${minSEOScore})`
        })
        results.push({
            error: accessibilityScoreBelow,
            msg: `[${url}] Lighthouse accessibility score of ${accessibilityScore} was ${
                accessibilityScoreBelow ? 'below' : 'above or equal to'
            } the minimum (${minAccessibilityScore})`
        })

        if (checkConsoleErrors) {
            const errorsInConsole = report.audits['errors-in-console'].rawValue
            const errorsLoggedInConsole = errorsInConsole != 0
            results.push({
                error: errorsLoggedInConsole,
                msg: `[${url}] ${errorsInConsole} browser error(s) logged to the console`
            })
        }
    })

    const hasErrors = results.filter((result) => result.error).length > 0

    results.forEach((result) => {
        console.log(`${result.error ? 'FAIL:' : 'PASS:'} ${result.msg}`)
    })
    console.log(`Reports located in ${outputDir}`)
    process.exit(hasErrors ? 1 : 0)
}

const runNightwatch = (nightwatchOpts, {config}) => {
    config = config || path.resolve(path.dirname(__dirname), 'src', 'nightwatch-config.js')
    nightwatchOpts = nightwatchOpts || ''
    const nodeModules = utils.findNodeModules(require.resolve('nightwatch'))
    const nightwatch = path.resolve(nodeModules, '.bin', 'nightwatch')
    const cmd = `${nightwatch} --config ${config} ${nightwatchOpts}`
    console.log(cmd)
    childProcess.execSync(cmd, {stdio: [0, 1, 2]})
}

program
    .command('lighthouse <urls...>')
    .description(
        `Runs lighthouse tests on a list of URLs.
    eg. mobify-test-framework.js lighthouse https://www.merlinspotions.com/
    
    Parameters can be set in several locations and they take precedence as follows:
     
     command-line args -> environment variables -> "mobify.testFrameworkConfig" 
     section of package.json
    `
    )
    .option(
        '--maxTTI [milliseconds]',
        'Maximum time to interactive before reporting a failure (default: 10000 ms)'
    )
    .option(
        '--minPWAScore [percentage]',
        'Minimum PWA score before reporting a failure (default: 90)'
    )
    .option(
        '--minSEOScore [percentage]',
        'Minimum SEO score before reporting a failure (default: 100)'
    )
    .option(
        '--minAccessibilityScore [percentage]',
        'Minimum accessibility score before reporting a failure (default: 100)'
    )
    .option(
        '--checkConsoleErrors',
        'Assert that browser errors are not logged to the console (default: false)'
    )
    .option('--mobifyPreview', 'Run tests using Mobify preview (default: false)')
    .option('--device', "Form factor for tests (choices: 'mobile', 'desktop') (default: 'mobile')")
    .option('--outputDir', `Output directory for reports (default: 'tests/lighthouse-reports')`)
    .action((args, opts) => {
        opts.maxTTI = parseFloat(getParam(opts.maxTTI, 'max_tti', '10000'))
        opts.minPWAScore = parseFloat(getParam(opts.minPWAScore, 'min_pwa_score', '90'))
        opts.minSEOScore = parseFloat(getParam(opts.minSEOScore, 'min_seo_score', '100'))
        opts.minAccessibilityScore = parseFloat(
            getParam(opts.minAccessibilityScore, 'min_accessibility_score', '100')
        )
        opts.checkConsoleErrors = parseBoolean(
            getParam(opts.checkConsoleErrors, 'check_console_errors', 'false')
        )
        opts.device = getParam(opts.device, 'device', 'mobile')
        return runLighthouse(args, opts)
    })

program
    .command('nightwatch')
    .description(
        `Runs nightwatch end-to-end tests, using Mobify's recommended settings.
    Use '--' to pass extra args directly to nightwatch, eg. mobify-test-framework.js nightwatch -- "--verbose --env chrome_incognito"

    Environment variables:
        NIGHTWATCH_SAUCE_USERNAME      Saucelabs username
        NIGHTWATCH_SAUCE_ACCESS_KEY    Saucelabs password
        NIGHTWATCH_SRC_FOLDERS         Space-separated list of folders containing tests (default ['./tests/e2e'])
        NIGHTWATCH_OUTPUT_FOLDER       Output folder for test reports (default './tests/reports')
        NIGHTWATCH_SCREENSHOTS_PATH    Output folder for test screenshots (default './tests/screenshots')`
    )
    .option('--config [file]', `Path to a nightwatch config (default: Mobify's recommended config)`)
    .action(runNightwatch)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.help()
}
