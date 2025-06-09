/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fs = require('fs');

jest.mock('../assets/plugin-config', () => ({
    plugins: {
        SFDC_EXT_featureA: {
            description: 'Feature A'
        },
        SFDC_EXT_featureB: {
            description: 'Feature B'
        }
    }
}));

jest.mock('fs')

const treeShake = require('./tree-shake')

describe('tree-shake', () => {

    beforeEach(() => {
        fs.readdirSync.mockReturnValue(['src/components/featureComponent.jsx', '/src/components/featureAComponent/index.jsx', '/src/components/featureBComponent/index.jsx'])
        fs.statSync.mockReturnValue({isDirectory: () => false})
        fs.existsSync.mockImplementation((filePath) => {
            if (filePath.includes('src/components/featureAComponent') || filePath.includes('src/components/featureBComponent')) {
                if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        })
        fs.unlinkSync.mockReturnValue(true);
    })

    it('handles OR operator correctly', () => {
        const code = `
            const feature = (SFDC_EXT_featureA || SFDC_EXT_featureB) && 'Feature Enabled';
        `;
        fs.readFileSync.mockReturnValue(code);

        treeShake('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false});

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('const feature = \'Feature Enabled\';')
        );
    })

    it('handles variable declarations correctly', () => {
        const code = `
            const featureAFunc = SFDC_EXT_featureA && (() => 'Feature A');
            const featureBFunc = SFDC_EXT_featureB && (() => 'Feature B');
        `;
        fs.readFileSync.mockReturnValue(code);

        treeShake('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false});

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('const featureAFunc = () => \'Feature A\';')
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.not.stringContaining('const featureBFunc = () => \'Feature B\';')
        );
    })

    it('handles variable with ternary expressions correctly', () => {
        const code = `
            const showFeature = SFDC_EXT_featureA ? Feature_A : Feature_B;
        `
        fs.readFileSync.mockReturnValue(code)

        treeShake('/mock/dir', {SFDC_EXT_featureA: true})

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('const showFeature = Feature_A')
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.not.stringContaining('const showFeature = Feature_B')
        );
    })

    it('handles return with ternary expressions correctly', () => {
        const code = `
            function test() {
                return SFDC_EXT_featureA ? Feature_A : Feature_B;
            }
        `;
        fs.readFileSync.mockReturnValue(code);

        treeShake('/mock/dir', {SFDC_EXT_featureA: true});

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('return Feature_A')
        );
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
        `;
        fs.readFileSync.mockReturnValue(code);

        treeShake('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false});

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('<ComponentA />')
        )
        expect(fs.writeFileSync).not.toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('<ComponentB />')
        );
    })

    it('does not remove referenced imports', () => {
        const code = `
            import { FeatureA } from './featureAComponent'
        `;
        const featureAComponentCode = `
            export const FeatureA = 'FeatureA'
        `;
        const featureBComponentCode = `
            export const FeatureB = 'FeatureB'
        `;
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('src/components/featureComponent.jsx')) {
                return code;
            } else if (filePath.includes('src/components/featureAComponent/index.jsx')) {
                return featureAComponentCode;
            } else if (filePath.includes('src/components/featureBComponent/index.jsx')) {
                return featureBComponentCode;
            }
        });

        treeShake('/mock/dir', {SFDC_EXT_featureA: true});

        expect(fs.unlinkSync).not.toHaveBeenCalledWith(
            expect.stringContaining('src/components/featureAComponent')
        );
    })

    it('removes unused loadable import file when no more references exist', () => {
        const code = `
            import loadable from '@loadable/component'
            const ComponentA = SFDC_EXT_featureA && loadable(() => import('./featureAComponent'))
            const ComponentB = SFDC_EXT_featureB && loadable(() => import('./featureBComponent'))
        `;

        const shookCode = `
            import loadable from '@loadable/component'
            const ComponentA = loadable(() => import('./featureAComponent'))
        `;
        const componentACode = `
            export default ComponentA
        `;
        const componentBCode = `
            export default ComponentB
        `

        let treeShakeCalled = false;
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('src/components/featureComponent.jsx')) {
                if (!treeShakeCalled) {
                    treeShakeCalled = true;
                    return code;
                } else {
                    return shookCode;
                }
            } else if (filePath.includes('src/components/featureAComponent/index.jsx')) {
                return componentACode;
            } else if (filePath.includes('src/components/featureBComponent/index.jsx')) {
                return componentBCode;
            }
        });

        treeShake('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false});

        expect(fs.unlinkSync).not.toHaveBeenCalledWith(
            expect.stringContaining('src/components/featureAComponent')
        );
        expect(fs.unlinkSync).toHaveBeenCalledWith(
            expect.stringContaining('src/components/featureBComponent')
        );
    })

    it('reports error when delete permission is denied', () => {
        fs.unlinkSync.mockImplementation((filePath) => {
            if (filePath.includes('src/components/featureBComponent')) {
                const error = new Error('Permission denied');
                error.code = 'EPERM';
                throw error;
            }
        });
        console.log = jest.fn();

        const code = `
            import loadable from '@loadable/component'
            const ComponentA = SFDC_EXT_featureA && loadable(() => import('./featureAComponent'))
            const ComponentB = SFDC_EXT_featureB && loadable(() => import('./featureBComponent'))
        `;

        const shookCode = `
            import loadable from '@loadable/component'
            const ComponentA = loadable(() => import('./featureAComponent'))
        `;
        const componentACode = `
            export default ComponentA
        `;
        const componentBCode = `
            export default ComponentB
        `

        let treeShakeCalled = false;
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('src/components/featureComponent.jsx')) {
                if (!treeShakeCalled) {
                    treeShakeCalled = true;
                    return code;
                } else {
                    return shookCode;
                }
            } else if (filePath.includes('src/components/featureAComponent/index.jsx')) {
                return componentACode;
            } else if (filePath.includes('src/components/featureBComponent/index.jsx')) {
                return componentBCode;
            }
        });

        treeShake('/mock/dir', {SFDC_EXT_featureA: true, SFDC_EXT_featureB: false});

        expect(fs.unlinkSync).toHaveBeenCalledWith(
            expect.stringContaining('src/components/featureBComponent')
        );

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('✗ Permission denied - cannot delete. You may need to run with sudo or check permissions.')
        );
    })

});
