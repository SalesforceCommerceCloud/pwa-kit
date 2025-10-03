/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs'
import path from 'path'
import os from 'os'
let InstallAgentRulesTool

describe('InstallAgentRulesTool', () => {
    let tmpDir
    let mkdirSpy, copySpy, existsSpy, readFileSpy

    beforeEach(async () => {
        jest.clearAllMocks()
        tmpDir = path.join(os.tmpdir(), 'pwa-kit-mcp-test-mock')
        // Use require to spy on the same module instance used by the tool under test
        // Ensure the tool is loaded after spies are attached
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mkdirSpy = jest.spyOn(require('fs/promises'), 'mkdir').mockResolvedValue()
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        copySpy = jest.spyOn(require('fs/promises'), 'copyFile').mockResolvedValue()
        existsSpy = jest.spyOn(fs, 'existsSync')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        readFileSpy = jest.spyOn(require('fs/promises'), 'readFile')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        InstallAgentRulesTool = require('./install-agent-rules').default
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('has correct tool structure', () => {
        expect(InstallAgentRulesTool).toMatchObject({
            name: 'pwakit_install_agent_rules',
            description: expect.any(String),
            inputSchema: expect.any(Object),
            fn: expect.any(Function)
        })
    })

    it('copies rule when missing and reports installed path', async () => {
        existsSpy.mockImplementation((p) => {
            const s = String(p)
            if (s.includes('ai-instructions') && s.includes('pwa-kit-mcp.mdc')) return true
            if (s.includes(path.join('.cursor', 'rules', 'pwa-kit-mcp.mdc'))) return false
            return false
        })
        const result = await InstallAgentRulesTool.fn({projectRoot: tmpDir, hostAgent: 'cursor'})
        expect(mkdirSpy).toHaveBeenCalledWith(path.join(tmpDir, '.cursor', 'rules'), {
            recursive: true
        })
        expect(copySpy).toHaveBeenCalled()
        expect(result).toEqual({
            content: [{type: 'text', text: expect.stringContaining('Installed rule to')}]
        })
    })

    it('is idempotent when rule already exists', async () => {
        existsSpy.mockImplementation((p) => {
            const s = String(p)
            if (s.includes('ai-instructions') && s.includes('pwa-kit-mcp.mdc')) return true
            if (s.includes(path.join('.cursor', 'rules', 'pwa-kit-mcp.mdc'))) return true
            return false
        })
        // same contents
        readFileSpy.mockResolvedValueOnce('SRC').mockResolvedValueOnce('SRC')
        const result2 = await InstallAgentRulesTool.fn({projectRoot: tmpDir, hostAgent: 'cursor'})
        expect(mkdirSpy).toHaveBeenCalled()
        expect(copySpy).not.toHaveBeenCalled()
        expect(result2).toEqual({
            content: [
                {
                    type: 'text',
                    text: expect.stringContaining('Rule already installed')
                }
            ]
        })
    })

    it('when existing file differs, returns instruction to update rule contents', async () => {
        existsSpy.mockImplementation((p) => {
            const s = String(p)
            if (s.includes('ai-instructions') && s.includes('pwa-kit-mcp.mdc')) return true
            if (s.includes(path.join('.cursor', 'rules', 'pwa-kit-mcp.mdc'))) return true
            return false
        })
        readFileSpy.mockResolvedValueOnce('SRC').mockResolvedValueOnce('DEST-DIFFERENT')
        const result = await InstallAgentRulesTool.fn({projectRoot: tmpDir, hostAgent: 'cursor'})
        expect(copySpy).not.toHaveBeenCalled()
        expect(result.content[0].text).toMatch(
            /Use the file edit tools to add the following contents/i
        )
    })

    it('for non-cursor host, copies AGENTS.md to project root and does not mkdir rules', async () => {
        existsSpy.mockImplementation((p) => {
            const s = String(p)
            if (s.includes('ai-instructions') && s.includes('AGENTS.md')) return true
            if (s.endsWith(path.join(tmpDir, 'AGENTS.md'))) return false
            return false
        })
        const result = await InstallAgentRulesTool.fn({projectRoot: tmpDir, hostAgent: 'vscode'})
        expect(mkdirSpy).not.toHaveBeenCalled()
        expect(copySpy).toHaveBeenCalled()
        expect(result.content[0].text).toContain('Installed rule to')
        expect(result.content[0].text).toContain(path.join(tmpDir, 'AGENTS.md'))
    })

    it('returns an error message when projectRoot is missing', async () => {
        const result = await InstallAgentRulesTool.fn({})
        expect(result.content[0].text).toMatch(/Missing required argument: projectRoot/i)
        expect(mkdirSpy).not.toHaveBeenCalled()
        expect(copySpy).not.toHaveBeenCalled()
    })
})
