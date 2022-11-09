/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const Utils = require('./utils')

const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const os = require('os')
const rimraf = require('rimraf')
const pkg = require('../package.json')

jest.mock('git-rev-sync')
const git = require('git-rev-sync')

jest.mock('request')
const request = require('request')

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

describe('readPackageJson', () => {
    const data = {name: 'test'}
    let mockReadJsonSync
    beforeAll(() => {
        mockReadJsonSync = jest.spyOn(fse, 'readJsonSync').mockImplementation(() => data)
    })

    afterAll(() => {
        mockReadJsonSync.mockRestore()
    })

    test('returns key value', () => {
        const keyName = 'name'
        const packageJson = path.join(process.cwd(), 'package.json')
        expect(Utils.readPackageJson(keyName)).toBe(data[keyName])
        expect(fse.readJsonSync).toBeCalledWith(packageJson)
    })

    test('fails if key is missing', () => {
        const keyName = 'fake'
        expect(Utils.readPackageJson(keyName)).toBeUndefined()
        expect(fse.readJsonSync).toBeCalled()
        expect(Utils.fail).toBeCalled()

        const errorMessage = Utils.fail.mock.calls[0][0]
        expect(errorMessage.includes(`key '${keyName}' is missing`)).toBeTruthy()
    })
})

describe('createToken', () => {
    let args = {
        project: 'pwa-kit',
        environment: 'dev',
        cloudOrigin: 'https://cloud-test.mobify.com',
        apiKey: 'key'
    }

    test('makes request and returns token', async () => {
        const data = {token: 'abcd'}
        request.mockClear()
        request.mockImplementationOnce((_, callback) => {
            callback(null, {}, JSON.stringify(data))
        })

        const mockGetHeaders = jest.fn((headers) => headers)
        Utils.getRequestHeaders = mockGetHeaders

        expect(await Utils.createToken(...Object.values(args))).toBe(data.token)
        expect(request).toBeCalled()
        expect(mockGetHeaders).toBeCalled()

        const options = request.mock.calls[0][0]
        expect(options.url).toBe(
            `${args.cloudOrigin}/api/projects/${args.project}/target/${args.environment}/jwt/`
        )
        expect(options.method).toBe('POST')
        expect(options.headers).toStrictEqual({
            Accept: 'application/json',
            Authorization: `Bearer ${args.apiKey}`
        })
    })

    test('fails after unsuccessful request', async () => {
        const error = {statusCode: 403}
        request.mockClear()
        request.mockImplementationOnce((_, callback) => {
            callback(null, error, {})
        })

        expect(await Utils.createToken(...Object.values(args))).toBeUndefined()
        expect(request).toBeCalled()
        expect(Utils.fail).toBeCalled()

        const errorMessage = Utils.fail.mock.calls[0][0]
        expect(
            errorMessage.includes(`${args.cloudOrigin} returned HTTP ${error.statusCode}`)
        ).toBeTruthy()
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

        expect(Utils.setDefaultMessage()).toBe('PWA Kit Bundle')
    })

    test('Bundle message defaults properly if git short fails', () => {
        git.short.mockImplementationOnce(() => {
            throw new Error('Failwhale')
        })

        expect(Utils.setDefaultMessage()).toBe('PWA Kit Bundle')
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
                            projectSlug: 'retail-react-app',
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

test('parseLog parses application and platform logs correctly', () => {
    const requestId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    const shortRequestId = requestId.slice(0, 8)
    const cases = [
        {
            log: `START RequestId: ${requestId} Version: $LATEST`,
            expected: {
                level: 'START',
                message: `RequestId: ${requestId} Version: $LATEST`,
                shortRequestId
            }
        },
        {
            log: `END RequestId: ${requestId}`,
            expected: {
                level: 'END',
                message: `RequestId: ${requestId}`,
                shortRequestId
            }
        },
        {
            log: `REPORT RequestId: ${requestId}\tDuration: 21.04 ms\tBilled Duration: 22 ms\tMemory Size: 2496 MB\tMax Memory Used: 94 MB`,
            expected: {
                level: 'REPORT',
                message: `RequestId: ${requestId}\tDuration: 21.04 ms\tBilled Duration: 22 ms\tMemory Size: 2496 MB\tMax Memory Used: 94 MB`,
                shortRequestId
            }
        },
        {
            log: `2022-10-31T22:00:00.000Z\t${requestId}\tINFO\tRequest: GET /`,
            expected: {
                level: 'INFO',
                message: 'Request: GET /',
                shortRequestId
            }
        },
        {
            log: `2022-10-31T22:00:00.000Z\t${requestId}\tERROR\tResponse status: 500\tuh oh!`,
            expected: {
                level: 'ERROR',
                message: 'Response status: 500\tuh oh!',
                shortRequestId
            }
        },
        {
            log: `2022-10-31T22:00:00.000Z\t${requestId}\tINFO\t`,
            expected: {
                level: 'INFO',
                message: '',
                shortRequestId
            }
        }
    ]
    cases.forEach(({log, expected}) => {
        const parsed = Utils.parseLog(log)
        Object.keys(parsed).forEach((key) => {
            expect(parsed[key]).toBe(expected[key])
        })
    })
})
