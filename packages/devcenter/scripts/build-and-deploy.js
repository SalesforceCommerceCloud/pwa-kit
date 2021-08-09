#!/usr/bin/env node
/* eslint-env node */
const path = require('path')
const commander = require('commander')
const sh = require('shelljs')
const semver = require('semver')
const pkg = require('../package.json')

sh.set('-e')

const masterBranches = ['master', 'v2-master']

const isMaster = (() => {
    let branch
    return () => {
        if (branch === undefined) {
            branch = sh.exec('git rev-parse --abbrev-ref HEAD', {fatal: true, silent: true}).trim()
        }
        return masterBranches.indexOf(branch) >= 0
    }
})()

const getBucketName = () => {
    return isMaster() ? 'mobify-devcenter-120963225130' : 'mobify-devcenter-766791126171'
}

const getSiteURL = () => {
    return isMaster() ? 'https://dev.mobify.com/' : 'https://dev.mobify-staging.com/'
}

const checkDependencies = () => {
    const dependencies = [
        [sh.which('git'), 'This script requires git'],
        [sh.which('aws'), 'This script requires the aws-cli, see https://aws.amazon.com/cli/']
    ]

    dependencies.forEach(([satisfied, msg]) => {
        if (!satisfied) {
            sh.echo(msg)
            sh.exit(1)
        }
    })
}

const main = (args) => {
    checkDependencies()

    const {bucket, onlyDeploy} = args
    const dir = path.resolve(args.dir)
    const prefix = `v${semver.major(pkg.version)}.x`
    const s3URL = `http://${bucket}.s3-website-us-east-1.amazonaws.com/${prefix}/`
    const siteURL = getSiteURL()
    const shouldBuild = !onlyDeploy

    // Gatsby needs to know at build time where the site will be hosted.
    sh.env['GATSBY_PATH_PREFIX'] = `/${prefix}/`
    sh.env['GATSBY_SITE_URL'] = siteURL
    sh.env['GATSBY_ACTIVE_ENV'] =
        bucket === 'mobify-devcenter-120963225130' || isMaster() ? 'production' : 'staging'

    if (shouldBuild) {
        sh.exec(`npm run build`, {fatal: true})
    }

    sh.exec(`aws s3 sync --acl public-read --delete ${dir} s3://${bucket}/${prefix}/`, {
        fatal: true
    })

    sh.echo('')
    sh.echo(`Deployed successfully to:`)
    sh.echo(`  - ${s3URL}`)
    sh.echo(`  - ${siteURL}`)
}

commander.description('Deploy docs to a bucket on S3')
commander.option(
    '-d, --dir <name>',
    'the directory to upload to S3',
    path.join(__dirname, '..', 'public')
)
commander.option('-b, --bucket <name>', 'the S3 bucket name', getBucketName())
commander.option(
    '-o, --only-deploy',
    `only deploy, don't build (be sure you've built already)`,
    false
)
commander.parse(process.argv)
main(commander)
