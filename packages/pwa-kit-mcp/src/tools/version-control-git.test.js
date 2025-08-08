/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import VersionControlGitTool from './version-control-git.js'
import shell from 'shelljs'
import os from 'os'
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

    it('returns error if git is not installed', async () => {
        jest.spyOn(shell, 'which').mockReturnValueOnce(false)
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/git is not installed/)
        shell.which.mockRestore()
    })

    it('returns error if run in home directory', async () => {
        jest.spyOn(os, 'homedir').mockReturnValueOnce(tempDir)
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/Do not run git init in your home directory/)
        os.homedir.mockRestore()
    })

    it('returns success message if git init is run in a temp directory', async () => {
        jest.spyOn(shell, 'which').mockReturnValue(true)
        jest.spyOn(shell, 'exec').mockImplementation(() => ({code: 0, stdout: '', stderr: ''}))
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/Git repository initialized/)
        shell.exec.mockRestore()
        shell.which.mockRestore()
    })

    it('returns error if git command fails', async () => {
        jest.spyOn(shell, 'which').mockReturnValue(true)
        jest.spyOn(shell, 'exec').mockImplementation(() => ({code: 1, stdout: '', stderr: 'fail'}))
        const result = await tool.handler({initGit: true, current_project_directory: tempDir})
        expect(result.content[0].text).toMatch(/git init failed|git add failed|git commit failed/)
        shell.exec.mockRestore()
        shell.which.mockRestore()
    })
})
