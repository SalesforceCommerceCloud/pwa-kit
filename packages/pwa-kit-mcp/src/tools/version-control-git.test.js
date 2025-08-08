/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import VersionControlGitTool from './version-control-git.js'
import shell from 'shelljs'
import fs from 'fs'
import path from 'path'

describe('VersionControlGitTool', () => {
    let tool
    const tempDir = path.join(__dirname, '__test_tmp__')
    beforeAll(() => {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
    })
    afterAll(() => {
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, {recursive: true, force: true})
    })
    beforeEach(() => {
        tool = new VersionControlGitTool()
    })

    it('returns empty content if args are missing', async () => {
        const result = await tool.handler()
        expect(result.content).toEqual([])
    })

    it('returns empty content if current_project_directory is missing', async () => {
        const result = await tool.handler({initGit: true})
        expect(result.content).toEqual([])
    })

    it('returns error if git is not installed', async () => {
        jest.spyOn(shell, 'which').mockReturnValueOnce(false)
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/git is not installed/)
        shell.which.mockRestore()
    })

    it('runs add/commit if already a git repo', async () => {
        jest.spyOn(shell, 'which').mockReturnValue(true)
        jest.spyOn(fs, 'existsSync').mockImplementation((p) => p.endsWith('.git'))
        jest.spyOn(shell, 'exec').mockImplementation(() => ({code: 0, stdout: '', stderr: ''}))
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/Git repository initialized/)
        shell.exec.mockRestore()
        shell.which.mockRestore()
        fs.existsSync.mockRestore()
    })

    it('runs full flow if not a git repo', async () => {
        jest.spyOn(shell, 'which').mockReturnValue(true)
        jest.spyOn(fs, 'existsSync').mockReturnValue(false)
        jest.spyOn(shell, 'exec').mockImplementation(() => ({code: 0, stdout: '', stderr: ''}))
        jest.spyOn(tool, 'createBasicGitignore').mockImplementation(() => {})
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/Git repository initialized/)
        shell.exec.mockRestore()
        shell.which.mockRestore()
        fs.existsSync.mockRestore()
        tool.createBasicGitignore.mockRestore()
    })

    it('returns error if git command fails', async () => {
        jest.spyOn(shell, 'which').mockReturnValue(true)
        jest.spyOn(fs, 'existsSync').mockReturnValue(false)
        jest.spyOn(shell, 'exec').mockImplementation(() => ({code: 1, stdout: '', stderr: 'fail'}))
        jest.spyOn(tool, 'createBasicGitignore').mockImplementation(() => {})
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/git init failed|git add failed|git commit failed/)
        shell.exec.mockRestore()
        shell.which.mockRestore()
        fs.existsSync.mockRestore()
        tool.createBasicGitignore.mockRestore()
    })
})
