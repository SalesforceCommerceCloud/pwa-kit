/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'
import {toKebabCase, toPascalCase} from './utils'
import {z} from 'zod'

export const getCopyrightHeader = () => {
    const year = new Date().getFullYear()
    return `/*\n * Copyright (c) ${year}, Salesforce, Inc.\n * All rights reserved.\n * SPDX-License-Identifier: BSD-3-Clause\n * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause\n */`
}

class CreatePage {
    constructor() {
        this.currentStep = 0
        this.pageData = {
            name: null,
            route: null,
            location: null
        }
    }

    /**
     * Conversational handler for the create_page MCP tool.
     * @param {object} args - The tool arguments (sessionId, answer)
     * @param {object} serverInstance - The MCP server instance (for session management)
     */
    static async handleConversationalCreatePage(args = {}, serverInstance = {sessionCounter: 1, sessions: {}}) {
        let sessionId = args?.sessionId
        if (!sessionId) {
            sessionId = `session-create-page-${serverInstance.sessionCounter++}`
            serverInstance.sessions[sessionId] = {step: 1, answers: {}}
        }
        const session = serverInstance.sessions[sessionId]
        const {step, answers} = session
        const answer = args?.answer?.trim()
        switch (step) {
            case 1:
                return this._handlePageNameStep(session, answer, sessionId, serverInstance)
            case 2:
                return this._handlePageRouteStep(session, answer, sessionId, serverInstance)
            case 3:
                return await this._handlePageLocationStep(session, answer, sessionId, serverInstance)
            default:
                return this._handlePageDoneStep(sessionId, serverInstance)
        }
    }

    static _next(sessionId, instruction) {
        return {
            content: [{type: 'text', text: JSON.stringify({sessionId, instruction})}]
        }
    }

    static _done(sessionId, message) {
        return {
            content: [{type: 'text', text: JSON.stringify({sessionId, message})}]
        }
    }

    static _handlePageNameStep(session, answer, sessionId, serverInstance) {
        if (answer) {
            session.answers.pageName = answer
            session.step = 2
            return this._next(
                sessionId,
                'Ask user the page route to use. (e.g. /about, /contact). After user provides the page route, use create_page tool to continue.'
            )
        }
        return this._next(sessionId, 'Ask user the page name. After user provides the page name, use create_page tool to continue.')
    }

    static _handlePageRouteStep(session, answer, sessionId, serverInstance) {
        if (answer) {
            session.answers.pageRoute = answer
            session.step = 3
            const defaultDir = process.env.PWA_STOREFRONT_APP_PATH
                ? process.env.PWA_STOREFRONT_APP_PATH + '/pages'
                : '/pages'
            return this._next(
                sessionId,
                `Ask user the pages directory. User can answer yes to use the default pages directory (${defaultDir}), or specify the full absolute path to use a different directory. After user provides the pages directory, use create_page tool to continue.`
            )
        }
        return this._next(sessionId, 'Ask user the page route to use. (e.g. /about, /contact). After user provides the page route, use create_page tool to continue.')
    }

    static async _handlePageLocationStep(session, answer, sessionId, serverInstance) {
        const defaultDir = process.env.PWA_STOREFRONT_APP_PATH
            ? process.env.PWA_STOREFRONT_APP_PATH + '/pages'
            : '/pages'
        if (answer) {
            if (/^(yes|y|true|1)$/i.test(answer)) {
                session.answers.location = defaultDir
            } else {
                session.answers.location = answer
            }
            // Now create the page
            const tool = new CreatePage()
            tool.pageData = {
                name: session.answers.pageName,
                route: session.answers.pageRoute,
                location: session.answers.location
            }
            const result = await tool.createPage()
            session.step = 99
            return this._done(sessionId, `${result}\nPage creation flow complete.`)
        }
        return this._next(
            sessionId,
            `Ask user the pages directory. User can answer yes to use the default pages directory (${defaultDir}), or specify the full absolute path to use a different directory. After user provides the pages directory, use create_page tool to continue.`
        )
    }

    static _handlePageDoneStep(sessionId, serverInstance) {
        return this._done(sessionId, 'Page creation flow complete.')
    }

    /**
     * Creates the page based on all collected data
     * @returns {Promise<string>} The result of page creation
     */
    async createPage() {
        const messages = []
        const location = this.pageData.location
        const pageMessage = await this.createPageFile(this.pageData.name, location)
        messages.push(pageMessage)
        const routeMessage = await this.addRouteToRoutesFile(this.pageData.name, this.pageData.route)
        messages.push(routeMessage)
        messages.push("\n💡 After creating or modifying a page, run 'npm run lint -- --fix' to automatically fix formatting and linter issues.")
        this.reset()
        return messages.join('\n')
    }

    /**
     * Resets the tool state for the next page creation
     */
    reset() {
        this.currentStep = 0
        this.pageData = {
            name: null,
            route: null,
            location: null
        }
    }

    /**
     * Creates a new React page file.
     * @param {string} pageName - Name for the new page.
     * @param {string} projectDir - The absolute path to the project directory for the new page.
     */
    async createPageFile(pageName, projectDir) {
        const kebabDirName = toKebabCase(pageName)
        const pascalPageName = toPascalCase(pageName)
        const pageDir = path.join(projectDir, kebabDirName)
        try {
            await fs.mkdir(pageDir, {recursive: true})
            // Create page file
            const pageFilePath = path.join(pageDir, 'index.jsx')
            const codeToWrite = `${getCopyrightHeader()}
import React from 'react'

const ${pascalPageName} = () => <div>${pascalPageName} page</div>

export default ${pascalPageName}
`
            await fs.writeFile(pageFilePath, codeToWrite, 'utf-8')
            return `✅ Created ${pageFilePath}`
        } catch (err) {
            console.error('Error during file creation:', err)
            return `❌ Error creating page file at ${pageDir}: ${err.message}`
        }
    }

