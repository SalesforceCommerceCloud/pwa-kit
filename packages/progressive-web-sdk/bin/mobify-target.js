/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const targetAPI = require('../scripts/target-api.js')
const tty = require('tty')
const mobifyUtils = require('./mobify-utils.js')
const utils = require('../scripts/utils.js')
const RETRY_LIMIT_ON_TIMEOUT = 1
/**
 * Print the progress message. If the stdout is a TTY, it will keep updating the same line. If the stdout is not a TTY,
 * it will print the process to different lines.
 * @param {String} message - The progress message.
 */
const printProgress = (message) => {
    if (tty.isatty(1)) {
        process.stdout.clearLine()
        process.stdout.cursorTo(0)
        process.stdout.write(message)
    } else {
        console.log(message)
    }
}

/**
 * Keeps polling the target info API until the deploy finishes or fails.
 * @param {Object} requestOptions - The request options.
 * @param {Number} interval - The interval between each poll in ms.
 */
const pollTargetInfoUntilDone = (requestOptions, interval) => {
    let retryCount = 0
    const run = () => {
        return targetAPI
            .getTargetInfo(requestOptions)
            .then((result) => {
                retryCount = 0
                switch (result.current_deploy.status) {
                    case 'finished':
                        console.log()
                        console.log(result.current_deploy.status_message)
                        console.log(`Duration: ${result.current_deploy.deploy_duration}s`)
                        break
                    case 'failed':
                        console.log(`\n${result.current_deploy.deploy_type} Failed.`)
                        break
                    case 'in_progress':
                        printProgress(
                            `${result.current_deploy.deploy_type} in progress: ${result.current_deploy.status_message} duration: ${result.current_deploy.deploy_duration}s`
                        ) // eslint-disable-line max-len
                        setTimeout(run, interval)
                        break
                    case 'queued':
                        console.log(result.current_deploy.status_message)
                        setTimeout(run, interval)
                        break
                    default:
                        console.log(result)
                }
            })
            .catch((error) => {
                if (error.message === 'Error: ETIMEDOUT') {
                    if (retryCount === RETRY_LIMIT_ON_TIMEOUT) {
                        utils.fail('Retry limit on timeout exceeded.')
                    } else {
                        console.log('Request timed out. Retrying ...')
                        retryCount++
                        setTimeout(run, interval)
                    }
                } else {
                    utils.fail(error.message)
                }
            })
    }
    run()
}

/**
 * Filter the target object and only keep the useful info.
 * @param {Object} target - A raw target object returned from API.
 */
const filterTargetInfo = (target) => ({
    slug: target.slug,
    name: target.name,
    ssr_external_hostname: target.ssr_external_hostname,
    ssr_external_domain: target.ssr_external_domain,
    ssr_region: target.ssr_region,
    current_deploy: {
        status: target.current_deploy.status,
        updated_at: target.current_deploy.updated_at,
        deploy_duration: target.current_deploy.deploy_duration,
        user_email: target.current_deploy.user_email,
        bundle: {
            id: target.current_deploy.bundle.id,
            message: target.current_deploy.bundle.message,
            created_at: target.current_deploy.bundle.created_at,
            is_ssr_bundle: target.current_deploy.bundle.is_ssr_bundle,
            user_email: target.current_deploy.bundle.user_email,
            go_preview_url: target.current_deploy.bundle.go_preview_url,
            preview_url: target.current_deploy.bundle.preview_url
        }
    }
})

/**
 *  Print the target info in a more readable format.
 * @param {Object} target - A filtered target object.
 */
