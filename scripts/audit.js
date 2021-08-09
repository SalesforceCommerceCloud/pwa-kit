#!/usr/bin/env node
/* eslint-env node */
const Promise = require('bluebird')
const shell = require('shelljs')
const childProc = require('child_process')
const os = require('os')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const rootPkg = require('../package.json')

const program = require('commander')

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

const spawnSync = (cmd, args, opts) => {
    const proc = childProc.spawnSync(cmd, args, opts)
    if (proc.status) {
        process.exit(proc.status)
    }
    return proc
}

const main = (opts) => {
    // Install the latest version of NPM in a temp directory and use that to run the
    // audit. We do all other testing with NPM 5.7.1, which is our minimum supported
    // version, but doesn't support auditing.
    const tmp = fs.mkdtempSync(path.resolve(os.tmpdir(), 'audit-'))
    spawnSync('npm', ['install', 'npm@latest'], { cwd: tmp })
    const npm = path.join(tmp, 'node_modules', '.bin', 'npm')

    // Find all packages to audit
    const listProc = spawnSync('npm', ['run', '--silent', 'lerna', '--', 'list', '--all', '--json'])
    const packageInfos = JSON.parse(listProc.stdout.toString())
        .map(({ name, location }) => ({
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
        .map(({ name, location }) => ({
            name,
            location,
            pkgFile: path.join(location, 'package.json'),
            pkgBackupFile: path.join(location, 'package.json.backup')
        }))

    // Make backups
    Promise.map(packageInfos, ({ pkgFile, pkgBackupFile }) => {
        return fs.copyFileAsync(pkgFile, pkgBackupFile)
    })
        // Replace dependencies in package.json files...
        .then(() => {
            return Promise.map(packageInfos, ({ pkgFile }) => {
                return fs.readFileAsync(pkgFile).then((res) => {
                    const pkg = JSON.parse(res)
                    packageInfos.forEach(({ name }) => {
                        if ((pkg.dependencies || {}).hasOwnProperty(name)) {
                            delete pkg.dependencies[name]
                        }
                        if ((pkg.devDependencies || {}).hasOwnProperty(name)) {
                            delete pkg.devDependencies[name]
                        }
                    })
                    return fs.writeFileAsync(pkgFile, JSON.stringify(pkg, null, 2))
                })
            })
        })

        // Run audits
        .then(() => {
            return Promise.map(
                packageInfos,
                (packageInfo) => {
                    const { location, name } = packageInfo
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
                },
                // Sequential is actually *faster*. We don't know why.
                { concurrency: 1 }
            ).then((results) => {
                const totals = results
                    .map((result) => {
                        return result.report.metadata && result.report.metadata.vulnerabilities
                    })
                    .filter(Boolean)
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
        .finally((exitCode) => {
            // Clean up temp dirs and restore backups
            return Promise.map(packageInfos, ({ pkgFile, pkgBackupFile }) => {
                shell.rm('-rf', tmp)
                return fs.unlinkAsync(pkgFile).then(() => fs.renameAsync(pkgBackupFile, pkgFile))
            }).then(() => exitCode)
        })
        .catch((err) => {
            const exitCode = 1
            console.log(err)
            return exitCode
        })
        .then((exitCode) => process.exit(exitCode))
}

program.description(
    `Run "npm audit" on all packages in the monorepo and exit with a nonzero status if the count of vulnerabilities exceeds the given limits.`
)

validSeverities.forEach((severity) => {
    program.option(
        `--max-${severity} <count>`,
        `Max number of ${severity}-severity vulnerabilities allowed before failing`,
        (x) => parseInt(x),
        1000000
    )
})

program.parse(process.argv)

main(program)
