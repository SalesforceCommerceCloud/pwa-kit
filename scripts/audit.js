#!/usr/bin/env node
/* eslint-env node */

/**
 * This script is a work-around for various issues we have using npm audit
 * with a Lerna monorepo that contains packages that have not yet been published
 * to NPM. Remember that packages need to be published to be auditable - audit
 * is a service provided by NPM, not just a local CLI tool.
 */
const util = require('util')
const shell = require('shelljs')
const childProc = require('child_process')
const os = require('os')
const fs = require('fs')
const path = require('path')
const rootPkg = require('../package.json')
const program = require('commander')

const copyFileAsync = util.promisify(fs.copyFile)
const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)
const unlinkAsync = util.promisify(fs.unlink)
const renameAsync = util.promisify(fs.rename)

const validSeverities = ['info', 'low', 'moderate', 'high', 'critical']

const spawnPromise = (cmd, args, opts) => {
    return new Promise((resolve) => {
        const proc = childProc.spawn(cmd, args, opts)
        let stdout = ''
        let stderr = ''
        proc.stdout.on('data', (data) => {
            stdout += data
        })
        proc.stderr.on('data', (data) => {
            stderr += data
        })
        proc.on('exit', () => {
            const result = [proc, stdout, stderr]
            resolve(result)
        })
    })
}

/**
 * Make backups of all package.json files and update them to remove any local-only
 * dependencies.
 */
const prepare = (opts) => {
    let tmp, npm, packageInfos

    // Install the latest version of NPM in a temp directory and use that to run the
    // audit. We do all other testing with NPM 5.7.1, which is our minimum supported
    // version, but doesn't support auditing.
    return (
        Promise.resolve()
            .then(() => fs.mkdtempSync(path.resolve(os.tmpdir(), 'audit-')))
            .then((result) => {
                tmp = result
            })
            .then(() => spawnPromise('npm', ['install', 'npm@latest'], {cwd: tmp}))
            .then(() => {
                npm = path.join(tmp, 'node_modules', '.bin', 'npm')
            })

            // Find all packages to audit
            .then(() =>
                spawnPromise('npm', ['run', '--silent', 'lerna', '--', 'list', '--all', '--json'])
            )
            .then((result) => {
                const stdout = result[1]
                packageInfos = JSON.parse(stdout)
                    .map(({name, location}) => ({
                        name,
                        location
                    }))
                    .concat([
                        // Add the root which Lerna doesn't consider a "package"
                        {
                            name: rootPkg.name || '__root__',
                            location: path.resolve()
                        }
                    ])
                    .map(({name, location}) => ({
                        name,
                        location,
                        pkgFile: path.join(location, 'package.json'),
                        pkgBackupFile: path.join(location, 'package.json.backup')
                    }))
            })
            // Make backups
            .then(() =>
                Promise.all(packageInfos.map(({pkgFile, pkgBackupFile}) =>
                    copyFileAsync(pkgFile, pkgBackupFile)
                ))
            )

            // Replace dependencies in package.json files...
            .then(() => {
                return Promise.all(packageInfos.map(({pkgFile}) => {
                    return readFileAsync(pkgFile).then((res) => {
                        const pkg = JSON.parse(res)
                        packageInfos.forEach(({name}) => {
                            if ((pkg.dependencies || {}).hasOwnProperty(name)) {
                                delete pkg.dependencies[name]
                            }
                            if ((pkg.devDependencies || {}).hasOwnProperty(name)) {
                                delete pkg.devDependencies[name]
                            }
                        })
                        return writeFileAsync(pkgFile, JSON.stringify(pkg, null, 2))
                    })
                }))
            })
            .then(() => ({tmp, npm, packageInfos, opts}))
    )
}

/**
 * Run 'npm audit' in all packages and fail if the number of vulnerabilities
 * passes the thresholds set for each severity level in the command-line arguments.
 */
const audit = ({opts, npm, packageInfos}) => {
    return Promise.resolve().then(() => {
        return Promise.all(
            packageInfos.map(({location, name}) => {
                return spawnPromise(npm, ['--prefix', location, 'audit', '--json']).then(
                    ([process, stdout]) => {
                        return {
                            name,
                            location,
                            exitCode: process.exitCode,
                            report: JSON.parse(stdout)
                        }
                    }
                )
            }),
        ).then((results) => {
            const totals = results
                .map((result) => {
                    return result.report.metadata && result.report.metadata.vulnerabilities
                })
                .filter((x) => Boolean(x))
                .reduce((acc, next) => {
                    Object.keys(next).forEach(
                        (severity) => (acc[severity] = acc[severity] + next[severity])
                    )
                    return acc
                })
            Object.keys(totals).forEach((severity) => {
                console.log(severity, totals[severity])
            })

            const keyMap = {
                info: 'maxInfo',
                low: 'maxLow',
                moderate: 'maxModerate',
                high: 'maxHigh',
                critical: 'maxCritical'
            }

            const fail = Object.entries(keyMap).some(([severity, severityMax]) => {
                return totals[severity] > opts[severityMax]
            })
            return fail ? 1 : 0
        })
    })
}

/**
 * Use 'npm audit --fix' to automatically fix audit failures in all packages.
 */
const fix = ({npm, packageInfos}) => {
    return Promise.resolve().then(() => {
        return Promise.all(
            packageInfos.map(({location, name}) => {
                return spawnPromise(npm, ['--prefix', location, 'audit', 'fix']).then((result) => {
                    const [process, ...outputText] = result
                    console.log(`Audit fix result for ${name}:`, outputText.join('\n'))
                    console.log('===============')
                    return {
                        exitCode: process.exitCode,
                        stderr: process.stderr
                    }
                })
            })
        ).then((results) => {
            const fail = results.some((result) => result.exitCode !== 0)
            return fail ? 1 : 0
        })
    })
}

/**
 * Clean up temp dirs and restore package.json backups
 */
const cleanup = ({packageInfos, tmp}) => {
    return Promise.all(packageInfos.map(({pkgFile, pkgBackupFile}) => {
        shell.rm('-rf', tmp)
        return unlinkAsync(pkgFile).then(() => renameAsync(pkgBackupFile, pkgFile))
    }))
}

const main = (opts) => {
    let args
    let exitCode = 0
    const action = opts.fix ? fix : audit
    return Promise.resolve()
        .then(() => prepare(opts))
        .then((_args) => {
            args = _args
        })
        .then(() => action(args))
        .then((_exitCode) => {
            exitCode = _exitCode
        })
        .finally(() => cleanup(args))
        .catch((err) => {
            exitCode = 1
            console.error(err)
        })
        .then(() => process.exit(exitCode))
}

program.description(
    `Run "npm audit" on all packages in the monorepo and exit with a nonzero status if the count of vulnerabilities exceeds the given limits.`
)

validSeverities.forEach((severity) => {
    program.option(
        `--max-${severity} <count>`,
        `Max number of ${severity}-severity vulnerabilities allowed before failing`,
        (x) => parseInt(x),
        100000
    )
})

program.option('--fix', 'run npm audit --fix on each package')

program.parse(process.argv)

main(program)
