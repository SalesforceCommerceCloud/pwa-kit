/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig, getSiteConfig} from './ssr-config.server'

const env = process.env
const buildDirectory = `${__dirname}/mocks`
const SUPPORTED_FILE_TYPES = ['js', 'yml', 'yaml', 'json']
const ERROR_MESSAGE = [
    'Application configuration not found!',
    'Possible configuration file locations:'
]
const SEARCH_PLACES = {
    '@local:config': ['config/local', 'config/default', 'package.json'],

    '@local/dev:config': ['config/development', 'config/local', 'config/default', 'package.json'],

    '@remote:config': ['config/default', 'package.json'],

    '@remote/dev:config': ['config/development', 'config/default', 'package.json'],

    '@local:config/my-config': [
        'config/my-config.local',
        'config/my-config',
        'config/my-config/local',
        'config/my-config/default'
    ],

    '@local/dev:config/my-config': [
        'config/my-config.development',
        'config/my-config.local',
        'config/my-config',
        'config/my-config/development',
        'config/my-config/local',
        'config/my-config/default'
    ],

    '@remote:config/my-config': ['config/my-config', 'config/my-config/default'],

    '@remote/dev:config/my-config': [
        'config/my-config.development',
        'config/my-config',
        'config/my-config/development',
        'config/my-config/default'
    ],

    '@local:config/site-2': [
        'config/sites/site-2.local',
        'config/sites/site-2',
        'config/sites/site-2/local',
        'config/sites/site-2/default'
    ],

    '@local/dev:config/site-2': [
        'config/sites/site-2.development',
        'config/sites/site-2.local',
        'config/sites/site-2',
        'config/sites/site-2/development',
        'config/sites/site-2/local',
        'config/sites/site-2/default'
    ],

    '@remote:config/site-2': ['config/sites/site-2', 'config/sites/site-2/default'],

    '@remote/dev:config/site-2': [
        'config/sites/site-2.development',
        'config/sites/site-2',
        'config/sites/site-2/development',
        'config/sites/site-2/default'
    ]
}

/**
 * Gets config not found error message with possible search places
 *
 * @param {string} placeName
 *
 * @returns {string}
 */
function errorMessage(placeName) {
    return [...ERROR_MESSAGE, ...searchPlaces(placeName)].join('\n')
}

/**
 * Gets the possible search places for the given name
 *
 * @param {string} placeName
 *
 * @returns {string[]}
 */
function searchPlaces(placeName) {
    return SEARCH_PLACES[placeName].reduce((searchPlaces, configFile) => {
        if (configFile === 'package.json') {
            searchPlaces.push(configFile)
        } else {
            searchPlaces.push(...SUPPORTED_FILE_TYPES.map((ext) => `${configFile}.${ext}`))
        }

        return searchPlaces
    }, [])
}

/**
 * Gets fresh instances after calling `jest.resetModules()` and update envs
 *
 * @returns {{getConfig, getSiteConfig}}
 */
function getRemoteConfig() {
    process.env.AWS_LAMBDA_FUNCTION_NAME = ''

    return require('./ssr-config.server')
}

/**
 * Gets fresh instances after calling `jest.resetModules()` and update envs
 *
 * @returns {{getConfig, getSiteConfig}}
 */
function getDevConfig() {
    process.env.DEPLOY_TARGET = 'development'

    return require('./ssr-config.server')
}

/**
 * Gets fresh instances after calling `jest.resetModules()` and update envs
 *
 * @returns {{getConfig, getSiteConfig}}
 */
function getDevRemoteConfig() {
    process.env.DEPLOY_TARGET = 'development'
    process.env.AWS_LAMBDA_FUNCTION_NAME = ''

    return require('./ssr-config.server')
}

