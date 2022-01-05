#!/usr/bin/env node
/* eslint-env node */

const p = require('path')
const sh = require('shelljs')

sh.set('-e')

const monorepoRoot = p.resolve(__dirname, '..')

let server

const defaultOpts = {
    cwd: monorepoRoot,
    fatal: true,
    silent: true,
}

const startServer = async () => {
    const server = sh.exec('verdaccio --config verdaccio.yaml', {...defaultOpts, async: true})
    await new Promise((resolve) => {
        server.stdout.on('data', (data) => {
            if (data.includes('http address')) {
                // Verdaccio is running
                resolve()
            }
        })
    })
    return server
}

const main = async () => {
    try {
        console.log('Starting up local NPM repository')
        server = await startServer()
        sh.exec('npm run lerna -- publish from-package --yes --concurrency 1 --loglevel warn --registry http://localhost:4873/', defaultOpts)
        console.log('Local NPM repository is ready')
        console.log('Serving on http://localhost:4873/')
    } catch (e) {
        cleanup()
    }
}

const cleanup = () => {
    if (server) {
        server.kill()
        server = undefined
    }
    sh.rm('-rf', p.join(monorepoRoot, 'verdaccio-storage'))
}

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM'].forEach((signal) => {
    process.on(signal, cleanup);
})

main()