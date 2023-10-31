/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {mkdtemp, rm, writeFile, readJsonSync, readJson, createFile} from 'fs-extra'
import {execSync} from 'child_process'
import path from 'path'
import os from 'os'
import * as scriptUtils from './script-utils'
import * as dependencyTreeMockData from './mocks/dependency-tree-mock-data'
const pkg = readJsonSync(path.join(__dirname, '../../package.json'))

let actualReadJson
let actualExecSync

jest.mock('fs-extra', () => {
    const originalModule = jest.requireActual('fs-extra')
    actualReadJson = originalModule.readJson
    return {
        ...originalModule,
        readJson: jest.fn()
    }
})

jest.mock('child_process', () => {
    const originalModule = jest.requireActual('child_process')
    actualExecSync = originalModule.execSync
    return {
        ...originalModule,
        execSync: jest.fn()
    }
})

describe('scriptUtils', () => {
    const originalEnv = process.env
    let tmpDir

    beforeEach(async () => {
        process.env = {...originalEnv}
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'scriptUtils-tests'))
        // This is a workaround for jest.spyOn(), since I guess it doesn't work with our imports?
        // In any case, using the actual implementation by default prevents subtle bugs in tests.
        readJson.mockReset().mockImplementation(actualReadJson)
        execSync.mockReset().mockImplementation(actualExecSync)
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
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTreeMockData.differentMajorVersions
            )
            expect(lowestVersion).toBe('9.0.0')
        })

        test('should work when minor version is different', async () => {
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTreeMockData.differentMinorVersions
            )
            expect(lowestVersion).toBe('1.9.0')
        })

        test('should work when patch version is different', async () => {
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTreeMockData.differentPatchVersions
            )
            expect(lowestVersion).toBe('1.0.9')
        })

        test('should work when version contains pre-release version', async () => {
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTreeMockData.preReleaseVersion
            )
            expect(lowestVersion).toBe('1.0.0-beta')
        })

        test('should work when package is deduped', async () => {
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTreeMockData.dedupedVersion
            )
            expect(lowestVersion).toBe('1.0.0')
        })

        test("should return 'unknown' when package not found", async () => {
            const lowestVersion = await scriptUtils.getLowestPackageVersion(
                '@salesforce/pwa-kit-react-sdk',
                dependencyTreeMockData.noPwaKitPackages
            )
            expect(lowestVersion).toBe('unknown')
        })
    })

    describe('getPwaKitDependencies', () => {
        test('should return pwa-kit packages with unknown version if not in dependency tree', async () => {
            const dependencies = await scriptUtils.getPwaKitDependencies(
                dependencyTreeMockData.noPwaKitPackages
            )
            expect(Object.keys(dependencies)).toHaveLength(3)
            expect(dependencies).toHaveProperty('@salesforce/pwa-kit-react-sdk', 'unknown')
            expect(dependencies).toHaveProperty('@salesforce/pwa-kit-runtime', 'unknown')
            expect(dependencies).toHaveProperty('@salesforce/pwa-kit-dev', 'unknown')
        })

        test('should return pwa-kit packages with version in dependency tree', async () => {
            const dependencies = await scriptUtils.getPwaKitDependencies(
                dependencyTreeMockData.includesPwaKitPackages
            )
            expect(Object.keys(dependencies)).toHaveLength(3)
            expect(dependencies).toHaveProperty('@salesforce/pwa-kit-react-sdk', '1.0.0')
            expect(dependencies).toHaveProperty('@salesforce/pwa-kit-runtime', '1.0.0')
            expect(dependencies).toHaveProperty('@salesforce/pwa-kit-dev', '1.0.0')
        })
    })

    describe('getProjectDependencyTree', () => {
        let originalCwd
        beforeAll(() => {
            originalCwd = process.cwd()
        })
        afterEach(() => process.chdir(originalCwd))
        test('works in retail-react-app', async () => {
            expect(await scriptUtils.getProjectDependencyTree()).toMatchObject({
                name: '@salesforce/pwa-kit-dev',
                version: pkg.version,
                dependencies: expect.any(Object)
            })
        }, 10_000) // This test can take a while on CI
        test('returns nothing if an error occurs', async () => {
            execSync.mockImplementation(() => {
                throw new Error('npm ls did not work')
            })
            expect(await scriptUtils.getProjectDependencyTree()).toBeNull()
        })
    })

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
            execSync.mockReturnValue(JSON.stringify(dependencyTreeMockData.noPwaKitPackages))
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
                execSync.mockReturnValue(JSON.stringify(dependencyTreeMockData.noPwaKitPackages))
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

    describe('walkDir', () => {
        const files = ['a', 'b/1', 'b/2', 'c/d/e'].map(path.normalize)
        beforeEach(async () => {
            await Promise.all(files.map(async (file) => await createFile(path.join(tmpDir, file))))
        })
        test('finds all files in a directory', async () => {
            const result = await scriptUtils.walkDir(tmpDir, tmpDir)
            expect([...result]).toEqual(files)
        })
        test('returns file relative to specified path', async () => {
            const result = await scriptUtils.walkDir(tmpDir, '/')
            expect([...result]).toEqual(files.map((f) => path.join(tmpDir, f)))
        })
    })
})
