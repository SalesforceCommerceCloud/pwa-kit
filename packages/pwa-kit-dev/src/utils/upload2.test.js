/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// jest.mock('request')
// jest.mock('./utils')
//
// const Request = require('request')
// const Utils = require('./utils')
// const buildRequest = require('./build-request')
// const Utils = require('./utils')
// const fs = require('fs')
// const path = require('path')
// const os = require('os')
// const rimraf = require('rimraf')
//
// jest.mock('git-rev-sync')
// const git = require('git-rev-sync')
// jest.mock('./build-request')
// jest.mock('./utils')
// const Utils = require('./utils')
// const uploadBundle = require('./upload.js')

const pkg = require('../../package.json')
import * as upload2 from './upload2'
import assert from 'assert'






test('glob() with no patterns matches nothing', () => {
    const matcher = upload2.glob()
    expect(matcher('')).toBe(false)
    expect(matcher('a.js')).toBe(false)
    expect(matcher()).toBe(false)
})


describe('glob() filters correctly', () => {
    const patterns = ['ssr.js', '**/*.jpg', '!**/no.jpg', 'abc.{js,jsx}']

    const matcher = upload2.glob(patterns)

    // Paths we expect to match
    const expectToMatch = [
        'ssr.js',
        'test1.jpg',
        'static/test2.jpg',
        'static/assets/test3.jpg',
        'abc.js',
        'abc.jsx'
    ]

    expectToMatch.forEach((path) =>
        test(`Expect path "${path}" to match`, () => {
            assert.ok(matcher(path), `Expected path "${path}" to be matched`)
        })
    )

    // Paths we expect not to match
    const expectNotToMatch = ['ssrxjs', 'subdirectory/ssr.js', 'no.jpg', 'static/no.jpg', 'abc.jsz']

    expectNotToMatch.forEach((path) =>
        test(`Expect path "${path}" to NOT match`, () => {
            assert.ok(!matcher(path), `Expected path "${path}" to NOT be matched`)
        })
    )

    // Combine the paths into one array and shuffle it
    const allPaths = expectToMatch.concat(expectNotToMatch).sort(() => Math.random() - 0.5)

    test('glob works with Array.filter', () => {
        const matched = allPaths.filter(matcher)
        assert.strictEqual(
            matched.length,
            expectToMatch.length,
            'Expected that all matches would be returned by filter'
        )
    })
})

describe('CloudAPIClient', () => {
    const username = 'user123'
    const api_key = '123'
    const encoded = Buffer.from(`${username}:${api_key}`, 'binary').toString('base64')
    const expectedAuthHeader = {'Authorization': `Basic ${encoded}`}

    test('getAuthHeader', async () => {
        const client = new upload2.CloudAPIClient({credentials: {username, api_key}})
        expect(client.getAuthHeader()).toEqual(expectedAuthHeader)
    })

    test('getHeaders', async () => {
        const client = new upload2.CloudAPIClient({credentials: {username, api_key}})
        const extra = {extraHeader: 'xyz'}
        expect(await client.getHeaders(extra)).toEqual({
            'User-Agent': `progressive-web-sdk#${pkg.version}`,
            ...expectedAuthHeader,
            ...extra,
        })
    })
})

test('getPkgJSON', async () => {
    const pkg = await upload2.getPkgJSON()
    expect(pkg.name).toBe('pwa-kit-dev')
})



