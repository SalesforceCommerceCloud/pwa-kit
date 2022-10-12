/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {mkdtemp, rmdir, writeFile} from 'fs/promises'

const pkg = require('../../package.json')
import * as upload2 from './upload2'
import assert from 'assert'
import path from 'path'
import os from 'os'

describe('upload2', () => {
    let tmpDir

    beforeEach(async () => {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'upload2-tests'))
    })

    afterEach(async () => {
        tmpDir && (await rmdir(tmpDir, {recursive: true}))
    })

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
        const expectNotToMatch = [
            'ssrxjs',
            'subdirectory/ssr.js',
            'no.jpg',
            'static/no.jpg',
            'abc.jsz'
        ]

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
        const expectedAuthHeader = {Authorization: `Basic ${encoded}`}

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
                ...extra
            })
        })
    })

    test('getPkgJSON', async () => {
        const pkg = await upload2.getPkgJSON()
        expect(pkg.name).toBe('pwa-kit-dev')
    })

    describe('defaultMessage', () => {
        test('works', async () => {
            const mockGit = {branch: () => 'branch', short: () => 'short'}
            expect(upload2.defaultMessage(mockGit)).toEqual('branch: short')
        })

        test('works outside of a git repo ', async () => {
            const mockGit = {
                branch: () => {
                    throw {code: 'ENOENT'}
                },
                short: () => 'short'
            }
            expect(upload2.defaultMessage(mockGit)).toEqual('PWA Kit Bundle')
        })

        test('works with any other error ', async () => {
            const mockGit = {
                branch: () => {
                    throw new Error()
                },
                short: () => 'short'
            }
            expect(upload2.defaultMessage(mockGit)).toEqual('PWA Kit Bundle')
        })
    })

    test('getCredentialsFile', async () => {
        const findHomeDir = () => '/my-fake-home/'
        expect(
            upload2.getCredentialsFile('https://example.com', '/path/to/.mobify', undefined)
        ).toBe('/path/to/.mobify')
        expect(upload2.getCredentialsFile('https://example.com', undefined, findHomeDir)).toBe(
            `${findHomeDir()}.mobify--example.com`
        )
        expect(upload2.getCredentialsFile('https://cloud.mobify.com', undefined, findHomeDir)).toBe(
            `${findHomeDir()}.mobify`
        )
    })

    describe('readCredentials', () => {
        test('should work', async () => {
            const creds = {username: 'alice', api_key: 'xyz'}
            const thePath = path.join(tmpDir, '.mobify.test')
            await writeFile(thePath, JSON.stringify(creds), 'utf8')
            expect(await upload2.readCredentials(thePath)).toEqual(creds)
        })

        test('should throw', async () => {
            const thePath = path.join(tmpDir, '.mobify.test')
            await expect(async () => await upload2.readCredentials(thePath)).rejects.toThrow(Error)
        })
    })

    describe('createBundle', () => {
        test('should throw if ssr_only and ssr_shared is empty', async () => {
            await expect(
                async () =>
                    await upload2.createBundle({
                        message: null,
                        ssr_parameters: {},
                        ssr_only: [],
                        ssr_shared: [],
                        buildDirectory: tmpDir,
                        projectSlug: 'slug'
                    })
            ).rejects.toThrow('no ssrOnly or ssrShared files are defined')
        })

        test('should throw buildDir does not exist', async () => {
            await expect(
                async () =>
                    await upload2.createBundle({
                        message: null,
                        ssr_parameters: {},
                        ssr_only: ['*.js'],
                        ssr_shared: ['*.js'],
                        buildDirectory: path.join(tmpDir, 'does-not-exist'),
                        projectSlug: 'slug'
                    })
            ).rejects.toThrow('Error: Build directory at path')
        })

        test('should archive a bundle', async () => {
            const message = 'message'
            const bundle = await upload2.createBundle({
                message,
                ssr_parameters: {},
                ssr_only: ['*.js'],
                ssr_shared: ['**/*.*'],
                buildDirectory: path.join(__dirname, 'test-fixtures', 'minimal-built-app'),
                projectSlug: 'slug'
            })

            expect(bundle.message).toEqual(message)
            expect(bundle.encoding).toEqual('base64')
            expect(bundle.ssr_parameters).toEqual({})
            expect(bundle.ssr_only).toEqual(['ssr.js'])
            expect(bundle.ssr_shared).toEqual(['ssr.js', 'static/favicon.ico'])

            // De-code and re-encode gives the same result, to show that it *is* b64 encoded
            expect(Buffer.from(bundle.data, 'base64').toString('base64')).toEqual(bundle.data)
        })
    })

    describe('pushBundle', () => {
        test.each([[{statusCode: 200}], [{statusCode: 401}]])(
            'should push a built bundle and handle status codes (%p)',
            async ({statusCode}) => {
                const message = 'message'
                const bundle = await upload2.createBundle({
                    message,
                    ssr_parameters: {},
                    ssr_only: ['*.js'],
                    ssr_shared: ['**/*.*'],
                    buildDirectory: path.join(__dirname, 'test-fixtures', 'minimal-built-app'),
                    projectSlug: 'slug'
                })

                const username = 'user123'
                const api_key = '123'
                const credentials = {username, api_key}

                const responseMock = {statusCode}
                const fetchMock = jest.fn(async () => responseMock)

                const client = new upload2.CloudAPIClient({credentials, fetch: fetchMock})

                const fn = async () => await client.push(bundle, 'project-slug')

                if (statusCode === 200) {
                    expect(await fn()).toBe(responseMock)
                } else {
                    await expect(fn).rejects.toThrow('For more information visit')
                }

                expect(fetchMock.mock.calls.length).toBe(1)

                const url = fetchMock.mock.calls[0][0]
                const opts = fetchMock.mock.calls[0][1]

                expect(url).toEqual('https://cloud.mobify.com/api/projects/project-slug/builds/')
                expect(opts.body).toEqual(expect.anything(Buffer))
                expect(opts.method).toEqual('POST')
                expect(opts.headers['Authorization']).toMatch(new RegExp('^Basic '))
                expect(opts.headers['Content-Length']).toEqual(opts.body.length.toString())
                expect(opts.headers['User-Agent']).toEqual(`progressive-web-sdk#${pkg.version}`)
            }
        )
    })
})