const printHumanReadableTargetInfo = (target) => {
    console.log('************************ Target Info ************************')
    console.log(`${'slug'.padEnd(30)}${target.slug}`)
    console.log(`${'name'.padEnd(30)}${target.name}`)
    console.log('# Only FOR SSR DEPLOYMENT #')
    console.log(`${'ssr_external_hostname'.padEnd(30)}${target.ssr_external_hostname}`)
    console.log(`${'ssr_external_domain'.padEnd(30)}${target.ssr_external_domain}`)
    console.log(`${'ssr_region'.padEnd(30)}${target.ssr_region}`)
    console.log('****************** Current Deployment Info ******************')
    console.log(`${'status'.padEnd(30)}${target.current_deploy.status}`)
    console.log(`${'updated_at'.padEnd(30)}${target.current_deploy.updated_at}`)
    console.log(`${'deploy_duration'.padEnd(30)}${target.current_deploy.deploy_duration}`)
    console.log(`${'user_email'.padEnd(30)}${target.current_deploy.user_email}`)
    console.log('************************ Bundle Info ************************')
    console.log(`${'id'.padEnd(30)}${target.current_deploy.bundle.id}`)
    console.log(`${'message'.padEnd(30)}${target.current_deploy.bundle.message}`)
    console.log(`${'created_at'.padEnd(30)}${target.current_deploy.bundle.created_at}`)
    console.log(`${'is_ssr_bundle'.padEnd(30)}${target.current_deploy.bundle.is_ssr_bundle}`)
    console.log(`${'user_email'.padEnd(30)}${target.current_deploy.bundle.user_email}`)
    console.log('# ONLY FOR TAG-LOADED DEPLOYMENT #')
    console.log(`${'go_preview_url'.padEnd(30)}${target.current_deploy.bundle.go_preview_url}`)
    console.log(`${'preview_url'.padEnd(30)}${target.current_deploy.bundle.preview_url}`)
}
/**
 * "mobify target info" command handler.
 * @param {Object} argv - The command line argv.
 */
const subcommandTargetInfoHandler = (argv) => {
    const options = mobifyUtils.constructOptionsFromCommandArgv(argv)
    if (options.target.length === 0) {
        console.log('You need to provide at least one target name.')
        return
    }
    targetAPI
        .getTargetList(options)
        .then((response) => {
            const targetsFound = response.results
                .filter((target) => options.target.indexOf(target.slug) !== -1)
                .map((element) => filterTargetInfo(element))
            const targetsNotFound = []
            options.target.forEach((targetSlug) => {
                if (!targetsFound.some((target) => target.slug === targetSlug)) {
                    targetsNotFound.push(targetSlug)
                }
            })
            if (options.json) {
                console.log(targetsFound)
                return
            }
            targetsFound.forEach((element) => {
                printHumanReadableTargetInfo(element)
                console.log(
                    '----------------------------------------------------------------------------------------------------'
                )
            })
            if (targetsNotFound.length !== 0) {
                console.log(`\ntargets not found: ${targetsNotFound}`)
            }
        })
        .catch((error) => utils.fail(error.message))
}

/**
 * Build the "mobify target info" command.
 * @param {yargs} subYargs - Yargs instance.
 */
