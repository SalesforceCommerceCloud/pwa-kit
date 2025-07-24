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

// mock plugin config to simulate different plugin states
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

jest.mock('fs')
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

/**
 *
 * @typedef {Object} contentMap
 * A mapping of file path patterns (string) to file contents (string or string[]).
 * If the value is an array, each call to the mock will return the next item in the array,
 * allowing simulation of file content changes (pre and post trim) across multiple reads.
 *
 * Example:
 * {
 *   'featureComponent.jsx': [
 *     'initial content',
 *     'trimmed/updated content'
 *   ],
 *   'featureAComponent': 'static content'
 * }
 *
 * @typedef {Object} callCounters
 * A mapping of file path patterns (string) to the number of times the mock has been called for that pattern.
 * Used to track which version of the content array to return for each file.
 *
 * Example:
 * {
 *   'featureComponent.jsx': 1,
 *   'featureAComponent': 0
 * }
 */
const createFileContentMock = (contentMap, callCounters = {}) => {
    return (filePath) => {
        for (const [pathPattern, content] of Object.entries(contentMap)) {
            if (filePath.includes(pathPattern)) {
                if (Array.isArray(content)) {
                    const counter = callCounters[pathPattern] || 0
                    callCounters[pathPattern] = counter + 1
                    return content[counter] || content[content.length - 1]
                }
                return content
            }
        }
        console.error('Unhandled file', filePath)
        return ''
    }
}

// mock console.error to verify error messages are logged
const mockConsole = (method = 'error') => {
    const spy = jest.spyOn(console, method).mockImplementation(() => jest.fn())
    return spy
}

// verify file operations are called with the correct arguments
const expectFileOperation = (operation, matcher, options = {}) => {
    if (options.not) {
        expect(fs[operation]).not.toHaveBeenCalledWith(matcher, options.args)
    } else {
        expect(fs[operation]).toHaveBeenCalledWith(matcher, options.args)
    }
}

// verify file is written with the correct content, using the custom matcher toEqualTrimmedLines
const expectFileWrite = (expectedContent) => {
    expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.toEqualTrimmedLines(expectedContent)
    )
}

// verify file is not written with the expected content
const expectFileNotContain = (content) => {
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(content)
    )
}

// verify prettier is run with the correct arguments
const expectPrettierRun = (filePath) => {
    expect(execSync).toHaveBeenCalledWith(
        `npx prettier --write ${path.join('/mock', 'dir', 'src', 'components', filePath)}`
    )
}

// setup test for delete error scenarios
const setupDeleteErrorTest = (errorCode = 'EPERM') => {
    fs.rmSync.mockImplementation((filePath) => {
        if (filePath.includes('featureBComponent')) {
            const error = new Error('Permission denied')
            error.code = errorCode
            throw error
        }
    })

    const consoleSpy = mockConsole('log')

    const contentMap = {
        'featureComponent.jsx': [TEST_CODES.BASIC_COMPONENT, TEST_CODES.BASIC_COMPONENT_TRIMMED],
        featureAComponent: TEST_CODES.COMPONENT_A,
        featureBComponent: TEST_CODES.COMPONENT_B,
        featureBPage: TEST_CODES.FEATURE_B_PAGE
    }

    fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

    return consoleSpy
}

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

