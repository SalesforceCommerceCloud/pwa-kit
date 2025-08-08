/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const {Volume} = require('memfs')
const path = require('path')

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

// Test data constants
const TEST_CODES = {
    BASIC_COMPONENT: `
        // @sfdc-extension-line SFDC_EXT_featureA
        import ComponentA from './featureAComponent'
        // @sfdc-extension-line SFDC_EXT_featureB
        import ComponentB from './featureBComponent'
    `,
    BASIC_COMPONENT_TRIMMED: `
        import ComponentA from './featureAComponent'
    `,
    COMPONENT_A: `export default ComponentA`,
    COMPONENT_B: `export default ComponentB`,
    FEATURE_B_PAGE: `export const FeatureBPage = 'FeatureBPage'`,
    COMPONENT_B_WITH_PAGE_REF: `
        // @sfdc-extension-line SFDC_EXT_featureB
        const pageB = loadable(() => import('../../pages/featureBPage'))
        export default ComponentB
    `,
    COMPONENT_B_WITH_PAGE_REF_TRIMMED: `export default ComponentB`,
    FEATURE_B_PAGE_WITH_COMPONENT_REF: `
        // @sfdc-extension-line SFDC_EXT_featureB
        import ComponentB from '../../components/featureBComponent'
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
                '/mock/dir/src/route.jsx': `// @sfdc-extension-line SFDC_EXT_featureA
                import storeLocatorPage from './pages/store-locator'`,
                '/mock/dir/src/pages/store-locator/index.jsx': `import { Modal } from './partial/modal' 
                    export default StoreLocator = 'StoreLocatorModal'`,
                '/mock/dir/src/pages/store-locator/partial/modal.jsx': `export const StoreLocator = 'StoreLocatorModal'`
            }
        })

        trimExtensions = require('./trim-extensions')
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
    })

    it('leaves code untouched if no plugins are referenced', () => {
        const code = `
        const test = () => {
            // @sfdc-extension-line SFDC_EXT_featureA
            const featureA = 'Feature A';
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

    it('removes code blocks that are guarded by plugin flags', () => {
        const code = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar1 = 'Feature A variable 1';
            const featureAVar2 = 'Feature A variable 2';
            // @sfdc-extension-block-end SFDC_EXT_featureA
            const anotherVar = 'Another variable';
        `
        const expected = `
            const anotherVar = 'Another variable';
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
    })

    it('removes nested code blocks that are guarded by plugin flags', () => {
        const code = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar = 'Feature A variable 1';
            // @sfdc-extension-block-start SFDC_EXT_featureB
            const featureBVar = 'Feature B variable 1';
            // @sfdc-extension-block-end SFDC_EXT_featureB
            // @sfdc-extension-block-end SFDC_EXT_featureA
        `
        const expected = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar = 'Feature A variable 1';
            // @sfdc-extension-block-end SFDC_EXT_featureA
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
    })

    it('removes nested line that are guarded by plugin flags', () => {
        const code = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar = 'Feature A variable 1';
            // @sfdc-extension-line SFDC_EXT_featureB
            const featureBVar = 'Feature B variable 2';
            // @sfdc-extension-block-end SFDC_EXT_featureA
        `
        const expected = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar = 'Feature A variable 1';
            // @sfdc-extension-block-end SFDC_EXT_featureA
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
    })

    it('fails when mismatching block markers are found', () => {
        const code = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar = 'Feature A variable 1';
            // @sfdc-extension-block-end SFDC_EXT_featureB
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)
        const filePath = path.join(
            path.sep,
            'mock',
            'dir',
            'src',
            'components',
            'featureComponent.jsx'
        )
        expect(() =>
            trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        ).toThrow(
            `Block marker mismatch in ${filePath}, expected end marker for SFDC_EXT_featureA but got SFDC_EXT_featureB at line 3`
        )
    })

    it('fails when block marker is not closed', () => {
        const code = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar = 'Feature A variable 1';
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)
        const filePath = path.join(
            path.sep,
            'mock',
            'dir',
            'src',
            'components',
            'featureComponent.jsx'
        )
        expect(() => trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})).toThrow(
            `Unclosed end marker found in ${filePath}: SFDC_EXT_featureA`
        )
    })

    it('fails when start marker is missing', () => {
        const code = `
            // @sfdc-extension-block-end SFDC_EXT_featureA
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)
        const filePath = path.join(
            path.sep,
            'mock',
            'dir',
            'src',
            'components',
            'featureComponent.jsx'
        )
        expect(() => trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})).toThrow(
            `Block marker mismatch in ${filePath}, encountered end marker SFDC_EXT_featureA without a matching start marker at line 1`
        )
    })

    it('fails when nested block markers are not closed in the correct order', () => {
        const code = `
            // @sfdc-extension-block-start SFDC_EXT_featureA
            const featureAVar = 'Feature A variable 1';
            // @sfdc-extension-block-start SFDC_EXT_featureB
            const featureBVar = 'Feature B variable 1';
            // @sfdc-extension-block-end SFDC_EXT_featureA
            // @sfdc-extension-block-end SFDC_EXT_featureB
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)
        const filePath = path.join(
            path.sep,
            'mock',
            'dir',
            'src',
            'components',
            'featureComponent.jsx'
        )
        expect(() =>
            trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        ).toThrow(
            `Block marker mismatch in ${filePath}, expected end marker for SFDC_EXT_featureB but got SFDC_EXT_featureA at line 5:`
        )
    })

    it('handles PropTypes declarations correctly', () => {
        const code = `
            MyClass.PropTypes = {
                name: PropTypes.string,
                description: PropTypes.string,
                // @sfdc-extension-line SFDC_EXT_featureA
                featureAProp: PropTypes.string,
                // @sfdc-extension-line SFDC_EXT_featureB
                featureBProp: PropTypes.string,
            };
        `

        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        const expected = `
            MyClass.PropTypes = {
                name: PropTypes.string,
                description: PropTypes.string,
                // @sfdc-extension-line SFDC_EXT_featureA
                featureAProp: PropTypes.string,
            };
        `
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
        expect(result).not.toContain('featureBProp: PropTypes.string')
    })

    it('handles JSX elements in return statements correctly', () => {
        const code = `
            function test() {
                return (
                    <div>
                        {/* @sfdc-extension-line SFDC_EXT_featureA */}
                        <ComponentA />
                        {/* @sfdc-extension-line SFDC_EXT_featureB */}
                        <ComponentB />
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
                        {/* @sfdc-extension-line SFDC_EXT_featureA */}
                        <ComponentA />
                    </div>
                );
            }
        `
        const result = readFile('/mock/dir/src/components/featureComponent.jsx')
        expect(result).toEqualTrimmedLines(expected)
        expect(result).not.toContain('<ComponentB />')
    })

    it('handles nested JSX elements in return statements correctly', () => {
        const code = `
            function test() {
                return (
                    <div>
                        {/* @sfdc-extension-line SFDC_EXT_featureA */}
                        <ComponentA>
                            <ChildComponent />
                        {/* @sfdc-extension-line SFDC_EXT_featureA */}
                        </ComponentA>
                    </div>
                );
            }
        `
        vol.writeFileSync('/mock/dir/src/components/featureComponent.jsx', code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        const expected = `
            function test() {
                return (
                    <div>
                        <ChildComponent />
                    </div>
                );
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
            `// @sfdc-extension-line SFDC_EXT_featureA
            const feature = Feature_A;`
        )
        vol.writeFileSync = (...args) => {
            throw new Error('Simulated write error')
        }

        try {
            trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})
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
