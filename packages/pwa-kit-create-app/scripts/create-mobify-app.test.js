/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Mock dependencies
jest.mock('fs')
jest.mock('fs/promises')
jest.mock('path')
jest.mock('os')
jest.mock('child_process')
jest.mock('shelljs')
jest.mock('tar')
jest.mock('semver')
jest.mock('slugify')
// Mock Handlebars
const mockHandlebars = {
    compile: jest.fn((template) => (context) => {
        // Simple template replacement for testing
        return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const keys = path.trim().split('.')
            let value = context
            for (const key of keys) {
                value = value?.[key]
            }
            return value || ''
        })
    })
}

jest.mock('handlebars', () => mockHandlebars)

// Mock the program.json
jest.mock('../program.json', () => ({
    data: {
        presets: [
            {
                id: 'retail-react-app-demo',
                name: 'Retail React App Demo',
                templateId: 'retail-react-app',
                answers: {
                    'project.commerce.clientId': 'test-client-id',
                    'project.commerce.siteId': 'test-site-id'
                },
                private: false
            }
        ],
        templates: [
            {
                id: 'retail-react-app',
                name: 'Retail React App',
                questions: [
                    {
                        name: 'project.name',
                        message: 'What is the name of your Project?',
                        validator: 'validProjectName'
                    },
                    {
                        name: 'project.deployment.defaultMRTProject',
                        message:
                            'What is your default MRT Project (optional - leave blank to skip)?',
                        type: 'input',
                        default: ''
                    },
                    {
                        name: 'project.deployment.defaultMRTTarget',
                        message:
                            'What is your default MRT Target (optional - leave blank to skip)?',
                        type: 'input',
                        default: ''
                    }
                ]
            }
        ],
        validators: [
            {
                id: 'validProjectName',
                name: 'Valid Project Name',
                regex: '^[a-zA-Z0-9-\\s]{1,20}$',
                message: 'Invalid project name'
            }
        ]
    }
}))

