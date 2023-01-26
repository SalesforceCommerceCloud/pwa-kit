/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {mkdtemp, rmdir, writeFile} from 'fs/promises'

const pkg = require('../../package.json')
import * as scriptUtils from './script-utils'
import assert from 'assert'
import path from 'path'
import os from 'os'

describe('scriptUtils', () => {
    const originalEnv = process.env
    let tmpDir

    beforeEach(async () => {
        process.env = {...originalEnv}
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'scriptUtils-tests'))
    })

    afterEach(async () => {
        process.env = originalEnv
        tmpDir && (await rmdir(tmpDir, {recursive: true}))
    })

    test('glob() with no patterns matches nothing', () => {
        const matcher = scriptUtils.glob()
        expect(matcher('')).toBe(false)
        expect(matcher('a.js')).toBe(false)
        expect(matcher()).toBe(false)
    })

    describe('glob() filters correctly', () => {
        const patterns = ['ssr.js', '**/*.jpg', '!**/no.jpg', 'abc.{js,jsx}']

        const matcher = scriptUtils.glob(patterns)

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
            const client = new scriptUtils.CloudAPIClient({credentials: {username, api_key}})
            expect(client.getAuthHeader()).toEqual(expectedAuthHeader)
        })

        test('getHeaders', async () => {
            const client = new scriptUtils.CloudAPIClient({credentials: {username, api_key}})
            const extra = {extraHeader: 'xyz'}
            expect(await client.getHeaders(extra)).toEqual({
                'User-Agent': `${pkg.name}@${pkg.version}`,
                ...expectedAuthHeader,
                ...extra
            })
        })
    })

    test('getPkgJSON', async () => {
        const pkg = await scriptUtils.getPkgJSON()
        expect(pkg.name).toBe('pwa-kit-dev')
    })

    describe('defaultMessage', () => {
        test('works', async () => {
            const mockGit = {branch: () => 'branch', short: () => 'short'}
            expect(scriptUtils.defaultMessage(mockGit)).toEqual('branch: short')
        })

        test('works outside of a git repo ', async () => {
            const mockGit = {
                branch: () => {
                    throw {code: 'ENOENT'}
                },
                short: () => 'short'
            }
            expect(scriptUtils.defaultMessage(mockGit)).toEqual('PWA Kit Bundle')
        })

        test('works with any other error ', async () => {
            const mockGit = {
                branch: () => {
                    throw new Error()
                },
                short: () => 'short'
            }
            expect(scriptUtils.defaultMessage(mockGit)).toEqual('PWA Kit Bundle')
        })
    })

    test('getCredentialsFile', async () => {
        const findHomeDir = () => path.resolve('my-fake-home') + path.sep
        expect(
            scriptUtils.getCredentialsFile('https://example.com', '/path/to/.mobify', undefined)
        ).toBe('/path/to/.mobify')
        expect(scriptUtils.getCredentialsFile('https://example.com', undefined, findHomeDir)).toBe(
            `${findHomeDir()}.mobify--example.com`
        )
        expect(
            scriptUtils.getCredentialsFile('https://cloud.mobify.com', undefined, findHomeDir)
        ).toBe(`${findHomeDir()}.mobify`)
    })

    test('findHomeDir', () => {
        process.env.USERPROFILE = '/path/to/fake-user-profile-dir/'
        process.env.HOME = '/path/to/fake-home-dir/'
        const forCurrentMachine =
            process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME
        expect(scriptUtils.findHomeDir('win32')).toEqual(process.env.USERPROFILE)
        expect(scriptUtils.findHomeDir('anything-else')).toEqual(process.env.HOME)
        expect(scriptUtils.findHomeDir()).toEqual(forCurrentMachine)
    })

    describe('readCredentials', () => {
        test('should work', async () => {
            const creds = {username: 'alice', api_key: 'xyz'}
            const thePath = path.join(tmpDir, '.mobify.test')
            await writeFile(thePath, JSON.stringify(creds), 'utf8')
            expect(await scriptUtils.readCredentials(thePath)).toEqual(creds)
        })

        test('should throw', async () => {
            const thePath = path.join(tmpDir, '.mobify.test')
            await expect(async () => await scriptUtils.readCredentials(thePath)).rejects.toThrow(
                Error
            )
        })
    })

    describe('createBundle', () => {
        test('should throw if ssr_only and ssr_shared is empty', async () => {
            await expect(
                async () =>
                    await scriptUtils.createBundle({
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
                    await scriptUtils.createBundle({
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
            const bundle = await scriptUtils.createBundle({
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
        test.each([
            [
                {
                    projectSlug: 'project-slug',
                    targetSlug: undefined,
                    expectedURL: 'https://cloud.mobify.com/api/projects/project-slug/builds/',
                    status: 200
                }
            ],
            [
                {
                    projectSlug: 'project-slug',
                    targetSlug: 'target-slug',
                    expectedURL:
                        'https://cloud.mobify.com/api/projects/project-slug/builds/target-slug/',
                    status: 200
                }
            ],
            [
                {
                    projectSlug: 'project-slug',
                    targetSlug: undefined,
                    expectedURL: 'https://cloud.mobify.com/api/projects/project-slug/builds/',
                    status: 401
                }
            ]
        ])(
            'should push a built bundle and handle status codes (%p)',
            async ({projectSlug, targetSlug, expectedURL, status}) => {
                const message = 'message'
                const bundle = await scriptUtils.createBundle({
                    message,
                    ssr_parameters: {},
                    ssr_only: ['*.js'],
                    ssr_shared: ['**/*.*'],
                    buildDirectory: path.join(__dirname, 'test-fixtures', 'minimal-built-app'),
                    projectSlug
                })

                const username = 'user123'
                const api_key = '123'
                const credentials = {username, api_key}

                const reponseBodyMock = {anything: 'anything'}
                const responseMock = {status, json: () => Promise.resolve(reponseBodyMock)}
                const fetchMock = jest.fn(async () => responseMock)

                const client = new scriptUtils.CloudAPIClient({credentials, fetch: fetchMock})

                const fn = async () => await client.push(bundle, projectSlug, targetSlug)

                if (status === 200) {
                    expect(await fn()).toBe(reponseBodyMock)
                } else {
                    await expect(fn).rejects.toThrow('For more information visit')
                }

                expect(fetchMock).toHaveBeenCalledTimes(1)

                expect(fetchMock).toHaveBeenCalledWith(
                  expectedURL,
                  expect.objectContaining({
                    body: expect.anything(Buffer),
                    method: 'POST',
                    headers: {
                      Authorization: expect.stringMatching(/^Basic /),
                      'Content-Length': opts.body.length.toString(),
                      'User-Agent': `${pkg.name}@${pkg.version}`
                    }
                  })
            }
        )
    })
})