//
//
// test('correctly makes a request', () => {
//     Request.mockClear()
//     Request.mockImplementation((options, callback) => {
//         callback(null, {}, '')
//     })
//
//     Utils.getRequestHeaders.mockClear()
//     const headerMock = {test: true}
//     Utils.getRequestHeaders.mockReturnValueOnce(headerMock)
//
//     return buildRequest(
//         {
//             origin: 'https://test.mobify.com',
//             projectSlug: 'progressive-web-sdk-tests',
//             dataLength: 12345,
//             username: 'space-whales',
//             api_key: 'KEY'
//         },
//         {}
//     ).then(() => {
//         expect(Request).toBeCalled()
//         const options = Request.mock.calls[0][0]
//         expect(options.uri.toString()).toBe(
//             'https://test.mobify.com/api/projects/progressive-web-sdk-tests/builds/'
//         )
//         expect(options.method).toBe('POST')
//
//         expect(Utils.getRequestHeaders).toBeCalled()
//         expect(Utils.getRequestHeaders.mock.calls[0][0]['Content-Length']).toBe(12345)
//         expect(options.headers).toBe(headerMock)
//         expect(options.auth).toEqual({user: 'space-whales', pass: 'KEY'})
//     })
// })
//
// test('passes back the parsed json body', () => {
//     const result = {
//         test: 1,
//         api: 'bundles',
//         progressive: '-web-sdk'
//     }
//
//     Request.mockClear()
//     Request.mockImplementation((options, callback) => {
//         callback(null, {}, JSON.stringify(result))
//     })
//
//     return buildRequest(
//         {
//             origin: 'https://test.mobify.com',
//             projectSlug: 'progressive-web-sdk-tests'
//         },
//         {}
//     ).then((output) => {
//         expect(output).toEqual(result)
//     })
// })
//
// test('calls Fail if there is a non-null error', () => {
//     Request.mockClear()
//     Request.mockImplementation((options, callback) => {
//         callback({message: 'Error!'}, {}, '')
//     })
//     Utils.fail.mockClear()
//
//     buildRequest(
//         {
//             origin: 'https://test.mobify.com',
//             projectSlug: 'progressive-web-sdk-tests'
//         },
//         {}
//     )
//
//     expect(Utils.fail).toBeCalledWith('Error!')
// })
//
// test('calls Fail if the response has an error code', () => {
//     const response = {code: 500}
//     Request.mockImplementation((options, callback) => {
//         callback(null, response, '')
//     })
//     Utils.fail.mockClear()
//     Utils.errorForStatus.mockClear()
//     Utils.errorForStatus.mockReturnValueOnce({message: 'Internal Server Error'})
//
//     buildRequest(
//         {
//             origin: 'https://test.mobify.com',
//             projectSlug: 'progressive-web-sdk-tests'
//         },
//         {}
//     )
//
//     expect(Utils.fail).toBeCalledWith('Internal Server Error')
//     expect(Utils.errorForStatus).toBeCalledWith(response)
// })
//
//
// test('uploadBundle fails with no options, no project slug, or empty project slug', () => {
//     ;[undefined, {}, {projectSlug: ''}].forEach((options) => {
//         Utils.fail.mockClear()
//         Utils.fail.mockImplementationOnce(() => {
//             throw new Error()
//         })
//
//         try {
//             uploadBundle(options)
//         } catch (e) {
//             // Ignore
//         }
//         expect(Utils.fail).toBeCalledWith(
//             '[Error: You must provide a Mobify Cloud project slug to upload a bundle.]'
//         )
//     })
// })
//
// test("calls Utils.exists to check for the bundle's existence", () => {
//     Utils.createBundle.mockClear()
//     Utils.createBundle.mockReturnValueOnce(Promise.resolve())
//
//     Utils.exists.mockClear()
//     Utils.exists.mockReturnValueOnce(Promise.reject())
//
//     Utils.buildObject.mockClear()
//
//     return uploadBundle({projectSlug: 'mobify-test'})
//         .catch(() => true)
//         .then(() => {
//             expect(Utils.createBundle).toBeCalled()
//             expect(Utils.exists).toBeCalled()
//             expect(Utils.exists.mock.calls[0][0]).toBe('build.tar')
//             expect(Utils.buildObject).not.toBeCalled()
//         })
// })
//
// test('the default options cannot be overwritten', async () => {
//     Utils.createBundle.mockClear()
//     Utils.createBundle.mockReturnValue(Promise.reject())
//
//     try {
//         await uploadBundle({target: 'dev'})
//     } catch (err) {
//         const outputTarget = Utils.createBundle.mock.calls[0][0].target
//         expect(outputTarget).toBe('dev')
//     }
//
//     try {
//         await uploadBundle()
//     } catch (err) {
//         const outputTarget = Utils.createBundle.mock.calls[1][0].target
//         const defaultTargetValue = '' // see OPTION_DEFAULTS in ./upload.js
//         expect(outputTarget).toBe(defaultTargetValue)
//     }
//
//     Utils.createBundle.mockReset()
// })
//
//
// let realFail
// beforeEach(() => {
//     realFail = Utils.fail
//     Utils.fail = jest.fn()
// })
//
// afterEach(() => {
//     Utils.fail = realFail
// })
//
// test('getRequestHeaders sets the User-Agent header', () => {
//     const result = Utils.getRequestHeaders()
//     expect(result['User-Agent']).toBe(`progressive-web-sdk#${pkg.version}`)
// })
//
// test('getRequestHeaders copies over headers from the passed object', () => {
//     const additionalHeaders = {
//         Cryptography: 'none',
//         Context: 'testing',
//         Connections: 'mocked out'
//     }
//
//     const result = Utils.getRequestHeaders(additionalHeaders)
//
//     Object.keys(additionalHeaders).forEach((key) => {
//         expect(result[key]).toBe(additionalHeaders[key])
//     })
// })
//
// test('errorForStatus returns false for 2xx and 3xx statuses', () => {
//     ;[200, 201, 302, 303, 304].forEach((statusCode) => {
//         expect(Utils.errorForStatus({statusCode})).toBe(false)
//     })
// })
//
// test('errorForStatus returns an Error for 4xx and 5xx statuses', () => {
//     ;[400, 401, 403, 404, 500, 503].forEach((statusCode) => {
//         expect(Utils.errorForStatus({statusCode})).toBeInstanceOf(Error)
//     })
// })
//
// describe('setDefaultMessage', () => {
//     test('Bundle message is set to branch and commit hash', () => {
//         git.branch.mockClear()
//         git.short.mockClear()
//         git.branch.mockReturnValueOnce('develop')
//         git.short.mockReturnValueOnce('4cd54ec')
//
//         expect(Utils.setDefaultMessage()).toBe('develop: 4cd54ec')
//     })
//
//     test('Bundle message defaults properly if git branch fails', () => {
//         git.branch.mockImplementationOnce(() => {
//             throw new Error('Failwhale')
//         })
//
//         expect(Utils.setDefaultMessage()).toBe('PWA Kit Bundle')
//     })
//
//     test('Bundle message defaults properly if git short fails', () => {
//         git.short.mockImplementationOnce(() => {
//             throw new Error('Failwhale')
//         })
//
//         expect(Utils.setDefaultMessage()).toBe('PWA Kit Bundle')
//     })
//
//     test('Test message is printed if we have an ENOENT', () => {
//         git.branch.mockImplementationOnce(() => {
//             throw {code: 'ENOENT'}
//         })
//         const consoleLog = console.log
//         const mockConsoleLog = jest.fn()
//         console.log = mockConsoleLog
//
//         try {
//             Utils.setDefaultMessage()
//         } finally {
//             console.log = consoleLog
//         }
//
//         expect(mockConsoleLog).toBeCalled()
//         expect(mockConsoleLog.mock.calls[0][0].includes('git init')).toBe(true)
//     })
// })
//
// describe('Create Bundle', () => {
//     const cases = [
//         {
//             name: 'Should create a tar file from a bundle directory',
//             files: [
//                 path.posix.join('directory-a', '1.js'),
//                 path.posix.join('directory-b', '2.js'),
//                 path.posix.join('directory-c', '3.js')
//             ],
//             expectedSSROnly: [
//                 path.posix.join('directory-a', '1.js'),
//                 path.posix.join('directory-b', '2.js'),
//                 path.posix.join('directory-c', '3.js')
//             ],
//             expectedSSRShared: [
//                 path.posix.join('directory-a', '1.js'),
//                 path.posix.join('directory-b', '2.js'),
//                 path.posix.join('directory-c', '3.js')
//             ]
//         },
//         {
//             name: 'Should properly handle directory names that look like file names',
//             files: [
//                 path.posix.join('npm-library.js', '1.js'),
//                 path.posix.join('directory-b', '2.js'),
//                 path.posix.join('directory-c', '3.js')
//             ],
//             expectedSSROnly: [
//                 path.posix.join('npm-library.js', '1.js'),
//                 path.posix.join('directory-b', '2.js'),
//                 path.posix.join('directory-c', '3.js')
//             ],
//             expectedSSRShared: [
//                 path.posix.join('npm-library.js', '1.js'),
//                 path.posix.join('directory-b', '2.js'),
//                 path.posix.join('directory-c', '3.js')
//             ]
//         }
//     ]
//
//     cases.forEach(({name, files, expectedSSROnly, expectedSSRShared}) => {
//         test(name, () => {
//             const tmp = fs.mkdtempSync(path.resolve(os.tmpdir(), 'create-bundle-test-'))
//             const bundlePath = path.join(tmp, 'bundle')
//             fs.mkdirSync(bundlePath)
//
//             const tarFilePath = path.join(tmp, 'bundle.tar')
//
//             /* Generate all directories in the file path recursively if they don't exist */
//             const generateDirectories = (filePath) => {
//                 const dirname = path.dirname(filePath)
//                 if (fs.existsSync(dirname)) {
//                     return true
//                 }
//                 generateDirectories(dirname)
//                 fs.mkdirSync(dirname)
//             }
//
//             /* Generate directories and files */
//             files.forEach((f) => {
//                 generateDirectories(path.join(bundlePath, f))
//                 fs.closeSync(fs.openSync(path.join(bundlePath, f), 'w'))
//             })
//
//             return Promise.resolve()
//                 .then(() =>
//                     Utils.createBundle(
//                         {
//                             buildDirectory: bundlePath,
//                             projectSlug: 'retail-react-app',
//                             set_ssr_values: true,
//                             ssr_only: ['**/*.js'],
//                             ssr_shared: ['**/*.js']
//                         },
//                         tarFilePath
//                     )
//                 )
//                 .then((result) => {
//                     expect(fs.existsSync(tarFilePath))
//                     expect(result.ssr_only.sort()).toEqual(expectedSSROnly.sort())
//                     expect(result.ssr_shared.sort()).toEqual(expectedSSRShared.sort())
//                 })
//                 .finally(() => rimraf.sync(tmp))
//         })
//     })
// })
