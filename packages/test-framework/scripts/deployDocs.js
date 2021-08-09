#!/usr/bin/env node
/* eslint import/no-commonjs:0 no-useless-escape:0*/
const process = require('process')
const childProcess = require('child_process')
const pkg = require('../package.json')

const envs = ['testing', 'staging', 'production']
const env = process.argv[2]

if (envs.indexOf(env) < 0) {
    console.log(`Unsupported env '${env}'`)
    process.exit(1)
} else {
    childProcess.execSync(
        `node ./node_modules/.bin/mobify-docs deploy docs/public/latest -p mobify-test-framework -v ${pkg.version} --env ${env}`,
        {stdio: [0, 1, 2]}
    )
}
