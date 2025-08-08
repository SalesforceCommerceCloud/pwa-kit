/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {z} from 'zod'
import shell from 'shelljs'
import fs from 'fs'
import path from 'path'

class VersionControlGitTool {
    name = 'version_control_git'
    description = 'Manages the version control using git'
    inputSchema = {
        initGit: z
            .boolean()
            .describe('Do you want to commit your files locally through git? (yes/no)'),
        current_project_directory: z
            .string()
            .describe(
                'The absolute path to the current working directory where git actions will be performed.'
            )
    }

    handler = async (args) => {
        try {
            if (!args || !args.initGit || !args.current_project_directory) {
                return {
                    role: 'system',
                    content: []
                }
            }
            const {initGit, current_project_directory} = args
            if (initGit) {
                this.handleGitVersionControl(current_project_directory)
                return {
                    role: 'system',
                    content: [
                        {
                            type: 'text',
                            text: 'Git repository initialized and initial commit created.'
                        }
                    ]
                }
            }
        } catch (error) {
            return {
                role: 'system',
                content: [{type: 'text', text: `Error: ${error.message}`}]
            }
        }
    }
    /**
     * Handles the version control of your project using git.
     * If the directory is not a git repo, it creates a basic .gitignore, runs git init, adds all files, and makes an initial commit.
     * If already a git repo, it skips initialization and .gitignore creation, and just adds and commits all files locally.
     * @param {string} directory - The directory to initialize the git repository in.
     */
    handleGitVersionControl(directory) {
        if (!shell.which('git')) {
            throw new Error(
                'git is not installed or not found in PATH. Please install git to initialize a repository.'
            )
        }
        const isGitRepo = fs.existsSync(path.join(directory, '.git'))
        let result
        if (isGitRepo) {
            // Already a git repo: only add and commit
            result = shell.exec('git add .', {cwd: directory, silent: true})
            if (result.code !== 0)
                throw new Error(`git add failed: ${result.stderr || result.stdout}`)
            result = shell.exec('git commit -m "Initial commit"', {cwd: directory, silent: true})
            if (result.code !== 0)
                throw new Error(`git commit failed: ${result.stderr || result.stdout}`)
        } else {
            // Not a git repo: create .gitignore, init, add, commit
            this.createBasicGitignore(directory)
            result = shell.exec('git init', {cwd: directory, silent: true})
            if (result.code !== 0)
                throw new Error(`git init failed: ${result.stderr || result.stdout}`)
            result = shell.exec('git add .', {cwd: directory, silent: true})
            if (result.code !== 0)
                throw new Error(`git add failed: ${result.stderr || result.stdout}`)
            result = shell.exec('git commit -m "Initial commit"', {cwd: directory, silent: true})
            if (result.code !== 0)
                throw new Error(`git commit failed: ${result.stderr || result.stdout}`)
        }
    }

    /**
     * Creates a basic .gitignore file in the given directory.
     * @param {string} directory - The directory to create the .gitignore file in.
     */
    createBasicGitignore(directory) {
        const gitignorePath = path.join(directory, '.gitignore')
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(
                gitignorePath,
                `# Node
node_modules/
.env
.DS_Store
npm-debug.log
yarn-debug.log
yarn-error.log
coverage/
dist/
build/
.next/
out/
logs/
*.log
.idea/
.vscode/
`
            )
        }
    }
}

export default VersionControlGitTool
