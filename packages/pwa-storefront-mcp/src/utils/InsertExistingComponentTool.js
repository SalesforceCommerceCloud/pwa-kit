/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'

export class InsertExistingComponentTool {
    /**
     * Insert a new React component into existing code
     */
    insertComponent(code, componentType, options = {}) {
        const analysis = this.analyzeCodeStructure(code)
        const componentGenerator = this.componentTemplates[componentType.toLowerCase()]

        if (!componentGenerator) {
            throw new Error(`Unknown component type: ${componentType}`)
        }

        const newComponent = componentGenerator.call(this, options, analysis)
        const insertionPoint = this.findBestInsertionPoint(analysis, options)

        return this.performInsertion(code, newComponent, insertionPoint, analysis)
    }

    /**
     * Insert an existing component by name into a page by name.
     * @param {string} pageName - The name of the page file (without extension)
     * @param {string} componentName - The name of the component to insert
     * @param {string} [pagesDir='src/pages']
     * @param {string} [componentsDir='src/components']
     */
    async insertComponentIntoPage(
        pageName,
        componentName,
        projectDir = 'template-retail-react-app',
        pagesDir = 'app/pages',
        componentsDir = 'app/components'
    ) {
        // Find the page file (support .js and .jsx)
        let pageFile = path.join(projectDir, pagesDir, `${pageName}.js`)
        componentsDir = path.join(projectDir, componentsDir)
        let pageFileAlt = path.join(projectDir, pagesDir, `${pageName}.jsx`)
        let pagePath = null
        try {
            await fs.access(pageFile)
            pagePath = pageFile
        } catch {
            try {
                await fs.access(pageFileAlt)
                pagePath = pageFileAlt
            } catch {
                throw new Error(`Page file not found: ${pageFile} or ${pageFileAlt}`)
            }
        }
        console.log('==== pagePath', pagePath)

        // Find the component file (support .js and .jsx)
        let compFile = `${componentsDir}/${componentName}/index.js`
        let compFileAlt = `${componentsDir}/${componentName}/index.jsx`

        try {
            await fs.access(compFile)
        } catch {
            try {
                await fs.access(compFileAlt)
            } catch {
                throw new Error(`Component file not found: ${compFile} or ${compFileAlt}`)
            }
        }

        // Read the page file
        let code = await fs.readFile(pagePath, 'utf-8')
        let lines = code.split('\n')
        let importStatement = `import ${componentName} from '../components/${componentName}';`
        let hasImport = lines.some(
            (line) =>
                line.includes(importStatement) ||
                (line.startsWith('import') &&
                    line.includes(componentName) &&
                    line.includes('components'))
        )

        // Insert import if not present (after last import)
        if (!hasImport) {
            let lastImportIdx = lines
                .map((l) => l.trim())
                .reduce((acc, l, i) => (l.startsWith('import') ? i : acc), -1)
            lines.splice(lastImportIdx + 1, 0, importStatement)
        }

        // Find the main component render output (assume function or arrow function component)
        let insertIdx = lines.findIndex((line) => /return \(/.test(line))
        if (insertIdx === -1) {
            throw new Error('Could not find a React return statement in the page.')
        }
        // Insert the component usage after the return (
        let indent = lines[insertIdx].match(/^\s*/)[0] + '  '
        lines.splice(insertIdx + 1, 0, `${indent}<${componentName} />`)

        // Write back the modified file
        await fs.writeFile(pagePath, lines.join('\n'), 'utf-8')
        return `✅ Inserted <${componentName} /> into ${pagePath}`
    }
}
