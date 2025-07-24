/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const {Volume} = require('memfs')
const {execSync} = require('child_process')

// Mock plugin config to simulate different plugin states
let mockedPluginConfig = {
    SFDC_EXT_featureA: {
        description: 'Feature A'
    },
    SFDC_EXT_featureB: {
        description: 'Feature B'
    }
}

jest.mock('../assets/plugin-config', () => ({
    plugins: mockedPluginConfig
}))

jest.mock('child_process')

// Test data constants
const TEST_CODES = {
    BASIC_COMPONENT: `
        import loadable from '@loadable/component'
        const ComponentA = SFDC_EXT_featureA && loadable(() => import('./featureAComponent'))
        const ComponentB = SFDC_EXT_featureB && loadable(() => import('./featureBComponent'))
    `,
    BASIC_COMPONENT_TRIMMED: `
        import loadable from '@loadable/component'
        const ComponentA = loadable(() => import('./featureAComponent'))
    `,
    COMPONENT_A: `export default ComponentA`,
    COMPONENT_B: `export default ComponentB`,
    FEATURE_B_PAGE: `export const FeatureBPage = 'FeatureBPage'`,
    COMPONENT_B_WITH_PAGE_REF: `
        const pageB = SFDC_EXT_featureB && loadable(() => import('../../pages/featureBPage'))
        export default ComponentB
    `,
    COMPONENT_B_WITH_PAGE_REF_TRIMMED: `export default ComponentB`,
    FEATURE_B_PAGE_WITH_COMPONENT_REF: `
        const ComponentB = SFDC_EXT_featureB && loadable(() => import('../../components/featureBComponent'))
        export const FeatureBPage = 'FeatureBPage'
    `,
    FEATURE_B_PAGE_WITH_COMPONENT_REF_TRIMMED: `export const FeatureBPage = 'FeatureBPage'`
}

// In-memory file system
let vol

// Helper to create in-memory file system with test files
const createTestFileSystem = (fileContents = {}) => {
    vol = new Volume()

    // Default file structure, this is the file system starting point for every unit test cases in this file
    const defaultFiles = {
        '/mock/dir/src/components/featureComponent.jsx':
            fileContents.featureComponent || TEST_CODES.BASIC_COMPONENT,
        '/mock/dir/src/components/featureAComponent/index.jsx':
            fileContents.featureAComponent || TEST_CODES.COMPONENT_A,
        '/mock/dir/src/components/featureBComponent/index.jsx':
            fileContents.featureBComponent || TEST_CODES.COMPONENT_B,
        '/mock/dir/src/pages/featureBPage/index.jsx':
            fileContents.featureBPage || TEST_CODES.FEATURE_B_PAGE,
        ...(fileContents.additional || {})
    }

    vol.fromJSON(defaultFiles)

    // Mock fs module with memfs volume
    jest.doMock('fs', () => vol)

    return vol
}

// Helper to read file content from memory
const readFile = (filePath) => {
    try {
        return vol.readFileSync(filePath, 'utf8')
    } catch (error) {
        return null
    }
}

// Helper to check if file exists
const fileExists = (filePath) => {
    try {
        vol.statSync(filePath)
        return true
    } catch (error) {
        return false
    }
}

// Mock console methods
const mockConsole = (method = 'error') => {
    const spy = jest.spyOn(console, method).mockImplementation(() => jest.fn())
    return spy
}