describe('Module `ssr-config.server.js`', () => {
    describe('Method `getConfig`', () => {
        beforeEach(() => {
            jest.resetModules()
            process.env = {...env}
        })

        afterEach(() => {
            process.env = env
        })

        test('throws when no config files are found running locally', () => {
            expect(getConfig).toThrow(errorMessage('@local:config'))
        })

        test('throws when no config files are found for a specific env running locally', () => {
            const {getConfig} = getDevConfig()

            expect(getConfig).toThrow(errorMessage('@local/dev:config'))
        })

        test('throws when no config files are found running remotely', () => {
            const {getConfig} = getRemoteConfig()

            expect(getConfig).toThrow(errorMessage('@remote:config'))
        })

        test('throws when no config files are found for a specific env running remotely', () => {
            const {getConfig} = getDevRemoteConfig()

            expect(getConfig).toThrow(errorMessage('@remote/dev:config'))
        })

        test('throws when no custom config files are found running locally', () => {
            expect(() => getConfig({configFile: 'config/my-config'})).toThrow(
                errorMessage('@local:config/my-config')
            )
        })

        test('throws when no custom config files are found for a specific env running locally', () => {
            const {getConfig} = getDevConfig()

            expect(() => getConfig({configFile: 'config/my-config'})).toThrow(
                errorMessage('@local/dev:config/my-config')
            )
        })

        test('throws when no custom config files are found running remotely', () => {
            const {getConfig} = getRemoteConfig()

            expect(() => getConfig({configFile: 'config/my-config'})).toThrow(
                errorMessage('@remote:config/my-config')
            )
        })

        test('throws when no custom config files are found for a specific env running remotely', () => {
            const {getConfig} = getDevRemoteConfig()

            expect(() => getConfig({configFile: 'config/my-config'})).toThrow(
                errorMessage('@remote/dev:config/my-config')
            )
        })

        test('resolve default config running locally', () => {
            expect(getConfig({buildDirectory})).toBe('config/local.js')
        })

        test('resolve default config for a specific env running locally', () => {
            const {getConfig} = getDevConfig()

            expect(getConfig({buildDirectory})).toBe('config/development.js')
        })

        test('resolve default config running remotely', () => {
            const {getConfig} = getRemoteConfig()

            expect(getConfig({buildDirectory})).toBe('config/default.js')
        })

        test('resolve default config for a specific env running remotely', () => {
            const {getConfig} = getDevRemoteConfig()

            expect(getConfig({buildDirectory})).toBe('config/development.js')
        })

        test('resolve custom config running locally', () => {
            expect(
                getConfig({
                    buildDirectory,
                    configFile: 'config/sites/site-1/my-service'
                })
            ).toBe('config/sites/site-1/my-service.local.js')
        })

        test('resolve custom config for a specific env running locally', () => {
            const {getConfig} = getDevConfig()

            expect(
                getConfig({
                    buildDirectory,
                    configFile: 'config/sites/site-1/my-service'
                })
            ).toBe('config/sites/site-1/my-service.development.js')
        })

        test('resolve custom config running remotely', () => {
            const {getConfig} = getRemoteConfig()

            expect(
                getConfig({
                    buildDirectory,
                    configFile: 'config/sites/site-1/my-service'
                })
            ).toBe('config/sites/site-1/my-service.js')
        })

        test('resolve custom config for a specific env running remotely', () => {
            const {getConfig} = getDevRemoteConfig()

            expect(
                getConfig({
                    buildDirectory,
                    configFile: 'config/sites/site-1/my-service'
                })
            ).toBe('config/sites/site-1/my-service.development.js')
        })
    })

    describe('Method `getSiteConfig`', () => {
        beforeEach(() => {
            jest.resetModules()
            process.env = {...env}
        })

        afterEach(() => {
            process.env = env
        })

        test('throws when no site found', () => {
            expect(() => getSiteConfig('site-2')).toThrow(errorMessage('@local:config/site-2'))
        })

        test('throws when no site config files are found running locally', () => {
            expect(() => getSiteConfig('site-2', {buildDirectory})).toThrow(
                errorMessage('@local:config/site-2')
            )
        })

        test('throws when no site config files are found for a specific env running locally', () => {
            const {getSiteConfig} = getDevConfig()

            expect(() => getSiteConfig('site-2', {buildDirectory})).toThrow(
                errorMessage('@local/dev:config/site-2')
            )
        })

        test('throws when no site config files are found running remotely', () => {
            const {getSiteConfig} = getRemoteConfig()

            expect(() => getSiteConfig('site-2', {buildDirectory})).toThrow(
                errorMessage('@remote:config/site-2')
            )
        })

        test('throws when no site config files are found for a specific env running remotely', () => {
            const {getSiteConfig} = getDevRemoteConfig()

            expect(() => getSiteConfig('site-2', {buildDirectory})).toThrow(
                errorMessage('@remote/dev:config/site-2')
            )
        })

        test('resolve default site config running locally', () => {
            expect(getSiteConfig('site-1', {buildDirectory})).toBe('config/sites/site-1/local.js')
        })

        test('resolve default site config for a specific env running locally', () => {
            const {getSiteConfig} = getDevConfig()

            expect(getSiteConfig('site-1', {buildDirectory})).toBe(
                'config/sites/site-1/development.js'
            )
        })

        test('resolve default site config running remotely', () => {
            const {getSiteConfig} = getRemoteConfig()

            expect(getSiteConfig('site-1', {buildDirectory})).toBe('config/sites/site-1/default.js')
        })

        test('resolve default site config for a specific env  running remotely', () => {
            const {getSiteConfig} = getDevRemoteConfig()

            expect(getSiteConfig('site-1', {buildDirectory})).toBe(
                'config/sites/site-1/development.js'
            )
        })

        test('resolve custom site config runing locally', () => {
            expect(getSiteConfig('site-1', {buildDirectory, configFile: 'my-service'})).toBe(
                'config/sites/site-1/my-service.local.js'
            )
        })

        test('resolve custom site config for a specific env runing locally', () => {
            const {getSiteConfig} = getDevConfig()

            expect(getSiteConfig('site-1', {buildDirectory, configFile: 'my-service'})).toBe(
                'config/sites/site-1/my-service.development.js'
            )
        })

        test('resolve custom site config runing remotely', () => {
            const {getSiteConfig} = getRemoteConfig()

            expect(getSiteConfig('site-1', {buildDirectory, configFile: 'my-service'})).toBe(
                'config/sites/site-1/my-service.js'
            )
        })

        test('resolve custom site config for a specific env runing remotely', () => {
            const {getSiteConfig} = getDevRemoteConfig()

            expect(getSiteConfig('site-1', {buildDirectory, configFile: 'my-service'})).toBe(
                'config/sites/site-1/my-service.development.js'
            )
        })
    })
})