    /**
     * Adds a new route to the routes.jsx file
     * @param {string} pageName - Name for the new page.
     * @param {string} pageRoute - Route path for the new page.
     */
    async addRouteToRoutesFile(pageName, pageRoute) {
        // This assumes the main routes.jsx file is in a known location
        // You may want to make this configurable
        const routesFile = path.resolve(process.env.PWA_STOREFRONT_APP_PATH || '', 'routes.jsx')
        try {
            let content = await fs.readFile(routesFile, 'utf-8')
            const pascalPageName = toPascalCase(pageName)
            const kebabPageName = toKebabCase(pageName)

            // Compute the relative import path from routes.jsx to the new page directory
            const pageDir = path.join(this.pageData.location, kebabPageName)
            let relativeImportPath = path.relative(path.dirname(routesFile), pageDir)
            // Ensure the path uses forward slashes and starts with './' if not absolute
            if (!relativeImportPath.startsWith('./') && !relativeImportPath.startsWith('../')) {
                relativeImportPath = './' + relativeImportPath
            }
            relativeImportPath = relativeImportPath.replace(/\\/g, '/')

            const importStatement = `const ${pascalPageName} = loadable(() => import('${relativeImportPath}')` // partial for search
            const fullImportStatement = `const ${pascalPageName} = loadable(() => import('${relativeImportPath}'))`

            // 1. Insert import after last loadable import if not present
            if (!content.includes(importStatement)) {
                // Find all loadable import lines
                const loadableImportRegex = /const [A-Za-z0-9_]+ = loadable\(\(\) => import\('[^']+'\)(, \{fallback\})?\);?/g
                let lastMatch
                let match
                while ((match = loadableImportRegex.exec(content)) !== null) {
                    lastMatch = match
                }
                if (lastMatch) {
                    // Insert after last loadable import
                    const insertPos = lastMatch.index + lastMatch[0].length
                    content = content.slice(0, insertPos) + '\n' + fullImportStatement + content.slice(insertPos)
                } else {
                    // Fallback: insert after fallback declaration
                    const fallbackIdx = content.indexOf('const fallback')
                    if (fallbackIdx !== -1) {
                        const fallbackEnd = content.indexOf('\n', fallbackIdx)
                        content = content.slice(0, fallbackEnd + 1) + fullImportStatement + '\n' + content.slice(fallbackEnd + 1)
                    } else {
                        // Fallback: insert at top
                        content = fullImportStatement + '\n' + content
                    }
                }
            }

            // 2. Insert route before ..._routes or before closing ]
            // Build the new route object
            const newRouteWithComma = `    {\n        path: '${pageRoute}',\n        component: ${pascalPageName},\n        exact: true\n    },\n`
            const newRouteNoComma = `    {\n        path: '${pageRoute}',\n        component: ${pascalPageName},\n        exact: true\n    }\n`
            // Find the routes array
            const routesArrayRegex = /const routes = \[(.|\n)*?\]/m
            const matchRoutes = content.match(routesArrayRegex)
            if (matchRoutes) {
                let routesBlock = matchRoutes[0]
                // Check if route already exists
                if (!routesBlock.includes(`path: '${pageRoute}'`)) {
                    // Insert before ..._routes if present, else before closing ]
                    const spreadIdx = routesBlock.indexOf('..._routes')
                    if (spreadIdx !== -1) {
                        // Insert before ..._routes
                        const beforeSpread = routesBlock.slice(0, spreadIdx)
                        const afterSpread = routesBlock.slice(spreadIdx)
                        routesBlock = beforeSpread + newRouteWithComma + afterSpread
                    } else {
                        // Insert before closing ]
                        // Find the position of the last route object (before the closing ])
                        const lastObjMatch = Array.from(routesBlock.matchAll(/\{[\s\S]*?\}/g))
                        if (lastObjMatch.length > 0) {
                            const lastObj = lastObjMatch[lastObjMatch.length - 1]
                            const lastObjEnd = lastObj.index + lastObj[0].length
                            // Check if there's a comma after the last object before the closing ]
                            const afterLastObj = routesBlock.slice(lastObjEnd, routesBlock.length)
                            const hasComma = /^\s*,/.test(afterLastObj)
                            let newRoutesBlock = routesBlock
                            if (!hasComma) {
                                // Insert a comma after the last object
                                newRoutesBlock = routesBlock.slice(0, lastObjEnd) + ',' + routesBlock.slice(lastObjEnd)
                            }
                            // Now insert the new route before the closing ]
                            newRoutesBlock = newRoutesBlock.replace(/\n\]/, '\n' + newRouteNoComma + ']')
                            routesBlock = newRoutesBlock
                        } else {
                            // Fallback: just insert before closing ]
                            routesBlock = routesBlock.replace(/\n\]/, '\n' + newRouteNoComma + ']')
                        }
                    }
                    // Replace the old routes block in content
                    content = content.replace(routesArrayRegex, routesBlock)
                }
            }

            await fs.writeFile(routesFile, content, 'utf-8')
            return `✅ Added route '${pageRoute}' to ${routesFile}`
        } catch (err) {
            console.error('Error updating routes file:', err)
            return `❌ Error updating routes file: ${err.message}`
        }
    }
}

const CreatePageTool = {
    name: 'create_page',
    description: 'Conversationally collect parameters and create a new page with a route.',
    inputSchema: {
        sessionId: z.string().optional().describe('Session ID for the conversational flow'),
        answer: z.string().optional().describe('User answer to the current question')
    },
    fn: (args, serverInstance) => CreatePage.handleConversationalCreatePage(args, serverInstance)
}

export default CreatePageTool 
export { CreatePage } 