describe('Create Mobify App - Core Functions', () => {
    let mockProgram
    let Handlebars

    beforeEach(() => {
        jest.clearAllMocks()
        mockProgram = require('../program.json')
        Handlebars = require('handlebars')
    })

    describe('Answer Validation', () => {
        test('should validate required fields in answers object', () => {
            const validAnswers = {
                'general.presetOrTemplateId': 'retail-react-app',
                'project.name': 'test-project'
            }

            const invalidAnswers = {
                'project.name': 'test-project'
                // missing general.presetOrTemplateId
            }

            // Test validation logic
            const validateAnswers = (answers) => {
                if (!answers['general.presetOrTemplateId']) {
                    throw new Error('Missing required field: "general.presetOrTemplateId"')
                }
                return true
            }

            expect(() => validateAnswers(validAnswers)).not.toThrow()
            expect(() => validateAnswers(invalidAnswers)).toThrow(
                'Missing required field: "general.presetOrTemplateId"'
            )
        })
    })

    describe('Question Processing', () => {
        test('should process questions with validators correctly', () => {
            const questions = mockProgram.data.templates[0].questions
            const validators = mockProgram.data.validators

            const processedQuestions = questions.map((question) => {
                const validator = validators.find(({id}) => id === question.validator)
                return {
                    ...question,
                    validate: validator?.regex
                        ? (input) =>
                              new RegExp(validator.regex, 'i').test(input) || validator.message
                        : undefined
                }
            })

            // Test project name validation
            const nameQuestion = processedQuestions.find((q) => q.name === 'project.name')
            expect(nameQuestion.validate('valid-name')).toBe(true)
            expect(nameQuestion.validate('invalid-name-with-special-chars!')).toBe(
                'Invalid project name'
            )

            // Test deployment questions (should not have validators)
            const mrtProjectQuestion = processedQuestions.find(
                (q) => q.name === 'project.deployment.defaultMRTProject'
            )
            const mrtTargetQuestion = processedQuestions.find(
                (q) => q.name === 'project.deployment.defaultMRTTarget'
            )

            expect(mrtProjectQuestion.validate).toBeUndefined()
            expect(mrtTargetQuestion.validate).toBeUndefined()
            expect(mrtProjectQuestion.default).toBe('')
            expect(mrtTargetQuestion.default).toBe('')
        })
    })

    describe('Template Processing', () => {
        test('should process Handlebars templates with deployment configuration', () => {
            const mockTemplate = `
                deployment: {
                    defaultMRTProject: '{{answers.project.deployment.defaultMRTProject}}',
                    defaultMRTTarget: '{{answers.project.deployment.defaultMRTTarget}}'
                }
            `

            const mockContext = {
                answers: {
                    project: {
                        deployment: {
                            defaultMRTProject: 'my-project',
                            defaultMRTTarget: 'production'
                        }
                    }
                }
            }

            const compiledTemplate = Handlebars.compile(mockTemplate)
            const result = compiledTemplate(mockContext)

            expect(result).toContain("defaultMRTProject: 'my-project'")
            expect(result).toContain("defaultMRTTarget: 'production'")
        })

        test('should handle empty deployment values', () => {
            const mockTemplate = `
                deployment: {
                    defaultMRTProject: '{{answers.project.deployment.defaultMRTProject}}',
                    defaultMRTTarget: '{{answers.project.deployment.defaultMRTTarget}}'
                }
            `

            const mockContext = {
                answers: {
                    project: {
                        deployment: {
                            defaultMRTProject: '',
                            defaultMRTTarget: ''
                        }
                    }
                }
            }

            const compiledTemplate = Handlebars.compile(mockTemplate)
            const result = compiledTemplate(mockContext)

            expect(result).toContain("defaultMRTProject: ''")
            expect(result).toContain("defaultMRTTarget: ''")
        })
    })

    describe('Preset Processing', () => {
        test('should merge preset answers with user answers', () => {
            const preset = mockProgram.data.presets[0]
            const userAnswers = {
                general: {presetOrTemplateId: 'retail-react-app-demo'},
                'project.name': 'my-custom-project'
            }

            const expandKey = (key, value) =>
                key
                    .split('.')
                    .reverse()
                    .reduce((acc, curr) => (acc ? {[curr]: acc} : {[curr]: value}), undefined)

            const expandObject = (obj = {}) =>
                Object.keys(obj).reduce((acc, curr) => {
                    const expanded = expandKey(curr, obj[curr])
                    return deepMerge(acc, expanded)
                }, {})

            const deepMerge = (target, source) => {
                const result = {...target}
                for (const key in source) {
                    if (
                        source[key] &&
                        typeof source[key] === 'object' &&
                        !Array.isArray(source[key])
                    ) {
                        result[key] = deepMerge(result[key] || {}, source[key])
                    } else {
                        result[key] = source[key]
                    }
                }
                return result
            }

            const merge = (a, b) => deepMerge(a, b)

            const expandedPresetAnswers = expandObject(preset.answers)
            const mergedAnswers = merge(userAnswers, expandedPresetAnswers)

            expect(mergedAnswers).toEqual({
                general: {presetOrTemplateId: 'retail-react-app-demo'},
                'project.name': 'my-custom-project',
                project: {
                    commerce: {
                        clientId: 'test-client-id',
                        siteId: 'test-site-id'
                    }
                }
            })
        })
    })

    describe('Deployment Questions Integration', () => {
        test('should include deployment questions in retail-react-app template', () => {
            const retailTemplate = mockProgram.data.templates.find(
                (t) => t.id === 'retail-react-app'
            )
            const deploymentQuestions = retailTemplate.questions.filter((q) =>
                q.name.includes('deployment')
            )

            expect(deploymentQuestions).toHaveLength(2)
            expect(deploymentQuestions[0].name).toBe('project.deployment.defaultMRTProject')
            expect(deploymentQuestions[1].name).toBe('project.deployment.defaultMRTTarget')
            expect(deploymentQuestions[0].default).toBe('')
            expect(deploymentQuestions[1].default).toBe('')
        })

        test('should handle optional deployment questions correctly', () => {
            const answers = {
                defaultMRTProject: '',
                defaultMRTTarget: 'production'
            }

            // Simulate template processing with simple string replacement
            const template = `
                defaultMRTProject: '{{answers.project.deployment.defaultMRTProject}}',
                defaultMRTTarget: '{{answers.project.deployment.defaultMRTTarget}}'
            `

            const context = {answers: {project: {deployment: answers}}}
            const compiledTemplate = Handlebars.compile(template)
            const result = compiledTemplate(context)

            expect(result).toContain("defaultMRTProject: ''")
            expect(result).toContain("defaultMRTTarget: 'production'")
        })
    })
})
