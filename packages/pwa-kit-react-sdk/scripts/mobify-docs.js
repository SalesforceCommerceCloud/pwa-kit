/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const path = require('path')
const spawnSync = require('cross-spawn').sync

const dir = path.relative(process.cwd(), path.resolve('docs', 'public', 'latest'))
const command = process.argv[2]
const args = process.argv.slice(3)

const run = (cmd, args) => spawnSync(cmd, args, {stdio: 'inherit'})

switch (command) {
    case 'preview':
        process.exit(run('mobify-docs', [command, dir].concat(args)).status)
        break
    case 'compile':
        process.exit(run('mobify-docs', [command, dir].concat(args)).status)
        break
    case 'deploy':
        process.exit(run('mobify-docs', [command, dir].concat(args)).status)
        break
    default:
        console.error(`Invalid command: ${command}`)
        process.exit(1)
}
