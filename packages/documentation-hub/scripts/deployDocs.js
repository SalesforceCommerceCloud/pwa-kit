#!/usr/bin/env node
/* eslint import/no-commonjs:0 no-useless-escape:0*/
const process = require('process')
const childProcess = require('child_process')

const envs = ['testing', 'staging', 'production']
const env = process.argv[2]

if (envs.indexOf(env) < 0) {
    console.log(`Unsupported env '${env}'`)
    process.exit(1)
} else {
    childProcess.execSync(
        `node ./node_modules/.bin/mobify-docs deploy public -p docs-hub --no_version -e ${env}`,
        {stdio: [0, 1, 2]}
    )
}
