/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const Utils = require('./utils')

const fs = require('fs')
const path = require('path')
const os = require('os')
const rimraf = require('rimraf')
const Promise = require('bluebird')
const pkg = require('../package.json')

jest.mock('git-rev-sync')
const git = require('git-rev-sync')

let realFail
beforeEach(() => {
    realFail = Utils.fail
    Utils.fail = jest.fn()
})

afterEach(() => {
    Utils.fail = realFail
})

test('getRequestHeaders sets the User-Agent header', () => {
    const result = Utils.getRequestHeaders()
    expect(result['User-Agent']).toBe(`progressive-web-sdk#${pkg.version}`)
})

test('getRequestHeaders copies over headers from the passed object', () => {
    const additionalHeaders = {
        Cryptography: 'none',
        Context: 'testing',
        Connections: 'mocked out'
    }

    const result = Utils.getRequestHeaders(additionalHeaders)

    Object.keys(additionalHeaders).forEach((key) => {
        expect(result[key]).toBe(additionalHeaders[key])
    })
})

test('errorForStatus returns false for 2xx and 3xx statuses', () => {
    ;[200, 201, 302, 303, 304].forEach((statusCode) => {
        expect(Utils.errorForStatus({statusCode})).toBe(false)
    })
})

test('errorForStatus returns an Error for 4xx and 5xx statuses', () => {
    ;[400, 401, 403, 404, 500, 503].forEach((statusCode) => {
        expect(Utils.errorForStatus({statusCode})).toBeInstanceOf(Error)
    })
})

describe('setDefaultMessage', () => {
    test('Bundle message is set to branch and commit hash', () => {
        git.branch.mockClear()
        git.short.mockClear()
        git.branch.mockReturnValueOnce('develop')
        git.short.mockReturnValueOnce('4cd54ec')

        expect(Utils.setDefaultMessage()).toBe('develop: 4cd54ec')
    })

    test('Bundle message defaults properly if git branch fails', () => {
        git.branch.mockImplementationOnce(() => {
            throw new Error('Failwhale')
        })

        expect(Utils.setDefaultMessage()).toBe('Mobify Bundle')
    })

    test('Bundle message defaults properly if git short fails', () => {
        git.short.mockImplementationOnce(() => {
            throw new Error('Failwhale')
        })

        expect(Utils.setDefaultMessage()).toBe('Mobify Bundle')
    })

    test('Test message is printed if we have an ENOENT', () => {
        git.branch.mockImplementationOnce(() => {
            throw {code: 'ENOENT'}
        })
        const consoleLog = console.log
        const mockConsoleLog = jest.fn()
        console.log = mockConsoleLog

        try {
            Utils.setDefaultMessage()
        } finally {
            console.log = consoleLog
        }

        expect(mockConsoleLog).toBeCalled()
        expect(mockConsoleLog.mock.calls[0][0].includes('git init')).toBe(true)
    })
})

describe('Create Bundle', () => {
    const cases = [
        {
            name: 'Should create a tar file from a bundle directory',
            files: [
                path.posix.join('directory-a', '1.js'),
                path.posix.join('directory-b', '2.js'),
                path.posix.join('directory-c', '3.js')
            ],
            expectedSSROnly: [
                path.posix.join('directory-a', '1.js'),
                path.posix.join('directory-b', '2.js'),
                path.posix.join('directory-c', '3.js')
            ],
            expectedSSRShared: [
                path.posix.join('directory-a', '1.js'),
                path.posix.join('directory-b', '2.js'),
                path.posix.join('directory-c', '3.js')
            ]
        },
        {
            name: 'Should properly handle directory names that look like file names',
            files: [
                path.posix.join('npm-library.js', '1.js'),
                path.posix.join('directory-b', '2.js'),
                path.posix.join('directory-c', '3.js')
            ],
            expectedSSROnly: [
                path.posix.join('npm-library.js', '1.js'),
                path.posix.join('directory-b', '2.js'),
                path.posix.join('directory-c', '3.js')
            ],
            expectedSSRShared: [
                path.posix.join('npm-library.js', '1.js'),
                path.posix.join('directory-b', '2.js'),
                path.posix.join('directory-c', '3.js')
            ]
        }
    ]

    cases.forEach(({name, files, expectedSSROnly, expectedSSRShared}) => {
        test(name, () => {
            const tmp = fs.mkdtempSync(path.resolve(os.tmpdir(), 'create-bundle-test-'))
            const bundlePath = path.join(tmp, 'bundle')
            fs.mkdirSync(bundlePath)

            const tarFilePath = path.join(tmp, 'bundle.tar')

            /* Generate all directories in the file path recursively if they don't exist */
            const generateDirectories = (filePath) => {
                const dirname = path.dirname(filePath)
                if (fs.existsSync(dirname)) {
                    return true
                }
                generateDirectories(dirname)
                fs.mkdirSync(dirname)
            }

            /* Generate directories and files */
            files.forEach((f) => {
                generateDirectories(path.join(bundlePath, f))
                fs.closeSync(fs.openSync(path.join(bundlePath, f), 'w'))
            })

            return Promise.resolve()
                .then(() =>
                    Utils.createBundle(
                        {
                            buildDirectory: bundlePath,
                            projectSlug: 'scaffold-pwa',
                            set_ssr_values: true,
                            ssr_only: ['**/*.js'],
                            ssr_shared: ['**/*.js']
                        },
                        tarFilePath
                    )
                )
                .then((result) => {
                    expect(fs.existsSync(tarFilePath))
                    expect(result.ssr_only.sort()).toEqual(expectedSSROnly.sort())
                    expect(result.ssr_shared.sort()).toEqual(expectedSSRShared.sort())
                })
                .finally(() => rimraf.sync(tmp))
        })
    })
})