// Custom matcher to compare strings line by line with trimming
expect.extend({
    toEqualTrimmedLines(received, expected) {
        const clean = (str) =>
            str
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)

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

describe('trim-extensions without config', () => {
    beforeEach(() => {
        jest.resetModules()
        createTestFileSystem()
    })

    it('returns early if no plugins is defined', () => {
        // mock empty plugin config
        jest.doMock('../assets/plugin-config', () => ({
            plugins: {}
        }))

        const trimExtensions = require('./trim-extensions')
        const consoleSpy = mockConsole('log')

        trimExtensions('/mock/dir', {})

        expect(console.log).toHaveBeenCalledWith('No plugins found, skipping trim')
        consoleSpy.mockRestore()
    })
})

describe('trim-extensions with nested directories', () => {
    let trimExtensions

    beforeEach(() => {
        jest.resetModules()
        jest.resetAllMocks()

        // Ensure the original mock is restored
        jest.doMock('../assets/plugin-config', () => ({
            plugins: mockedPluginConfig
        }))

        // Create file system with nested structure
        createTestFileSystem({
            additional: {
                '/mock/dir/src/route.jsx': `const storeLocatorPage = SFDC_EXT_featureA && loadable(() => import('./pages/store-locator'))`,
                '/mock/dir/src/pages/store-locator/index.jsx': `import { Modal } from './partial/modal' 
                    export default StoreLocator = 'StoreLocatorModal'`,
                '/mock/dir/src/pages/store-locator/partial/modal.jsx': `export const StoreLocator = 'StoreLocatorModal'`
            }
        })

        trimExtensions = require('./trim-extensions')
        execSync.mockReturnValue(true)
    })

    it('recursively removes unused directories', () => {
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        // Check that the store-locator directory was removed
        expect(fileExists('/mock/dir/src/pages/store-locator')).toBe(false)
        expect(fileExists('/mock/dir/src/pages/store-locator/index.jsx')).toBe(false)
        expect(fileExists('/mock/dir/src/pages/store-locator/partial/modal.jsx')).toBe(false)
    })
})

describe('trim-extensions', () => {
    let trimExtensions

    beforeEach(() => {
        jest.resetModules()
        jest.resetAllMocks()
        createTestFileSystem()
        trimExtensions = require('./trim-extensions')
        execSync.mockReturnValue(true)
    })

    it('leaves code untouched if no plugins are referenced', () => {
        const code = `
        const test = () => {
            const featureA = SFDC_EXT_featureA && 'Feature A';
            const categories = flatten(categoriesTree || {}, 'categories');
            const currency = locale.preferredCurrency || l10n.defaultCurrency;
            return [locale?.id || appConfig.defaultAppLocale];
        };
        `

        const expected = `
        const test = () => {
            const categories = flatten(categoriesTree || {}, 'categories');
            const currency = locale.preferredCurrency || l10n.defaultCurrency;
            return [locale?.id || appConfig.defaultAppLocale];
        };
        `

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
    })

    it('handles OR operator correctly', () => {
        const code = `const feature = (SFDC_EXT_featureA || SFDC_EXT_featureB) && 'Feature Enabled';`

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines("const feature = 'Feature Enabled';")
    })

    it('handles variable declarations correctly', () => {
        const code = `const featureAFunc = SFDC_EXT_featureA && (() => 'Feature A');
            const featureBFunc = SFDC_EXT_featureB && (() => 'Feature B');
        `

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines("const featureAFunc = () => 'Feature A';")
        expect(result).not.toContain("const featureBFunc = () => 'Feature B';")
    })

    it('handles variable with ternary expressions correctly when true', () => {
        const code = `const showFeature = SFDC_EXT_featureA ? Feature_A : Feature_B;`

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines('const showFeature = Feature_A;')
        expect(result).not.toContain('Feature_B')
    })

    it('handles variable with ternary expressions correctly when false', () => {
        const code = `const showFeature = SFDC_EXT_featureA ? Feature_A : Feature_B;`

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines('const showFeature = Feature_B;')
        expect(result).not.toContain('Feature_A')
    })

    it('handles return with ternary expressions correctly', () => {
        const code = `
            function test() {
                return SFDC_EXT_featureA ? Feature_A : Feature_B;
            }
        `

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        const expected = `
            function test() {
                return Feature_A;
            }
        `
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
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

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

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
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
        expect(result).not.toContain('featureBProp: PropTypes.string')
    })

    it('handles ternary expressions in return statements correctly', () => {
        const code = `
            function test() {
                return SFDC_EXT_featureA ? "componentA" : "componentB";
            }
        `

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        const expected = `
            function test() {
                return "componentB";
            }
        `
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
        expect(result).not.toContain('componentA')
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

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        const expected = `
            function test() {
                return (
                    <div>
                        <ComponentA />
                    </div>);
            }
        `
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
        expect(result).not.toContain('<ComponentB />')
    })

    it('does not remove referenced imports', () => {
        const code = `import { FeatureA } from './featureAComponent'`

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        // FeatureA component should still exist since it's referenced
        expect(fileExists('/mock/dir/src/components/featureAComponent')).toBe(true)
        expect(fileExists('/mock/dir/src/components/featureAComponent/index.jsx')).toBe(true)
    })

    it('removes unused loadable import file when no more references exist', () => {
        // component B with page ref to featureBPage
        vol.writeFileSync(
            '/mock/dir/src/components/featureBComponent/index.jsx',
            TEST_CODES.COMPONENT_B_WITH_PAGE_REF
        )
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        // FeatureA should remain (it's enabled)
        expect(fileExists('/mock/dir/src/components/featureAComponent')).toBe(true)

        // FeatureB should be removed (it's disabled and unused)
        expect(fileExists('/mock/dir/src/components/featureBComponent')).toBe(false)
        expect(fileExists('/mock/dir/src/pages/featureBPage')).toBe(false)
    })

    it('reports error when updating file fails', () => {
        const consoleSpy = mockConsole('error')

        // Create a read-only file to simulate write failure
        vol.writeFileSync(
            '/mock/dir/src/components/featureComponent.jsx',
            `const feature = SFDC_EXT_featureA ? Feature_A : Feature_B;`
        )
        vol.writeFileSync = (...args) => {
            throw new Error('Simulated write error')
        }

        try {
            trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        } catch (error) {
            // Expected to fail
        }

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error updating file'))
        consoleSpy.mockRestore()
    })

    it('removes separate unused directories when the only references are from each other', () => {
        // Set up files that reference each other but are both unused
        vol.writeFileSync(
            '/mock/dir/src/components/featureBComponent/index.jsx',
            TEST_CODES.COMPONENT_B_WITH_PAGE_REF
        )
        vol.writeFileSync(
            '/mock/dir/src/pages/featureBPage/index.jsx',
            TEST_CODES.FEATURE_B_PAGE_WITH_COMPONENT_REF
        )

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        // FeatureA should remain
        expect(fileExists('/mock/dir/src/components/featureAComponent')).toBe(true)

        // Both FeatureB component and page should be removed since they only reference each other
        expect(fileExists('/mock/dir/src/components/featureBComponent')).toBe(false)
        expect(fileExists('/mock/dir/src/pages/featureBPage')).toBe(false)
    })
})