const mockFs = () => {
    fs.statSync.mockImplementation((filePath) => {
        return {
            isDirectory: () => {
                return !filePath.endsWith('.jsx')
            }
        }
    })
    fs.rmSync.mockImplementation(() => jest.fn())
    fs.readFileSync.mockImplementation(() => jest.fn())
    fs.existsSync.mockImplementation((filePath) => {
        if (
            filePath.includes('featureAComponent') ||
            filePath.includes('featureBComponent') ||
            filePath.includes('featureBPage') ||
            filePath.includes('store-locator') ||
            filePath.includes('partial')
        ) {
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
}

describe('trim-extensions without config', () => {
    beforeEach(() => {
        jest.resetModules()
    })
    it('returns early if no plugins is defined', () => {
        jest.mock('../assets/plugin-config', () => ({
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
    const trimExtensions = require('./trim-extensions')
    beforeEach(() => {
        jest.resetAllMocks()
    })
    beforeEach(() => {
        fs.readdirSync.mockImplementation((filePath) => {
            if (filePath.endsWith('/mock/dir')) {
                return ['src']
            } else if (filePath.endsWith('src')) {
                return ['pages', 'route.jsx']
            } else if (filePath.endsWith('pages')) {
                return ['store-locator']
            } else if (filePath.endsWith('partial')) {
                return ['modal.jsx']
            } else if (filePath.endsWith('store-locator')) {
                return ['index.jsx']
            } else {
                return []
            }
        })
        mockFs()
    })

    it('recursively removes unused directories', () => {
        const contentMap = {
            'route.jsx': `const storeLocatorPage = SFDC_EXT_featureA && loadable(() => import('./pages/store-locator'))`,
            [`store-locator${path.sep}index.jsx`]: `import { Modal } from './partial/modal' 
                export default StoreLocator = 'StoreLocatorModal'`,
            [`store-locator${path.sep}partial${path.sep}modal.jsx`]: `export const StoreLocator = 'StoreLocatorModal'`
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        expectFileOperation('rmSync', expect.stringContaining(`pages${path.sep}store-locator`), {
            args: {force: true, recursive: true}
        })
    })
})

describe('trim-extensions', () => {
    const trimExtensions = require('./trim-extensions')
    beforeEach(() => {
        jest.resetAllMocks()
        fs.readdirSync.mockReturnValue([
            '/src/components/featureComponent.jsx',
            '/src/components/featureAComponent/index.jsx',
            '/src/components/featureBComponent/index.jsx',
            '/src/pages/featureBPage/index.jsx'
        ])
        mockFs()
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
        fs.readFileSync.mockReturnValue(code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})
        expectFileWrite(expected)
    })

    it('handles OR operator correctly', () => {
        const code = `const feature = (SFDC_EXT_featureA || SFDC_EXT_featureB) && 'Feature Enabled';`
        const contentMap = {
            'featureComponent.jsx': code,
            featureAComponent: '',
            featureBComponent: '',
            featureBPage: ''
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        expectFileWrite("const feature = 'Feature Enabled';")
        expectPrettierRun('featureComponent.jsx')
    })

    it('handles variable declarations correctly', () => {
        const code = `const featureAFunc = SFDC_EXT_featureA && (() => 'Feature A');
            const featureBFunc = SFDC_EXT_featureB && (() => 'Feature B');
        `
        const contentMap = {
            'featureComponent.jsx': code,
            featureAComponent: '',
            featureBComponent: '',
            featureBPage: ''
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expectFileWrite("const featureAFunc = () => 'Feature A';")
        expectFileNotContain("const featureBFunc = () => 'Feature B';")
        expectPrettierRun('featureComponent.jsx')
    })

    it('handles variable with ternary expressions correctly when true', () => {
        const code = `const showFeature = SFDC_EXT_featureA ? Feature_A : Feature_B;`
        const contentMap = {
            'featureComponent.jsx': code,
            featureAComponent: '',
            featureBComponent: '',
            featureBPage: ''
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        expectFileWrite('const showFeature = Feature_A;')
        expectFileNotContain('const showFeature = Feature_B')
        expectPrettierRun('featureComponent.jsx')
    })

    it('handles variable with ternary expressions correctly when false', () => {
        const code = `const showFeature = SFDC_EXT_featureA ? Feature_A : Feature_B;`
        const contentMap = {
            'featureComponent.jsx': code,
            featureAComponent: '',
            featureBComponent: '',
            featureBPage: ''
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        expectFileWrite('const showFeature = Feature_B;')
        expectFileNotContain('const showFeature = Feature_A')
        expectPrettierRun('featureComponent.jsx')
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
        expectFileWrite(expected)
        expectPrettierRun('featureComponent.jsx')
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
        expectFileWrite(expected)
        expectFileNotContain('featureBProp: PropTypes.string')
        expectPrettierRun('featureComponent.jsx')
    })

    it('handles ternary expressions in return statements correctly', () => {
        const code = `
            function test() {
                return SFDC_EXT_featureA ? "componentA" : "componentB";
            }
        `
        fs.readFileSync.mockReturnValue(code)

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        const expected = `
            function test() {
                return "componentB";
            }
        `
        expectFileWrite(expected)
        expectFileNotContain('componentA')
        expectPrettierRun('featureComponent.jsx')
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
        expectFileWrite(expected)
        expectFileNotContain('<ComponentB />')
        expectPrettierRun('featureComponent.jsx')
    })

    it('does not remove referenced imports', () => {
        const code = `import { FeatureA } from './featureAComponent'`
        const contentMap = {
            'featureComponent.jsx': code,
            featureAComponent: TEST_CODES.COMPONENT_A,
            featureBComponent: TEST_CODES.COMPONENT_B,
            featureBPage: TEST_CODES.FEATURE_B_PAGE
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true})

        expectFileOperation(
            'unlinkSync',
            expect.stringContaining('src/components/featureAComponent'),
            {not: true}
        )
    })

    it('removes unused loadable import file when no more references exist', () => {
        const contentMap = {
            'featureComponent.jsx': [
                TEST_CODES.BASIC_COMPONENT,
                TEST_CODES.BASIC_COMPONENT_TRIMMED
            ],
            featureAComponent: TEST_CODES.COMPONENT_A,
            featureBComponent: TEST_CODES.COMPONENT_B,
            featureBPage: TEST_CODES.FEATURE_B_PAGE
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expectFileOperation('rmSync', expect.stringContaining('featureAComponent'), {not: true})
        expectFileOperation('rmSync', expect.stringContaining('featureBComponent'), {
            args: {force: true, recursive: true}
        })
    })

    it('reports error when updating file fails', () => {
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('Failed to write file')
        })
        const consoleSpy = mockConsole('error')
        const code = `
        function test() {
            return SFDC_EXT_featureA ? Feature_A : Feature_B;
        }
        `
        fs.readFileSync.mockReturnValue(code)
        try {
            trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})
        } catch (error) {
            // do nothing
        }
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `Error updating file ${path.join(
                    path.sep,
                    'mock',
                    'dir',
                    'src',
                    'components',
                    'featureComponent.jsx'
                )}: Failed to write file`
            )
        )
        consoleSpy.mockRestore()
    })

    it('reports error when delete permission is denied', () => {
        const consoleSpy = setupDeleteErrorTest('EPERM')
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining(
                '✗ Permission denied - cannot delete. You may need to run with sudo or check permissions.'
            )
        )
        consoleSpy.mockRestore()
    })

    it('reports error when delete fails', () => {
        const consoleSpy = setupDeleteErrorTest(null)
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('✗ Error deleting: Permission denied')
        )
        consoleSpy.mockRestore()
    })

    /**
     * This test mimicks the scenario where two unused components are referencing each other from different directories.
     * The test ensures that the unused directories are removed when no "outside" references exist
     */
    it('removes separate unused directories when the only references are from each other', () => {
        const contentMap = {
            'featureComponent.jsx': [
                TEST_CODES.BASIC_COMPONENT,
                TEST_CODES.BASIC_COMPONENT_TRIMMED
            ],
            featureAComponent: TEST_CODES.COMPONENT_A,
            featureBComponent: [
                TEST_CODES.COMPONENT_B_WITH_PAGE_REF,
                TEST_CODES.COMPONENT_B_WITH_PAGE_REF_TRIMMED
            ],
            featureBPage: [
                TEST_CODES.FEATURE_B_PAGE_WITH_COMPONENT_REF,
                TEST_CODES.FEATURE_B_PAGE_WITH_COMPONENT_REF_TRIMMED
            ]
        }

        fs.readFileSync.mockImplementation(createFileContentMock(contentMap))

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expectFileOperation('unlinkSync', expect.stringContaining('featureAComponent'), {not: true})
        expectFileOperation('rmSync', expect.stringContaining('featureBComponent'), {
            args: {force: true, recursive: true}
        })
        expectFileOperation('rmSync', expect.stringContaining('featureBPage'), {
            args: {force: true, recursive: true}
        })
    })
})
