/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const {execSync} = require('child_process')
const path = require('path')

jest.mock('../assets/plugin-config', () => ({
    plugins: {
        SFDC_EXT_featureA: {
            description: 'Feature A'
        },
        SFDC_EXT_featureB: {
            description: 'Feature B'
        }
    }
}))

jest.mock('fs')
jest.mock('child_process')

// custom matcher to compare strings line by line with trimming
expect.extend({
    toEqualTrimmedLines(received, expected) {
        const clean = (str) =>
            str
                .split('\n')
                .map((line) => line.trim()) // Trim each line
                .filter((line) => line.length > 0) // Optional: remove empty lines

        const receivedLines = clean(received)
        const expectedLines = clean(expected)

        const pass = this.equals(receivedLines, expectedLines)

        if (pass) {
            return {
                pass: true,
                message: () =>
                    `✅ Expected strings not to match line by line (but they did).\n\nExpected: ${this.utils.printExpected(
                        expectedLines
                    )}\nReceived: ${this.utils.printReceived(receivedLines)}`
            }
        } else {
            return {
                pass: false,
                message: () =>
                    `❌ Expected strings to match line by line (with trimming).\n\nExpected: ${this.utils.printExpected(
                        expectedLines
                    )}\nReceived: ${this.utils.printReceived(receivedLines)}`
            }
        }
    }
})

const trimExtensions = require('./trim-extensions')

