#!/usr/bin/env node
const process = require('process')
const deploy = require('@mobify/documentation-theme/scripts/deploy')

const envs = ['testing', 'staging', 'production']
const env = process.argv[2]

if (envs.indexOf(env) < 0) {
    console.log(`Unsupported env '${env}'`)
    process.exit(1)
} else {
    const project = 'progressive-web/latest/integrations/commerce-integrations/api'
    return Promise.resolve()
        .then(() => deploy('docs', project, env))
        .catch((error) => {
            console.error('Error during deployment:')
            console.error(error)
            process.exit(1)
        })
}
