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
const trimExtensions = require('./trim-extensions')

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

const testDeleteError = (errorCode = 'EPERM', expectedLogMessage) => {
    fs.rmSync.mockImplementation((filePath) => {
        if (filePath.includes('featureBComponent')) {
            const error = new Error('Permission denied')
            error.code = errorCode
            throw error
        }
    })
    jest.spyOn(console, 'log').mockImplementation(() => jest.fn())

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
    const featureBPageCode = `
        export const FeatureBPage = 'FeatureBPage'
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
        } else if (filePath.includes('featureBPage')) {
            return featureBPageCode
        } else {
            console.error('Unhandled file', filePath)
        }
    })

    trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

    expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('featureBComponent'), {
        force: true,
        recursive: true
    })
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
        jest.spyOn(console, 'log').mockImplementation(() => jest.fn())
        trimExtensions('/mock/dir', {})
        expect(console.log).toHaveBeenCalledWith('No plugins found, skipping trim')
        console.log.mockRestore()
    })
})

describe('trim-extensions with nested directories', () => {
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
        const routeCode = `
            const storeLocatorPage = SFDC_EXT_featureA && loadable(() => import('./pages/store-locator'))
        `
        const storeLocatorCode = `
            import { Modal } from './partial/modal' 
            export default StoreLocator = 'StoreLocatorModal'
        `
        const modalCode = `
            export const StoreLocator = 'StoreLocatorModal'
        `
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('route.jsx')) {
                return routeCode
            } else if (filePath.includes(`store-locator${path.sep}index.jsx`)) {
                return storeLocatorCode
            } else if (filePath.includes(`store-locator${path.sep}partial${path.sep}modal.jsx`)) {
                return modalCode
            } else {
                console.error('Unhandled file', filePath)
            }
        })
        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})
        expect(fs.rmSync).toHaveBeenCalledWith(
            expect.stringContaining(`pages${path.sep}store-locator`),
            {force: true, recursive: true}
        )
    })
})

describe('trim-extensions', () => {
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
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines(expected)
        )
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

    it('handles variable with ternary expressions correctly when true', () => {
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

    it('handles variable with ternary expressions correctly when false', () => {
        const code = `const showFeature = SFDC_EXT_featureA ? Feature_A : Feature_B;`
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                return code
            } else {
                return ''
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: false})

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines('const showFeature = Feature_B;')
        )
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.not.stringContaining('const showFeature = Feature_A')
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
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.toEqualTrimmedLines(expected)
        )
        expect(fs.writeFileSync).not.toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('componentA')
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
        const featureBPageCode = `
            export const FeatureBPage = 'FeatureBPage'
        `
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                return code
            } else if (filePath.includes('featureAComponent')) {
                return featureAComponentCode
            } else if (filePath.includes('featureBComponent')) {
                return featureBComponentCode
            } else if (filePath.includes('featureBPage')) {
                return featureBPageCode
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
        const featureBPageCode = `
            export const FeatureAPage = 'FeatureAPage'
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
            } else if (filePath.includes('featureBPage')) {
                return featureBPageCode
            } else {
                console.error('Unhandled file', filePath)
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expect(fs.rmSync).not.toHaveBeenCalledWith(expect.stringContaining('featureAComponent'))
        expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('featureBComponent'), {
            force: true,
            recursive: true
        })
    })

    it('reports error when updating file fails', () => {
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('Failed to write file')
        })
        jest.spyOn(console, 'error').mockImplementation(() => jest.fn())
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
                'Error updating file /mock/dir/src/components/featureComponent.jsx: Failed to write file'
            )
        )
        console.error.mockRestore()
    })

    it('reports error when delete permission is denied', () => {
        testDeleteError('EPERM')
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining(
                '✗ Permission denied - cannot delete. You may need to run with sudo or check permissions.'
            )
        )
        console.log.mockRestore()
    })

    it('reports error when delete fails', () => {
        testDeleteError(null)
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('✗ Error deleting: Permission denied')
        )
        console.log.mockRestore()
    })

    /**
     * This test mimicks the scenario where two unused components are referencing each other from different directories.
     * The test ensures that the unused directories are removed when no "outside" references exist
     */
    it('removes separate unused directories when the only references are from each other', () => {
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
            const pageB = SFDC_EXT_featureB && loadable(() => import('../../pages/featureBPage'))
            export default ComponentB
        `
        const trimmedComponentBCode = `
            export default ComponentB
        `
        const featureBPageCode = `
            const ComponentB = SFDC_EXT_featureB && loadable(() => import('../../components/featureBComponent'))
            export const FeatureBPage = 'FeatureBPage'
        `
        const trimmedFeatureBPageCode = `
            export const FeatureBPage = 'FeatureBPage'
        `
        let componentTrimmed = false
        let componentBTrimmed = false
        let pageBTrimmed = false
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('featureComponent.jsx')) {
                if (!componentTrimmed) {
                    componentTrimmed = true
                    return code
                } else {
                    return trimmedCode
                }
            } else if (filePath.includes('featureAComponent')) {
                return componentACode
            } else if (filePath.includes('featureBComponent')) {
                if (!componentBTrimmed) {
                    componentBTrimmed = true
                    return componentBCode
                } else {
                    return trimmedComponentBCode
                }
            } else if (filePath.includes('featureBPage')) {
                if (!pageBTrimmed) {
                    pageBTrimmed = true
                    return featureBPageCode
                } else {
                    return trimmedFeatureBPageCode
                }
            } else {
                console.error('Unhandled file', filePath)
            }
        })

        trimExtensions('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false})

        expect(fs.unlinkSync).not.toHaveBeenCalledWith(expect.stringContaining('featureAComponent'))
        expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('featureBComponent'), {
            force: true,
            recursive: true
        })
        expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('featureBPage'), {
            force: true,
            recursive: true
        })
    })
})