const subcommandTargetInfoBuilder = (subYargs) =>
    subYargs
        .usage('Usage: npm run mobify -- target info -t <value> [options]')
        .option(mobifyUtils.POTENTIAL_OPTIONS.target, {
            alias: 'target',
            describe: 'One or more custom target slugs.'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.projectDirectory, {
            alias: 'projectDirectory',
            describe:
                'The directory where your project is located. The default is the current directory',
            string: true,
            type: 'string'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.projectSlug, {
            alias: 'projectSlug',
            describe:
                "A project slug that differs from the name property in your project's package.json. default: the 'name' key from the package.json", // eslint-disable-line max-len
            string: true,
            type: 'string'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.json, {
            alias: 'json',
            describe: 'Output the result as raw JSON',
            type: 'boolean'
        })
        .array(mobifyUtils.POTENTIAL_OPTIONS.target)
        .demandOption(
            mobifyUtils.POTENTIAL_OPTIONS.target,
            'Please provide at least one target name.'
        )
        .example(
            'npm run mobify -- target info -t production',
            "# Get the info of target 'production' of your project."
        )
        .strict()

/**
 * The handler function of the "mobify target Status" command.
 * @param {Object} argv  - The argv of the command.
 */
const subcommandTargetStatusHandler = (argv) => {
    const options = mobifyUtils.constructOptionsFromCommandArgv(argv)
    if (argv.polling === false) {
        targetAPI
            .getTargetInfo(options)
            .then((response) => {
                if (options.json) {
                    console.log({
                        status: response.current_deploy.status,
                        status_message: response.current_deploy.status_message,
                        deploy_duration: response.current_deploy.deploy_duration
                    })
                } else {
                    console.log('Current Deployment Status')
                    console.log(`${'status:'.padEnd(25)}${response.current_deploy.status}`)
                    console.log(
                        `${'status_message:'.padEnd(25)}${response.current_deploy.status_message}`
                    )
                    console.log(
                        `${'deploy_duration:'.padEnd(25)}${
                            response.current_deploy.deploy_duration
                        } s`
                    )
                }
            })
            .catch((error) => utils.fail(error.message))
    } else {
        console.log(
            `Tracking deployment status of target ${options.target} in project ${options.projectSlug} ...`
        )
        // Poll the api every 2s until it is finished or failed.
        pollTargetInfoUntilDone(options, 2000)
    }
}

/**
 * Build the "mobify target status" command.
 * @param {yargs} subYargs - Yargs instance.
 */
const subcommandTargetStatusBuilder = (subYargs) =>
    subYargs
        .usage('Usage: npm run mobify -- target status -t <value> [options]')
        .option(mobifyUtils.POTENTIAL_OPTIONS.target, {
            alias: 'target',
            describe: 'The target slug (NOT target name).',
            string: true,
            type: 'string'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.projectDirectory, {
            alias: 'projectDirectory',
            describe:
                'The directory where your project is located. The default is the current directory',
            string: true,
            type: 'string'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.projectSlug, {
            alias: 'projectSlug',
            describe:
                "A project slug that differs from the name property in your project's package.json. default: the 'name' key from the package.json", // eslint-disable-line max-len
            string: true,
            type: 'string'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.polling, {
            alias: 'polling',
            describe:
                'Decide whether to just show the current status or keep polling the api until finished or failed. Default is false', // eslint-disable-line max-len
            type: 'boolean'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.json, {
            alias: 'json',
            describe: "Output the result as raw JSON. Only works if 'polling' is false.",
            type: 'boolean'
        })
        .demandOption(mobifyUtils.POTENTIAL_OPTIONS.target, 'Please provide the target slug.')
        .example(
            'npm run mobify -- target status -t production -p',
            "# Keep polling the deployment status of target 'production' of your project."
        ) // eslint-disable-line max-len
        .strict()

/**
 * Build the "mobify target list" command.
 * @param {yargs} subYargs - Yargs instance.
 */
const subcommandTargetListBuilder = (subYargs) =>
    subYargs
        .usage('Usage: npm run mobify -- target list [options]')
        .option(mobifyUtils.POTENTIAL_OPTIONS.projectDirectory, {
            alias: 'projectDirectory',
            describe:
                'The directory where your project is located. The default is the current directory',
            string: true,
            type: 'string'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.projectSlug, {
            alias: 'projectSlug',
            describe:
                "A project slug that differs from the name property in your project's package.json. default: the 'name' key from the package.json", // eslint-disable-line max-len
            string: true,
            type: 'string'
        })
        .option(mobifyUtils.POTENTIAL_OPTIONS.json, {
            alias: 'json',
            describe: 'Output the result as raw JSON',
            type: 'boolean'
        })
        .example('npm run mobify -- target list', '# Get the list of targets of your project.')
        .strict()

/**
 * The handler function of the "mobify target list" command.
 * @param {Object} argv  - The argv of the command.
 */
const subcommandTargetListHandler = (argv) => {
    const options = mobifyUtils.constructOptionsFromCommandArgv(argv)
    targetAPI
        .getTargetList(options)
        .then((response) => {
            response.results.sort((a, b) => {
                if (a.slug.toLowerCase() > b.slug.toLowerCase()) {
                    return 1
                } else if (a.slug.toLowerCase() < b.slug.toLowerCase()) {
                    return -1
                }
                return 0
            })
            if (options.json) {
                console.log(
                    response.results.map((target) => ({slug: target.slug, name: target.name}))
                )
                return
            }
            console.log(`Number of targets: ${response.results.length}`)
            console.log(
                '----------------------------------------------------------------------------------------------------'
            )
            console.log(`${'TARGET SLUG'.padEnd(40)}  TARGET NAME`)
            console.log(
                '----------------------------------------------------------------------------------------------------'
            )
            response.results.forEach((target) => {
                console.log(`${target.slug.padEnd(40)}  ${target.name}`)
            })
        })
        .catch((error) => utils.fail(error.message))
}

/**
 * Build the "mobify target" command.
 * @param {yargs} subYargs - Yargs instance.
 */
const subcommandTargetBuilder = (subYargs) =>
    subYargs
        .usage('Usage: npm run mobify -- target <subcommand> [options]')
        .command(
            'info',
            'Get the detailed info of one or more targets',
            subcommandTargetInfoBuilder,
            subcommandTargetInfoHandler
        )
        .command(
            'status',
            'Get the deployment status of a target',
            subcommandTargetStatusBuilder,
            subcommandTargetStatusHandler
        )
        .command(
            ['list', 'ls'],
            'Get the target list of a project',
            subcommandTargetListBuilder,
            subcommandTargetListHandler
        )
        .demandCommand(1, 'You need at least one command before moving on')
        .strict()

module.exports = subcommandTargetBuilder
