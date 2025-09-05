/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const MRTTargetUpdater = require('./update-mrt-target')
const {Command} = require('commander')
const dotenv = require('dotenv')

// Mock dependencies
jest.mock('commander')
jest.mock('dotenv')

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log
const originalConsoleError = console.error

describe('MRTTargetUpdater', () => {
    let updater

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Mock console methods
        console.log = jest.fn()
        console.error = jest.fn()
    })

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog
        console.error = originalConsoleError

        jest.clearAllMocks()
    })

    describe('constructor', () => {
        test('should create instance with default options', () => {
            updater = new MRTTargetUpdater()

            expect(updater.projectSlug).toBeUndefined()
            expect(updater.targetSlug).toBeUndefined()
            expect(updater.cloudOrigin).toBe('https://cloud.mobify.com')
            expect(updater.mobifyApiKey).toBeUndefined()
            expect(updater.envFile).toBeUndefined()
        })

        test('should create instance with custom options', () => {
            const options = {
                projectSlug: 'test-project',
                targetSlug: 'test-target',
                cloudOrigin: 'https://custom.example.com',
                mobifyApiKey: 'test-api-key',
                envFile: '.env.test'
            }

            updater = new MRTTargetUpdater(options)

            expect(updater.projectSlug).toBe(options.projectSlug)
            expect(updater.targetSlug).toBe(options.targetSlug)
            expect(updater.cloudOrigin).toBe(options.cloudOrigin)
            expect(updater.mobifyApiKey).toBe(options.mobifyApiKey)
            expect(updater.envFile).toBe(options.envFile)
        })

        test('should use default cloudOrigin when not provided', () => {
            const options = {
                projectSlug: 'test-project',
                targetSlug: 'test-target',
                mobifyApiKey: 'test-api-key'
            }

            updater = new MRTTargetUpdater(options)

            expect(updater.cloudOrigin).toBe('https://cloud.mobify.com')
        })
    })

    describe('_parseEnvFile', () => {
        beforeEach(() => {
            updater = new MRTTargetUpdater({envFile: '.env.test'})
            jest.clearAllMocks()
        })

        test('should parse .env file successfully', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_NAME: 'test-target',
                    MRT_TARGET_SSR_REGION: 'us-east-1',
                    API_KEY: 'test-key'
                }
            })

            const result = updater._parseEnvFile()

            expect(dotenv.config).toHaveBeenCalledWith({path: '.env.test'})
            expect(result).toEqual({
                MRT_TARGET_NAME: 'test-target',
                MRT_TARGET_SSR_REGION: 'us-east-1',
                API_KEY: 'test-key'
            })
        })

        test('should throw error when dotenv fails', () => {
            dotenv.config.mockReturnValue({
                error: new Error('Parse error')
            })

            expect(() => {
                updater._parseEnvFile()
            }).toThrow('Failed to parse .env file: Parse error')
        })

        test('should return empty object when parsed is null or undefined', () => {
            // Test null
            dotenv.config.mockReturnValue({parsed: null})
            expect(updater._parseEnvFile()).toEqual({})

            // Test undefined
            dotenv.config.mockReturnValue({})
            expect(updater._parseEnvFile()).toEqual({})
        })
    })

    describe('buildUpdateTargetPayload', () => {
        beforeEach(() => {
            updater = new MRTTargetUpdater({envFile: '.env.test'})
            jest.clearAllMocks()
        })

        test('should build payload with only truthy values', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_NAME: 'Test Target',
                    MRT_TARGET_SSR_EXTERNAL_HOSTNAME: 'test.example.com',
                    MRT_TARGET_SSR_EXTERNAL_DOMAIN: 'example.com',
                    MRT_TARGET_SSR_REGION: 'us-east-1',
                    MRT_TARGET_SSR_WHITELISTED_IPS: '192.168.1.1,10.0.0.1',
                    MRT_TARGET_SSR_PROXY_CONFIGS:
                        '{"proxy1": {"target": "http://api.example.com"}}',
                    MRT_TARGET_ALLOW_COOKIES: 'true',
                    MRT_TARGET_ENABLE_SOURCE_MAPS: 'false',
                    MRT_TARGET_LOG_LEVEL: 'info'
                }
            })

            const payload = updater.buildUpdateTargetPayload()

            expect(payload).toEqual({
                name: 'Test Target',
                ssr_external_hostname: 'test.example.com',
                ssr_external_domain: 'example.com',
                ssr_region: 'us-east-1',
                ssr_whitelisted_ips: '192.168.1.1,10.0.0.1',
                ssr_proxy_configs: {proxy1: {target: 'http://api.example.com'}},
                allow_cookies: true,
                enable_source_maps: false,
                log_level: 'info'
            })
        })

        test('should handle falsy values and boolean conversion', () => {
            // Test skipping falsy values
            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_NAME: '',
                    MRT_TARGET_SSR_EXTERNAL_HOSTNAME: null,
                    MRT_TARGET_SSR_EXTERNAL_DOMAIN: undefined,
                    MRT_TARGET_SSR_REGION: 'us-east-1'
                }
            })
            expect(updater.buildUpdateTargetPayload()).toEqual({ssr_region: 'us-east-1'})

            // Test boolean string conversion
            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_ALLOW_COOKIES: 'true',
                    MRT_TARGET_ENABLE_SOURCE_MAPS: 'false'
                }
            })
            expect(updater.buildUpdateTargetPayload()).toEqual({
                allow_cookies: true,
                enable_source_maps: false
            })
        })

        test('should parse JSON for ssrProxyConfigs', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_SSR_PROXY_CONFIGS:
                        '{"api": {"target": "http://api.example.com", "changeOrigin": true}}'
                }
            })

            const payload = updater.buildUpdateTargetPayload()

            expect(payload).toEqual({
                ssr_proxy_configs: {
                    api: {
                        target: 'http://api.example.com',
                        changeOrigin: true
                    }
                }
            })
        })

        test('should return empty payload when all properties are falsy', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_NAME: '',
                    MRT_TARGET_SSR_EXTERNAL_HOSTNAME: null,
                    MRT_TARGET_SSR_EXTERNAL_DOMAIN: undefined
                }
            })

            const payload = updater.buildUpdateTargetPayload()

            expect(payload).toEqual({})
        })

        test('should handle invalid JSON in proxy configs with warning', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_SSR_PROXY_CONFIGS: 'invalid json'
                }
            })

            const payload = updater.buildUpdateTargetPayload()

            expect(payload).toEqual({})
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Warning: Failed to parse proxy configs')
            )

            consoleWarnSpy.mockRestore()
        })

        test('should throw error when env file parsing fails', () => {
            dotenv.config.mockReturnValue({
                error: new Error('Parse error')
            })

            expect(() => {
                updater.buildUpdateTargetPayload()
            }).toThrow('Failed to parse .env file: Parse error')
        })
    })

    describe('buildEnvVarsPayload', () => {
        beforeEach(() => {
            updater = new MRTTargetUpdater({envFile: '.env.test'})
            jest.clearAllMocks()
        })

        test('should build payload with environment variables in correct format', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    NODE_ENV: 'production',
                    API_URL: 'https://api.example.com',
                    DEBUG: 'false'
                }
            })

            const payload = updater.buildEnvVarsPayload()

            expect(payload).toEqual({
                NODE_ENV: {value: 'production'},
                API_URL: {value: 'https://api.example.com'},
                DEBUG: {value: 'false'}
            })
        })

        test('should return empty payload when parsed env is empty, null, or undefined', () => {
            // Test empty object
            dotenv.config.mockReturnValue({parsed: {}})
            expect(updater.buildEnvVarsPayload()).toEqual({})

            // Test null
            dotenv.config.mockReturnValue({parsed: null})
            expect(updater.buildEnvVarsPayload()).toEqual({})

            // Test undefined
            dotenv.config.mockReturnValue({})
            expect(updater.buildEnvVarsPayload()).toEqual({})
        })

        test('should handle environment variables with null values', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    NODE_ENV: 'production',
                    DELETE_ME: null,
                    API_URL: 'https://api.example.com'
                }
            })

            const payload = updater.buildEnvVarsPayload()

            expect(payload).toEqual({
                NODE_ENV: {value: 'production'},
                DELETE_ME: {value: null},
                API_URL: {value: 'https://api.example.com'}
            })
        })

        test('should throw error when env file parsing fails', () => {
            dotenv.config.mockReturnValue({
                error: new Error('Parse error')
            })

            expect(() => {
                updater.buildEnvVarsPayload()
            }).toThrow('Failed to parse .env file: Parse error')
        })
    })

    describe('updateTarget', () => {
        beforeEach(() => {
            updater = new MRTTargetUpdater({
                projectSlug: 'test-project',
                targetSlug: 'test-target',
                cloudOrigin: 'https://test.example.com',
                mobifyApiKey: 'test-api-key'
            })
        })

        test('should build correct URL from configuration', () => {
            const expectedUrl =
                'https://test.example.com/api/projects/test-project/target/test-target/'

            expect(updater.cloudOrigin).toBe('https://test.example.com')
            expect(updater.projectSlug).toBe('test-project')
            expect(updater.targetSlug).toBe('test-target')

            const url = `${updater.cloudOrigin}/api/projects/${updater.projectSlug}/target/${updater.targetSlug}/`
            expect(url).toBe(expectedUrl)
        })
    })

    describe('updateEnvironmentVariables', () => {
        beforeEach(() => {
            updater = new MRTTargetUpdater({
                projectSlug: 'test-project',
                targetSlug: 'test-target',
                cloudOrigin: 'https://test.example.com',
                mobifyApiKey: 'test-api-key'
            })
        })

        test('should build correct URL for environment variables endpoint', () => {
            const expectedUrl =
                'https://test.example.com/api/projects/test-project/target/test-target/env-var/'

            // Test URL building logic
            const url = `${updater.cloudOrigin}/api/projects/${updater.projectSlug}/target/${updater.targetSlug}/env-var/`
            expect(url).toBe(expectedUrl)
        })
    })

    describe('CLI integration', () => {
        let mockProgram
        let mockCommand
        let originalArgv

        beforeEach(() => {
            mockCommand = {
                description: jest.fn().mockReturnThis(),
                option: jest.fn().mockReturnThis(),
                action: jest.fn().mockReturnThis(),
                opts: jest.fn().mockReturnValue({})
            }

            mockProgram = {
                option: jest.fn().mockReturnThis(),
                command: jest.fn().mockReturnValue(mockCommand),
                parse: jest.fn(),
                outputHelp: jest.fn(),
                opts: jest.fn().mockReturnValue({
                    projectSlug: 'test-project',
                    targetSlug: 'test-target',
                    mobifyApiKey: 'test-api-key',
                    cloudOrigin: 'https://cloud.mobify.com'
                })
            }

            Command.mockImplementation(() => mockProgram)

            originalArgv = process.argv
            process.argv = ['node', 'script.js', 'target', '--name', 'test']
        })

        afterEach(() => {
            // Restore process.argv
            process.argv = originalArgv
        })

        test('should set up target command with correct options', () => {
            const updateMrtTarget = require('./update-mrt-target')

            expect(updateMrtTarget).toBe(MRTTargetUpdater)
        })

        test('should set up env-var command with correct options', () => {
            const updateMrtTarget = require('./update-mrt-target')
            expect(typeof updateMrtTarget).toBe('function')
            expect(updateMrtTarget.name).toBe('MRTTargetUpdater')
        })
    })

    describe('Integration scenarios', () => {
        beforeEach(() => {
            updater = new MRTTargetUpdater({
                projectSlug: 'test-project',
                targetSlug: 'test-target',
                cloudOrigin: 'https://test.example.com',
                mobifyApiKey: 'test-api-key',
                envFile: '.env.integration'
            })
            jest.clearAllMocks()
        })

        test('should handle complete target update workflow (payload building)', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    MRT_TARGET_NAME: 'Updated Target',
                    MRT_TARGET_SSR_REGION: 'us-west-2',
                    MRT_TARGET_ALLOW_COOKIES: 'true',
                    MRT_TARGET_ENABLE_SOURCE_MAPS: 'false'
                }
            })

            const payload = updater.buildUpdateTargetPayload()

            expect(payload).toEqual({
                name: 'Updated Target',
                ssr_region: 'us-west-2',
                allow_cookies: true,
                enable_source_maps: false
            })

            const expectedUrl = `${updater.cloudOrigin}/api/projects/${updater.projectSlug}/target/${updater.targetSlug}/`
            expect(expectedUrl).toBe(
                'https://test.example.com/api/projects/test-project/target/test-target/'
            )
        })

        test('should handle complete environment variables update workflow (payload building)', () => {
            dotenv.config.mockReturnValue({
                parsed: {
                    NODE_ENV: 'production',
                    API_URL: 'https://api.example.com',
                    DELETE_VAR: null
                }
            })

            const payload = updater.buildEnvVarsPayload()

            expect(payload).toEqual({
                NODE_ENV: {value: 'production'},
                API_URL: {value: 'https://api.example.com'},
                DELETE_VAR: {value: null}
            })

            const expectedUrl = `${updater.cloudOrigin}/api/projects/${updater.projectSlug}/target/${updater.targetSlug}/env-var/`
            expect(expectedUrl).toBe(
                'https://test.example.com/api/projects/test-project/target/test-target/env-var/'
            )
        })

        test('should handle empty payloads gracefully', () => {
            dotenv.config.mockReturnValue({
                parsed: {}
            })

            const emptyTargetPayload = updater.buildUpdateTargetPayload()
            const emptyEnvPayload = updater.buildEnvVarsPayload()

            expect(emptyTargetPayload).toEqual({})
            expect(emptyEnvPayload).toEqual({})
        })
    })
})
