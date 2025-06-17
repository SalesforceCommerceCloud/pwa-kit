/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const EXTENSIBILITY_QUESTIONS = require('./extensibility')
const HYBRID_QUESTIONS = require('./hybrid')
const RETAIL_REACT_APP_QUESTIONS = require('./retail-react-app')
const TYPESCRIPT_MINIMAL_QUESTIONS = require('./typescript-minimal')
const EXPRESS_MINIMAL_QUESTIONS = require('./express-minimal')
const MRT_REFERENCE_QUESTIONS = require('./mrt-reference')

// TODO: Move these to a constants file or something.
const TEMPLATE_SOURCE_NPM = 'npm'
const TEMPLATE_SOURCE_BUNDLE = 'bundle'

const PRESETS = [
    {
        id: 'retail-react-app',
        name: 'Retail React App',
        description: `
            Generate a project using custom settings by answering questions about a
            B2C Commerce instance.

            Use this preset to connect to an existing instance, such as a sandbox.
        `,
        shortDescription: 'The Retail app using your own Commerce Cloud instance',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        assets: ['translations'],
        private: false
    },
    {
        id: 'retail-react-app-demo',
        name: 'Retail React App Demo',
        description: `
            Generate a project using the settings for a special B2C Commerce
            instance that is used for demo purposes. No questions are asked.

            Use this preset to try out PWA Kit.
        `,
        shortDescription: 'The Retail app with demo Commerce Cloud instance',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: false,
            ['project.name']: 'demo-storefront',
            ['project.commerce.instanceUrl']: 'https://zzte-053.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: '1d763261-6522-4913-9d52-5d947d3b94c4',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzte_053',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: false,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.dataCloud.appSourceId']: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            ['project.dataCloud.tenantId']: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd',
            ['project.demo.enableDemoSettings']: false
        },
        assets: ['translations'],
        private: false
    },
    {
        id: 'retail-react-app-demo-site-internal',
        name: 'Retail React App Demo Store',
        description: `
            Generates a project using the settings for a special B2C Commerce instance that is used
            for demo purposes. The demo site is accessible at https://pwa-kit.mobify-storefront.com/

            This environment uses a SLAS private client and has social and passwordless login enabled.
            This environment is set up to use multiple locales.
            Future features that are enabled for the demo environment may be added to this preset.
        `,
        shortDescription:
            'The Retail app with demo Commerce Cloud instance and a private SLAS client',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: false, // Intentionally not an extensible project so that the correct logos appear on demo site
            ['project.hybrid']: false,
            ['project.name']: 'demo-storefront',
            ['project.commerce.instanceUrl']: 'https://zzrf-001.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: '083859f2-5d93-4209-b999-a112266d63a0',
            ['project.commerce.siteId']: 'RefArchGlobal',
            ['project.commerce.organizationId']: 'f_ecom_zzrf_001',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: true,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.dataCloud.appSourceId']: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            ['project.dataCloud.tenantId']: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd',
            ['project.demo.enableDemoSettings']: true // True only for presets deployed to demo environments like pwa-kit.mobify-storefront.com
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-test-project',
        name: 'Retail React App Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: false,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://zzrf-001.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzrf_001',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: false,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.dataCloud.appSourceId']: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            ['project.dataCloud.tenantId']: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd',
            ['project.demo.enableDemoSettings']: false
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-private-slas-client',
        name: 'Retail React App Private SLAS client project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: false,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://zzrf-002.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: '89655706-9a0d-49ba-a1e5-18bb2d616374',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzrf_002',
            ['project.commerce.shortCode']: 'kv7kzm78',
            ['project.commerce.isSlasPrivate']: true,
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.dataCloud.appSourceId']: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            ['project.dataCloud.tenantId']: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd',
            ['project.demo.enableDemoSettings']: false
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-bug-bounty',
        name: 'Retail React App Bug Bounty Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: false,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://zzec-006.dx.commercecloud.salesforce.com',
            ['project.commerce.clientId']: 'b56e7ad3-2237-42c9-8f55-41e63ebca420',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_zzec_006',
            ['project.commerce.shortCode']: 'staging-001',
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.dataCloud.appSourceId']: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            ['project.dataCloud.tenantId']: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd',
            ['project.commerce.isSlasPrivate']: true,
            ['project.demo.enableDemoSettings']: false
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-hybrid-test-project',
        name: 'Retail React App Hybrid Test Private SLAS Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...HYBRID_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: true,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://test.phased-launch-testing.com/',
            ['project.commerce.clientId']: '99b4e081-00cf-454a-95b0-26ac2b824931',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_bdpx_dev',
            ['project.commerce.shortCode']: 'xitgmcd3',
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.commerce.isSlasPrivate']: true,
            ['project.dataCloud.appSourceId']: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            ['project.dataCloud.tenantId']: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd',
            ['project.demo.enableDemoSettings']: false
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'retail-react-app-hybrid-public-client-test-project',
        name: 'Retail React App Hybrid Test Public SLAS client project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_NPM,
            id: '@salesforce/retail-react-app'
        },
        questions: [...EXTENSIBILITY_QUESTIONS, ...HYBRID_QUESTIONS, ...RETAIL_REACT_APP_QUESTIONS],
        answers: {
            ['project.extend']: true,
            ['project.hybrid']: true,
            ['project.name']: 'retail-react-app',
            ['project.commerce.instanceUrl']: 'https://www.phased-launch-testing.com/',
            ['project.commerce.clientId']: 'e7e22b7f-a904-4f3a-8022-49dbee696485',
            ['project.commerce.siteId']: 'RefArch',
            ['project.commerce.organizationId']: 'f_ecom_bjnl_prd',
            ['project.commerce.shortCode']: 'performance-001',
            ['project.einstein.clientId']: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            ['project.einstein.siteId']: 'aaij-MobileFirst',
            ['project.commerce.isSlasPrivate']: false,
            ['project.dataCloud.appSourceId']: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            ['project.dataCloud.tenantId']: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd',
            ['project.demo.enableDemoSettings']: false
        },
        assets: ['translations'],
        private: true
    },
    {
        id: 'typescript-minimal-test-project',
        name: 'Template Minimal Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'typescript-minimal'
        },
        private: true
    },
    {
        id: 'typescript-minimal',
        name: 'Template Minimal Project',
        description: `
            Generate a project using a bare-bones TypeScript app template.

            Use this as a TypeScript starting point or as a base on top of
            which to build new TypeScript project templates for Managed Runtime.
        `,
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'typescript-minimal'
        },
        questions: TYPESCRIPT_MINIMAL_QUESTIONS,
        private: false
    },
    {
        id: 'express-minimal-test-project',
        name: 'Express Minimal Test Project',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'express-minimal'
        },
        questions: EXPRESS_MINIMAL_QUESTIONS,
        answers: {
            ['project.name']: 'express-minimal'
        },
        private: true
    },
    {
        id: 'express-minimal',
        name: 'Express Minimal Project',
        description: `
            Generate a project using a bare-bones express app template.

            Use this as a starting point for APIs or as a base on top of
            which to build new project templates for Managed Runtime.
        `,
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'express-minimal'
        },
        questions: EXPRESS_MINIMAL_QUESTIONS,
        private: true
    },
    {
        id: 'mrt-reference-app',
        name: 'Managed Runtime Reference App',
        description: '',
        templateSource: {
            type: TEMPLATE_SOURCE_BUNDLE,
            id: 'mrt-reference-app'
        },
        questions: MRT_REFERENCE_QUESTIONS,
        answers: {
            ['project.name']: 'mrt-reference-app'
        },
        private: true
    }
]

const QUESTIONS = [
    {
        name: 'general.presetId',
        message: 'Choose a project preset to get started:',
        type: 'list',
        choices: PRESETS.filter(({private}) => !private).map(({shortDescription, id}) => ({
            name: shortDescription,
            value: id
        }))
    }
]

module.exports = {QUESTIONS, PRESETS}