describe('trim-extensions', () => {
    beforeEach(() => {
        fs.readdirSync.mockReturnValue([
            '/src/components/featureComponent.jsx',
            '/src/components/featureAComponent/index.jsx',
            '/src/components/featureBComponent/index.jsx'
        ])
        fs.statSync.mockReturnValue({isDirectory: () => false})
        fs.existsSync.mockImplementation((filePath) => {
            if (filePath.includes('featureAComponent') || filePath.includes('featureBComponent')) {
                if (
                    filePath.endsWith('.jsx') ||
                    filePath.endsWith('.tsx') ||
                    filePath.endsWith('.js') ||
                    filePath.endsWith('.ts')
                ) {
                    return false
                } else {
                    return true
                }
            } else {
                return true
            }
        })
        fs.unlinkSync.mockReturnValue(true)
        execSync.mockReturnValue(true)
    })

    it('handles OR operator correctly', () => {
        const code = `const feature = (SFDC_EXT_featureA || SFDC_EXT_featureB) && 'Feature Enabled';`
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                return code
            } else {
                return ''
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines("const feature = 'Feature Enabled';")
        )
        expect(execSync).toHaveBeenCalledWith(
            `npx prettier --write ${path.join(
                '/mock',
                'dir',
                'src',
                'components',
                'featureComponent.jsx'
            )}`
        )
    })

    it('handles variable declarations correctly', () => {
        const code = `const featureAFunc = SFDC_EXT_featureA && (() => 'Feature A');
            const featureBFunc = SFDC_EXT_featureB && (() => 'Feature B');
        `
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                return code
            } else {
                return ''
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines("const featureAFunc = () => 'Feature A';")
        )
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.not.stringContaining("const featureBFunc = () => 'Feature B';")
        )
        expect(execSync).toHaveBeenCalledWith(
            `npx prettier --write ${path.join(
                '/mock',
                'dir',
                'src',
                'components',
                'featureComponent.jsx'
            )}`
        )
    })

    it('handles variable with ternary expressions correctly', () => {
        const code = `const showFeature = SFDC_EXT_featureA ? Feature_A : Feature_B;`
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                return code
            } else {
                return ''
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines('const showFeature = Feature_A;')
        )
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.not.stringContaining('const showFeature = Feature_B')
        )
        expect(execSync).toHaveBeenCalledWith(
            `npx prettier --write ${path.join(
                '/mock',
                'dir',
                'src',
                'components',
                'featureComponent.jsx'
            )}`
        )
    })

    it('handles return with ternary expressions correctly', () => {
        const code = `
            function test() {
                return SFDC_EXT_featureA ? Feature_A : Feature_B;
            }
        `
        fs.readFileSync.mockReturnValue(code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        const expected = `
            function test() {
                return Feature_A;
            }
        `
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines(expected)
        )
        expect(execSync).toHaveBeenCalledWith(
            `npx prettier --write ${path.join(
                '/mock',
                'dir',
                'src',
                'components',
                'featureComponent.jsx'
            )}`
        )
    })

    it('handles PropTypes declarations correctly', () => {
        const code = `
            MyClass.PropTypes = {
                name: PropTypes.string,
                description: PropTypes.string
            };
            SFDC_EXT_featureA && (MyClass.PropType = {
                ...MyClass.PropType,
                featureAProp: PropTypes.string
            });
            SFDC_EXT_featureB && (MyClass.PropType = {
                ...MyClass.PropType,
                featureBProp: PropTypes.string
            });
        `
        fs.readFileSync.mockReturnValue(code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        const expected = `
            MyClass.PropTypes = {
                name: PropTypes.string,
                description: PropTypes.string
            };
            MyClass.PropType = {
                ...MyClass.PropType,
                featureAProp: PropTypes.string
            };
        `
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines(expected)
        )
        expect(fs.writeFileSync).not.toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('featureBProp: PropTypes.string')
        )
        expect(execSync).toHaveBeenCalledWith(
            `npx prettier --write ${path.join(
                '/mock',
                'dir',
                'src',
                'components',
                'featureComponent.jsx'
            )}`
        )
    })

    it('handles JSX elements in return statements correctly', () => {
        const code = `
            function test() {
                return (
                    <div>
                        {SFDC_EXT_featureA && <ComponentA />}
                        {SFDC_EXT_featureB && <ComponentB />}
                    </div>
                );
            }
        `
        fs.readFileSync.mockReturnValue(code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        const expected = `
            function test() {
                return (
                    <div>
                        <ComponentA />
                    </div>);
            }
        `
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines(expected)
        )
        expect(fs.writeFileSync).not.toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('<ComponentB />')
        )
        expect(execSync).toHaveBeenCalledWith(
            `npx prettier --write ${path.join(
                '/mock',
                'dir',
                'src',
                'components',
                'featureComponent.jsx'
            )}`
        )
    })

    it('does not remove referenced imports', () => {
        const code = `
            import { FeatureA } from './featureAComponent'
        `
        const featureAComponentCode = `
            export const FeatureA = 'FeatureA'
        `
        const featureBComponentCode = `
            export const FeatureB = 'FeatureB'
        `
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                return code
            } else if (filePath.includes('featureAComponent')) {
                return featureAComponentCode
            } else if (filePath.includes('featureBComponent')) {
                return featureBComponentCode
            } else {
                console.error('Unhandled file', filePath)
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        expect(fs.unlinkSync).not.toHaveBeenCalledWith(
            expect.stringContaining('src/components/featureAComponent')
        )
    })

    it('removes unused loadable import file when no more references exist', () => {
        const code = `
            import loadable from '@loadable/component'
            const ComponentA = SFDC_EXT_featureA && loadable(() => import('./featureAComponent'))
            const ComponentB = SFDC_EXT_featureB && loadable(() => import('./featureBComponent'))
        `

        const trimmedCode = `
            import loadable from '@loadable/component'
            const ComponentA = loadable(() => import('./featureAComponent'))
        `
        const componentACode = `
            export default ComponentA
        `
        const componentBCode = `
            export default ComponentB
        `

        let trimExtensionsCalled = false
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                if (!trimExtensionsCalled) {
                    trimExtensionsCalled = true
                    return code
                } else {
                    return trimmedCode
                }
            } else if (filePath.includes('featureAComponent')) {
                return componentACode
            } else if (filePath.includes('featureBComponent')) {
                return componentBCode
            } else {
                console.error('Unhandled file', filePath)
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expect(fs.unlinkSync).not.toHaveBeenCalledWith(expect.stringContaining('featureAComponent'))
        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('featureBComponent'))
    })

    it('reports error when delete permission is denied', () => {
        fs.unlinkSync.mockImplementation((filePath) => {
            if (filePath.includes('featureBComponent')) {
                const error = new Error('Permission denied')
                error.code = 'EPERM'
                throw error
            }
        })
        console.log = jest.fn()

        const code = `
            import loadable from '@loadable/component'
            const ComponentA = SFDC_EXT_featureA && loadable(() => import('./featureAComponent'))
            const ComponentB = SFDC_EXT_featureB && loadable(() => import('./featureBComponent'))
        `

        const trimmedCode = `
            import loadable from '@loadable/component'
            const ComponentA = loadable(() => import('./featureAComponent'))
        `
        const componentACode = `
            export default ComponentA
        `
        const componentBCode = `
            export default ComponentB
        `

        let trimExtensionsCalled = false
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                if (!trimExtensionsCalled) {
                    trimExtensionsCalled = true
                    return code
                } else {
                    return trimmedCode
                }
            } else if (filePath.includes('featureAComponent')) {
                return componentACode
            } else if (filePath.includes('featureBComponent')) {
                return componentBCode
            } else {
                console.error('Unhandled file', filePath)
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('featureBComponent'))

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining(
                '✗ Permission denied - cannot delete. You may need to run with sudo or check permissions.'
            )
        )
    })
})
