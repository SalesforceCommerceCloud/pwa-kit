/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {mkdtemp, rm, writeFile, readJsonSync, readJson} from 'fs-extra'
import path from 'path'
import os from 'os'
import * as scriptUtils from './script-utils'
const pkg = readJsonSync(path.join(__dirname, '../../package.json'))

jest.mock('fs-extra', () => {
    return {
        ...jest.requireActual('fs-extra'),
        readJson: jest.fn()
    }
})

describe('scriptUtils', () => {
    const originalEnv = process.env
    let tmpDir

    beforeEach(async () => {
        process.env = {...originalEnv}
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'scriptUtils-tests'))
    })

    afterEach(async () => {
        process.env = originalEnv
        tmpDir && (await rm(tmpDir, {recursive: true}))
        jest.resetAllMocks()
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
                expect(matcher(path)).toBe(true)
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
                expect(matcher(path)).toBe(false)
            })
        )

        const allPaths = expectToMatch.concat(expectNotToMatch)

        test('glob works with Array.filter', () => {
            const matched = allPaths.filter(matcher)
            expect(matched).toHaveLength(expectToMatch.length)
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
            readJson.mockReturnValue(pkg)
            const client = new scriptUtils.CloudAPIClient({credentials: {username, api_key}})
            expect(await client.getHeaders()).toEqual({
                'User-Agent': `${pkg.name}@${pkg.version}`,
                ...expectedAuthHeader
            })
        })
    })

    describe('getPkgJSON', () => {
        test('should work', async () => {
            readJson.mockReturnValue(pkg)
            const pkgJson = await scriptUtils.getPkgJSON()
            expect(pkgJson.name).toBe('@salesforce/pwa-kit-dev')
        })

        test('should return default package.json data when no valid file is found', async () => {
            readJson.mockRejectedValue(Error)
            const result = await scriptUtils.getPkgJSON()
            expect(result).toEqual({name: '@salesforce/pwa-kit-dev', version: 'unknown'})
        })
    })

    describe('getProjectPkg', () => {
        test('should work', async () => {
            readJson.mockReturnValue(pkg)
            const pkgJson = await scriptUtils.getProjectPkg()
            expect(pkgJson.name).toBe('@salesforce/pwa-kit-dev')
        })

        test('should throw', async () => {
            readJson.mockRejectedValue(Error)
            await expect(scriptUtils.getProjectPkg()).rejects.toThrow(
                `Could not read project package at "${path.join(process.cwd(), 'package.json')}"`
            )
        })
    })

    describe('getLowestPackageVersion', () => {
        test('should work when major version is different', async () => {
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/retail-react-app': {
                        version: '0.0.1',
                        dependencies: {
                            'some-other-library': {
                                version: '0.0.1',
                                dependencies: {
                                    '@salesforce/pwa-kit-react-sdk': {
                                        version: '1.0.0'
                                    }
                                }
                            }
                        }
                    },
                    '@salesforce/pwa-kit-react-sdk': {
                        version: '2.0.0'
                    }
                }
            }
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTree
            )
            expect(lowestVersion).toBe('1.0.0')
        })

        test('should work when minor version is different', async () => {
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/retail-react-app': {
                        version: '1.0.0',
                        dependencies: {
                            '@salesforce/pwa-kit-react-sdk': {
                                version: '1.0.0'
                            }
                        }
                    },
                    '@salesforce/pwa-kit-react-sdk': {
                        version: '1.1.0'
                    }
                }
            }
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTree
            )
            expect(lowestVersion).toBe('1.0.0')
        })

        test('should work when patch version is different', async () => {
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/retail-react-app': {
                        version: '1.0.0',
                        dependencies: {
                            '@salesforce/pwa-kit-react-sdk': {
                                version: '1.0.0'
                            }
                        }
                    },
                    '@salesforce/pwa-kit-react-sdk': {
                        version: '1.0.1'
                    }
                }
            }
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTree
            )
            expect(lowestVersion).toBe('1.0.0')
        })

        test('should work when version contains string', async () => {
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/retail-react-app': {
                        version: '1.0.0',
                        dependencies: {
                            '@salesforce/pwa-kit-react-sdk': {
                                version: '1.0.0'
                            }
                        }
                    },
                    '@salesforce/pwa-kit-react-sdk': {
                        version: '1.0.0-beta.0'
                    }
                }
            }
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTree
            )
            expect(lowestVersion).toBe('1.0.0')
        })

        test('should work when package is deduped', async () => {
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/retail-react-app': {
                        version: '1.0.0',
                        dependencies: {
                            '@salesforce/pwa-kit-react-sdk': {
                                version: '1.0.0'
                            }
                        }
                    },
                    '@salesforce/pwa-kit-react-sdk': {
                        version: '1.0.0'
                    }
                }
            }
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTree
            )
            expect(lowestVersion).toBe('1.0.0')
        })

        test("should return 'unknown' when package not found", async () => {
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/retail-react-app': {
                        version: '1.0.0'
                    }
                }
            }
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTree
            )
            expect(lowestVersion).toBe('unknown')
        })
    })

    describe('getDependencies', () => {
        test('should only return pwa-kit packages if dependencies and devDependencies is empty', async () => {
            const dependencies = {}
            const devDependencies = {}
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/retail-react-app': {
                        version: '1.0.0'
                    }
                }
            }
            const allDependencies = await scriptUtils.getDependencies(
                dependencies,
                devDependencies,
                dependencyTree
            )
            expect(Object.keys(allDependencies)).toHaveLength(3)
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-react-sdk', 'unknown')
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-runtime', 'unknown')
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-dev', 'unknown')
        })

        test('should work if passed non-empty dependencies and devDependencies', async () => {
            const dependencies = {'some-dep': '1.0.0'}
            const devDependencies = {'some-dev-dep': '3.0.1'}
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/pwa-kit-react-sdk': {
                        version: '1.0.0'
                    },
                    '@salesforce/pwa-kit-runtime': {
                        version: '1.0.0'
                    },
                    '@salesforce/pwa-kit-dev': {
                        version: '1.0.0'
                    }
                }
            }
            const allDependencies = await scriptUtils.getDependencies(
                dependencies,
                devDependencies,
                dependencyTree
            )
            expect(Object.keys(allDependencies)).toHaveLength(5)
            expect(allDependencies).toMatchObject(dependencies)
            expect(allDependencies).toMatchObject(devDependencies)
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-react-sdk', '1.0.0')
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-runtime', '1.0.0')
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-dev', '1.0.0')
        })

        test('should overwrite pwa-kit package version if lower one found in tree', async () => {
            const dependencies = {
                '@salesforce/pwa-kit-react-sdk': '3.0.0',
                '@salesforce/pwa-kit-runtime': '3.0.0'
            }
            const devDependencies = {'@salesforce/pwa-kit-dev': '3.0.0'}
            const dependencyTree = {
                version: '0.0.1',
                name: 'test',
                dependencies: {
                    '@salesforce/pwa-kit-react-sdk': {
                        version: '1.0.0'
                    },
                    '@salesforce/pwa-kit-runtime': {
                        version: '1.0.0'
                    },
                    '@salesforce/pwa-kit-dev': {
                        version: '1.0.0'
                    }
                }
            }
            const allDependencies = await scriptUtils.getDependencies(
                dependencies,
                devDependencies,
                dependencyTree
            )
            expect(Object.keys(allDependencies)).toHaveLength(3)
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-react-sdk', '1.0.0')
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-runtime', '1.0.0')
            expect(allDependencies).toHaveProperty('@salesforce/pwa-kit-dev', '1.0.0')
        })
    })

    jest.unmock('fs-extra')
    describe('defaultMessage', () => {
        test('works', async () => {
            const mockGit = {branch: () => 'branch', short: () => 'short'}
            expect(scriptUtils.defaultMessage(mockGit)).toBe('branch: short')
        })

        test('works outside of a git repo', async () => {
            const mockGit = {
                branch: () => {
                    throw {code: 'ENOENT'}
                },
                short: () => 'short'
            }
            expect(scriptUtils.defaultMessage(mockGit)).toBe('PWA Kit Bundle')
        })

        test('works with any other error', async () => {
            const mockGit = {
                branch: () => {
                    throw new Error()
                },
                short: () => 'short'
            }
            expect(scriptUtils.defaultMessage(mockGit)).toBe('PWA Kit Bundle')
        })
    })

    test('getCredentialsFile', async () => {
        expect(scriptUtils.getCredentialsFile('https://example.com', '/path/to/.mobify')).toBe(
            '/path/to/.mobify'
        )
        expect(scriptUtils.getCredentialsFile('https://example.com', undefined)).toBe(
            path.join(os.homedir(), '.mobify--example.com')
        )
        expect(scriptUtils.getCredentialsFile('https://cloud.mobify.com', undefined)).toBe(
            path.join(os.homedir(), '.mobify')
        )
    })

    describe('readCredentials', () => {
        test('should work', async () => {
            readJson.mockReturnValue({username: 'alice', api_key: 'xyz'})
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
            ).rejects.toThrow('Build directory at path')
        })

        test('should archive a bundle', async () => {
            readJson.mockReturnValue(pkg)
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
            expect(bundle.encoding).toBe('base64')
            expect(bundle.ssr_parameters).toEqual({})
            expect(bundle.ssr_only).toEqual(['ssr.js'])
            expect(bundle.ssr_shared).toEqual(['ssr.js', 'static/favicon.ico'])
            expect(bundle.bundle_metadata).toHaveProperty('dependencies')
            expect(bundle.bundle_metadata).toHaveProperty('cc_overrides')

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
                readJson.mockReturnValue(pkg)
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

                const goodResponseBody = {anything: 'anything'}

                // Older APIs on Cloud return JSON for good responses and text for errors,
                // hence the strange looking mock response setup.
                const text = () =>
                    status === 200
                        ? Promise.resolve(JSON.stringify(goodResponseBody))
                        : Promise.resolve('An error occurred')

                const json = () =>
                    status === 200 ? Promise.resolve(goodResponseBody) : Promise.reject()

                const responseMock = {status, text, json}
                const fetchMock = jest.fn(async () => responseMock)

                const client = new scriptUtils.CloudAPIClient({credentials, fetch: fetchMock})

                const fn = async () => await client.push(bundle, projectSlug, targetSlug)

                // TODO: Split up this batch of tests to avoid conditional assertions
                if (status === 200) {
                    // eslint-disable-next-line jest/no-conditional-expect
                    expect(await fn()).toBe(goodResponseBody)
                } else {
                    // eslint-disable-next-line jest/no-conditional-expect
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
                            'Content-Length': expect.stringMatching(/^\d+$/),
                            'User-Agent': `${pkg.name}@${pkg.version}`
                        }
                    })
                )
            }
        )
    })

    describe('createLoggingToken', () => {
        const username = 'user123'
        const api_key = '123'
        test('createLoggingToken passes', async () => {
            readJson.mockReturnValue(pkg)
            const projectSlug = 'project-slug'
            const targetSlug = 'target-slug'

            const text = () => Promise.resolve(JSON.stringify({token: 'token-value'}))
            const json = () => Promise.resolve({token: 'token-value'})
            const fetchMock = jest.fn(async () => ({status: 200, text, json}))

            const client = new scriptUtils.CloudAPIClient({
                credentials: {username, api_key},
                fetch: fetchMock
            })

            const fn = async () => await client.createLoggingToken(projectSlug, targetSlug)

            expect(await fn()).toBe('token-value')
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(
                'https://cloud.mobify.com/api/projects/project-slug/target/target-slug/jwt/',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        Authorization: expect.stringMatching(/^Bearer /),
                        'User-Agent': `${pkg.name}@${pkg.version}`
                    }
                })
            )
        })
    })

    describe('parseLog', () => {
        it('correctly parses an application log', () => {
            const log =
                '2023-07-15T10:00:00Z\t550e8400-e29b-41d4-a716-446655440000\tINFO\tThis is a test log message'
            const result = scriptUtils.parseLog(log)

            expect(result).toEqual({
                level: 'INFO',
                message: 'This is a test log message',
                shortRequestId: '550e8400'
            })
        })

        it('correctly parses a platform log', () => {
            const log = 'WARN\tThis is a test log message'
            const result = scriptUtils.parseLog(log)

            expect(result).toEqual({
                level: 'WARN',
                message: '\tThis is a test log message',
                shortRequestId: undefined
            })
        })

        it('finds the shortRequestId in the message if not present in the request id', () => {
            const log = 'INFO\tThis is a test log message 550e8400'
            const result = scriptUtils.parseLog(log)

            expect(result).toEqual({
                level: 'INFO',
                message: '\tThis is a test log message 550e8400',
                shortRequestId: '550e8400'
            })
        })
    })
})
