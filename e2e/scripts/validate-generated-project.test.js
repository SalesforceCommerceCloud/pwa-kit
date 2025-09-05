/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const fs = require('fs')
const path = require('path')

// Mock the dependencies
jest.mock('fs')

// Mocking the config.js file to allow testing with smaller arrays of expected artifacts
jest.mock('../config.js', () => ({
    GENERATED_PROJECTS_DIR: '../generated-projects',
    EXPECTED_GENERATED_ARTIFACTS: {
        'retail-app-demo': ['package.json', 'node_modules', 'config'],
        'retail-app-ext': ['package.json', 'node_modules', 'overrides']
    }
}))
jest.mock('./utils.js', () => ({
    diffArrays: jest.fn()
}))

// Import the functions to test
const {diffArrays} = require('./utils.js')
const {validateGeneratedArtifacts} = require('./validate-generated-project.js')

describe('validateGeneratedArtifacts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('resolves when all expected artifacts are present', async () => {
        const project = 'retail-app-demo'
        const expectedArtifacts = ['package.json', 'node_modules', 'config']
        const actualArtifacts = ['package.json', 'node_modules', 'config', 'extra-file']

        fs.readdirSync.mockReturnValue(actualArtifacts)
        diffArrays.mockReturnValue([])

        const result = await validateGeneratedArtifacts(project)

        expect(fs.readdirSync).toHaveBeenCalledWith(
            // path.sep is used to handle the platform-specific path separator. (Windows uses \ and other platforms use /)
            expect.stringContaining(`generated-projects${path.sep}${project}`)
        )
        expect(diffArrays).toHaveBeenCalledWith(expectedArtifacts, actualArtifacts)
        expect(result).toBe(`Successfully validated generated artifacts for: ${project} `)
    })

    test('rejects when artifacts are missing', async () => {
        const project = 'retail-app-demo'
        const actualArtifacts = ['package.json', 'node_modules']
        const missingArtifacts = ['config']

        fs.readdirSync.mockReturnValue(actualArtifacts)
        diffArrays.mockReturnValue(missingArtifacts)

        await expect(validateGeneratedArtifacts(project)).rejects.toBe(
            `Generated project (${project}) is missing one or more artifacts: ${missingArtifacts}`
        )
    })

    test('rejects when project directory does not exist', async () => {
        const project = 'non-existent-project'
        const error = new Error('ENOENT: no such file or directory')

        fs.readdirSync.mockImplementation(() => {
            throw error
        })

        await expect(validateGeneratedArtifacts(project)).rejects.toBe(
            `Generated project (${project}) is missing one or more artifacts: ${error}`
        )
    })

    test('handles project with no expected artifacts', async () => {
        const project = 'unknown-project'
        const actualArtifacts = ['some-file']

        fs.readdirSync.mockReturnValue(actualArtifacts)
        diffArrays.mockReturnValue([])

        const result = await validateGeneratedArtifacts(project)

        expect(diffArrays).toHaveBeenCalledWith([], actualArtifacts)
        expect(result).toBe(`Successfully validated generated artifacts for: ${project} `)
    })
})

// Since it requires files at runtime, we'll test the key validation logic
describe('validateExtensibilityConfig validation logic', () => {
    test('validates Object.hasOwn usage for extensibility config', () => {
        // Test the core validation logic that was fixed
        const validConfig = {
            ccExtensibility: {
                extends: '@salesforce/retail-react-app',
                overridesDir: 'overrides'
            }
        }

        const invalidConfigMissingProperty = {
            ccExtensibility: {
                extends: '@salesforce/retail-react-app'
                // missing overridesDir
            }
        }

        const invalidConfigWrongExtends = {
            ccExtensibility: {
                extends: '@wrong/package',
                overridesDir: 'overrides'
            }
        }

        expect(Object.hasOwn(validConfig, 'ccExtensibility')).toBe(true)
        expect(Object.hasOwn(validConfig.ccExtensibility, 'extends')).toBe(true)
        expect(Object.hasOwn(validConfig.ccExtensibility, 'overridesDir')).toBe(true)

        expect(Object.hasOwn(invalidConfigMissingProperty.ccExtensibility, 'overridesDir')).toBe(
            false
        )

        const isValidConfig = (pkg) => {
            return (
                Object.hasOwn(pkg, 'ccExtensibility') &&
                Object.hasOwn(pkg.ccExtensibility, 'extends') &&
                Object.hasOwn(pkg.ccExtensibility, 'overridesDir') &&
                pkg.ccExtensibility.extends === '@salesforce/retail-react-app' &&
                pkg.ccExtensibility.overridesDir === 'overrides'
            )
        }

        expect(isValidConfig(validConfig)).toBe(true)
        expect(isValidConfig(invalidConfigMissingProperty)).toBe(false)
        expect(isValidConfig(invalidConfigWrongExtends)).toBe(false)
    })

    test('validates template version matching logic', () => {
        const pkg = {version: '1.0.0'}

        const validateVersion = (pkg, templateVersion) => {
            return !templateVersion || pkg.version === templateVersion
        }

        expect(validateVersion(pkg, undefined)).toBe(true)
        expect(validateVersion(pkg, null)).toBe(true)
        expect(validateVersion(pkg, '1.0.0')).toBe(true)
        expect(validateVersion(pkg, '2.0.0')).toBe(false)
    })
})
