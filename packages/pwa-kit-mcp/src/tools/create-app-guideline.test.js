/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CreateAppGuidelinesTool from './create-app-guideline.js'
import {EmptyJsonSchema} from '../utils/utils'
import shell from 'shelljs'
import fs from 'fs'
import path from 'path'

// Mock dependencies
jest.mock('../utils/utils', () => {
    const originalModule = jest.requireActual('../utils/utils')
    const mockScriptPath = '../pwa-kit-create-app/scripts/create-mobify-app.js'

    return {
        ...originalModule,
        isMonoRepo: jest.fn(() => true),
        getCreateAppCommand: jest.fn(() => mockScriptPath),
        runCommand: jest.fn().mockResolvedValue(
            JSON.stringify({
                data: {},
                metadata: {description: 'CLI Description'},
                schemas: {}
            })
        )
    }
})

jest.mock('shelljs', () => ({
    which: jest.fn(),
    exec: jest.fn()
}))

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    writeFileSync: jest.fn()
}))

jest.mock('path', () => ({
    join: jest.fn()
}))

describe('CreateAppGuidelinesTool', () => {
    let tool
    let mockUtils

    beforeEach(() => {
        jest.clearAllMocks()
        tool = new CreateAppGuidelinesTool()
        mockUtils = require('../utils/utils')

        // Reset mocks
        shell.which.mockReset()
        shell.exec.mockReset()
        fs.existsSync.mockReset()
        fs.writeFileSync.mockReset()
        path.join.mockReset()
    })

    describe('Tool Structure', () => {
        it('should have correct structure', () => {
            expect(tool).toMatchObject({
                name: 'create_storefront_app',
                description: expect.stringContaining(
                    'Provide the agent with the instructions on how to use the @salesforce/pwa-kit-create-app CLI tool to create a new PWA Kit project.'
                ),
                inputSchema: EmptyJsonSchema,
                fn: expect.any(Function)
            })
        })

        it('should be instantiable', () => {
            expect(tool).toBeInstanceOf(CreateAppGuidelinesTool)
        })
    })

    describe('Main Functionality', () => {
        it('should return guidelines content when executed', async () => {
            const result = await tool.fn()

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: expect.stringContaining('PWA Kit Create App — Agent Usage Guidelines')
                    }
                ]
            })
        })

        it('should include all major sections in the guidelines', async () => {
            const result = await tool.fn()
            const guidelineText = result.content[0].text

            const requiredSections = [
                'Overview',
                'General Rules',
                'Creating a Project Using a Preset',
                'Creating a Project Using a Template',
                'Important Reminders'
            ]

            requiredSections.forEach((section) => {
                expect(guidelineText).toContain(section)
            })
        })

        it('should call runCommand with correct parameters', async () => {
            await tool.fn()

            expect(mockUtils.runCommand).toHaveBeenCalledWith('node', [
                '../pwa-kit-create-app/scripts/create-mobify-app.js',
                '--displayProgram'
            ])
        })
    })

    describe('Git Version Control', () => {
        const testDirectory = '/test/project/directory'

        beforeEach(() => {
            path.join.mockImplementation((...args) => args.join('/'))
        })

        describe('handleGitVersionControl', () => {
            it('should throw error if git is not installed', () => {
                shell.which.mockReturnValue(false)

                expect(() => {
                    tool.handleGitVersionControl(testDirectory)
                }).toThrow(
                    'git is not installed or not found in PATH. Please install git to initialize a repository.'
                )
            })

            it('should handle existing git repository correctly', () => {
                shell.which.mockReturnValue(true)
                fs.existsSync.mockReturnValue(true) // .git exists
                shell.exec.mockReturnValue({code: 0, stdout: '', stderr: ''})

                expect(() => {
                    tool.handleGitVersionControl(testDirectory)
                }).not.toThrow()

                expect(shell.exec).toHaveBeenCalledWith('git add .', {
                    cwd: testDirectory,
                    silent: true
                })
                expect(shell.exec).toHaveBeenCalledWith('git commit -m "Initial commit"', {
                    cwd: testDirectory,
                    silent: true
                })
                expect(shell.exec).not.toHaveBeenCalledWith('git init', expect.any(Object))
            })

            it('should handle new git repository correctly', () => {
                shell.which.mockReturnValue(true)
                fs.existsSync.mockReturnValue(false) // .git doesn't exist
                shell.exec.mockReturnValue({code: 0, stdout: '', stderr: ''})

                expect(() => {
                    tool.handleGitVersionControl(testDirectory)
                }).not.toThrow()

                expect(shell.exec).toHaveBeenCalledWith('git init', {
                    cwd: testDirectory,
                    silent: true
                })
                expect(shell.exec).toHaveBeenCalledWith('git add .', {
                    cwd: testDirectory,
                    silent: true
                })
                expect(shell.exec).toHaveBeenCalledWith('git commit -m "Initial commit"', {
                    cwd: testDirectory,
                    silent: true
                })
            })

            it('should throw error if git add fails', () => {
                shell.which.mockReturnValue(true)
                fs.existsSync.mockReturnValue(false)
                shell.exec
                    .mockReturnValueOnce({code: 0, stdout: '', stderr: ''}) // git init success
                    .mockReturnValueOnce({code: 1, stdout: '', stderr: 'git add failed'}) // git add fails

                expect(() => {
                    tool.handleGitVersionControl(testDirectory)
                }).toThrow('git add failed: git add failed')
            })

            it('should throw error if git commit fails', () => {
                shell.which.mockReturnValue(true)
                fs.existsSync.mockReturnValue(false)
                shell.exec
                    .mockReturnValueOnce({code: 0, stdout: '', stderr: ''}) // git init success
                    .mockReturnValueOnce({code: 0, stdout: '', stderr: ''}) // git add success
                    .mockReturnValueOnce({code: 1, stdout: '', stderr: 'git commit failed'}) // git commit fails

                expect(() => {
                    tool.handleGitVersionControl(testDirectory)
                }).toThrow('git commit failed: git commit failed')
            })

            it('should throw error if git init fails', () => {
                shell.which.mockReturnValue(true)
                fs.existsSync.mockReturnValue(false)
                shell.exec.mockReturnValue({code: 1, stdout: '', stderr: 'git init failed'})

                expect(() => {
                    tool.handleGitVersionControl(testDirectory)
                }).toThrow('git init failed: git init failed')
            })
        })

        describe('createBasicGitignore', () => {
            it('should create .gitignore file if it does not exist', () => {
                const gitignorePath = `${testDirectory}/.gitignore`
                fs.existsSync.mockReturnValue(false)

                tool.createBasicGitignore(testDirectory)

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    gitignorePath,
                    expect.stringContaining('# Node\nnode_modules/')
                )
            })

            it('should not create .gitignore file if it already exists', () => {
                const gitignorePath = `${testDirectory}/.gitignore`
                fs.existsSync.mockReturnValue(true)

                tool.createBasicGitignore(testDirectory)

                expect(fs.writeFileSync).not.toHaveBeenCalled()
            })

            it('should create .gitignore with correct content', () => {
                fs.existsSync.mockReturnValue(false)

                tool.createBasicGitignore(testDirectory)

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.stringContaining('# Node\nnode_modules/\n.env\n.DS_Store')
                )
            })
        })

        describe('setupVersionControl', () => {
            it('should return success when git operations complete successfully', async () => {
                shell.which.mockReturnValue(true)
                fs.existsSync.mockReturnValue(false)
                shell.exec.mockReturnValue({code: 0, stdout: '', stderr: ''})

                const result = await tool.setupVersionControl(testDirectory)

                expect(result).toEqual({
                    success: true,
                    message: 'Git version control initialized and committed locally.'
                })
            })

            it('should return error when git operations fail', async () => {
                shell.which.mockReturnValue(false)

                const result = await tool.setupVersionControl(testDirectory)

                expect(result).toEqual({
                    success: false,
                    message:
                        'Error: git is not installed or not found in PATH. Please install git to initialize a repository.'
                })
            })

            it('should handle errors gracefully and return error message', async () => {
                const errorMessage = 'Test error message'
                shell.which.mockReturnValue(true)
                fs.existsSync.mockReturnValue(false)
                shell.exec.mockImplementation(() => {
                    throw new Error(errorMessage)
                })

                const result = await tool.setupVersionControl(testDirectory)

                expect(result).toEqual({
                    success: false,
                    message: `Error: ${errorMessage}`
                })
            })
        })
    })

    describe('Error Handling', () => {
        it('should handle runCommand errors gracefully', async () => {
            const errorMessage = 'Command execution failed'
            mockUtils.runCommand.mockRejectedValue(new Error(errorMessage))

            await expect(tool.fn()).rejects.toThrow(errorMessage)
        })
    })
})

afterAll(() => {
    delete process.env.WORKSPACE_FOLDER_PATHS
})
