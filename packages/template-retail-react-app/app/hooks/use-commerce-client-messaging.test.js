/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import useCommerceClientMessaging, {
    injectCommerceClientWidget
} from '@salesforce/retail-react-app/app/hooks/use-commerce-client-messaging'
import {
    DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION,
    DEFAULT_COMMERCE_CLIENT_COMPONENT_CONFIG,
    DEFAULT_COMMERCE_CLIENT_ELEMENT_ID,
    DEFAULT_COMMERCE_CLIENT_THEME
} from '@salesforce/retail-react-app/app/constants'

const messagingFields = {
    scrt2Url: 'https://scrt2.example.salesforce-scrt.com',
    orgId: '00Dxx0000000001',
    esDeveloperName: 'My_Embedded_Service'
}

// The widget always receives capabilitiesVersion (defaults to '65') plus the
// escalation/transcript toggles (default true) when the caller omits them, so the
// expected messagingConfig includes them.
const expectedMessagingConfig = {
    ...messagingFields,
    capabilitiesVersion: DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION,
    enableEscalationToAgent: true,
    enableDownloadTranscript: true
}

describe('injectCommerceClientWidget', () => {
    let mockInject
    let consoleErrorSpy

    beforeEach(() => {
        mockInject = jest.fn()
        window.CimulateMessaging = {injectMessagingWidget: mockInject}
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        delete window.CimulateMessaging
        jest.restoreAllMocks()
    })

    test('returns false and logs when the messaging bundle is not loaded', () => {
        delete window.CimulateMessaging

        expect(injectCommerceClientWidget(messagingFields)).toBe(false)
        expect(mockInject).not.toHaveBeenCalled()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Commerce Client messaging bundle is not available')
        )
    })

    test('returns false and logs when injectMessagingWidget is not a function', () => {
        window.CimulateMessaging = {injectMessagingWidget: 'not-a-function'}

        expect(injectCommerceClientWidget(messagingFields)).toBe(false)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Commerce Client messaging bundle is not available')
        )
    })

    test('returns true and forwards a fully merged config when the bundle is available', () => {
        expect(injectCommerceClientWidget(messagingFields)).toBe(true)

        expect(mockInject).toHaveBeenCalledTimes(1)
        expect(mockInject).toHaveBeenCalledWith({
            elementId: DEFAULT_COMMERCE_CLIENT_ELEMENT_ID,
            mode: 'messaging',
            messagingConfig: {...expectedMessagingConfig},
            isDevelopment: false,
            componentConfig: {
                ...DEFAULT_COMMERCE_CLIENT_COMPONENT_CONFIG,
                options: {...DEFAULT_COMMERCE_CLIENT_COMPONENT_CONFIG.options}
            },
            theme: {...DEFAULT_COMMERCE_CLIENT_THEME}
        })
    })

    test('uses the provided elementId instead of the default', () => {
        injectCommerceClientWidget({...messagingFields, elementId: 'custom-widget-root'})

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({elementId: 'custom-widget-root'})
        )
    })

    test('merges theme overrides over the defaults', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            theme: {primaryColor: '#ff0000', fontFamily: 'Arial'}
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                theme: {
                    ...DEFAULT_COMMERCE_CLIENT_THEME,
                    primaryColor: '#ff0000',
                    fontFamily: 'Arial'
                }
            })
        )
    })

    test('merges componentConfig overrides including nested options', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            componentConfig: {
                isOpen: true,
                type: 'modal',
                options: {dialogWidth: '500px'}
            }
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                componentConfig: {
                    isOpen: true,
                    type: 'modal',
                    options: {
                        dialogPosition: 'bottom-right',
                        dialogWidth: '500px'
                    }
                }
            })
        )
    })

    test('includes routingAttributes in messagingConfig only when it is an object', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            routingAttributes: {foo: 'bar'}
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                messagingConfig: {...expectedMessagingConfig, routingAttributes: {foo: 'bar'}}
            })
        )
    })

    test('omits routingAttributes from messagingConfig when it is not an object', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            routingAttributes: 'not-an-object'
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({messagingConfig: {...expectedMessagingConfig}})
        )
        expect(mockInject.mock.calls[0][0].messagingConfig).not.toHaveProperty('routingAttributes')
    })

    test('defaults capabilitiesVersion to 65 in messagingConfig when not provided', () => {
        injectCommerceClientWidget(messagingFields)

        expect(mockInject.mock.calls[0][0].messagingConfig.capabilitiesVersion).toBe(
            DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION
        )
    })

    test('forwards a provided capabilitiesVersion in messagingConfig', () => {
        injectCommerceClientWidget({...messagingFields, capabilitiesVersion: '70'})

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                messagingConfig: {...expectedMessagingConfig, capabilitiesVersion: '70'}
            })
        )
    })

    test('defaults escalation and transcript toggles to true in messagingConfig', () => {
        injectCommerceClientWidget(messagingFields)

        const {messagingConfig} = mockInject.mock.calls[0][0]
        expect(messagingConfig.enableEscalationToAgent).toBe(true)
        expect(messagingConfig.enableDownloadTranscript).toBe(true)
    })

    test('forwards escalation and transcript toggles when disabled', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            enableEscalationToAgent: false,
            enableDownloadTranscript: false
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                messagingConfig: {
                    ...expectedMessagingConfig,
                    enableEscalationToAgent: false,
                    enableDownloadTranscript: false
                }
            })
        )
    })

    test('forwards optional presentation fields only when provided', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            logoUrl: 'https://cdn.example.com/logo.png',
            headerText: 'Need help?',
            disclaimerMarkdown: 'This is AI. See [details](https://example.com).',
            searchConfig: {placeholder: 'Search products'},
            globalClassName: 'my-widget',
            isDevelopment: true
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                logoUrl: 'https://cdn.example.com/logo.png',
                headerText: 'Need help?',
                disclaimerMarkdown: 'This is AI. See [details](https://example.com).',
                searchConfig: {placeholder: 'Search products'},
                globalClassName: 'my-widget',
                isDevelopment: true
            })
        )
    })

    test('forwards overridesUrl when provided', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            overridesUrl: 'https://example.com/widget-overrides.js'
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                overridesUrl: 'https://example.com/widget-overrides.js'
            })
        )
    })

    test('forwards overrides when provided', () => {
        injectCommerceClientWidget({
            ...messagingFields,
            overrides: {ProductTile: 'commerce-client-product-tile'}
        })

        expect(mockInject).toHaveBeenCalledWith(
            expect.objectContaining({
                overrides: {ProductTile: 'commerce-client-product-tile'}
            })
        )
    })

    test('omits overrides when it is not an object', () => {
        injectCommerceClientWidget({...messagingFields, overrides: 'not-an-object'})

        expect(mockInject.mock.calls[0][0]).not.toHaveProperty('overrides')
    })

    test('omits optional presentation fields when not provided', () => {
        injectCommerceClientWidget(messagingFields)

        const config = mockInject.mock.calls[0][0]
        expect(config).not.toHaveProperty('logoUrl')
        expect(config).not.toHaveProperty('headerText')
        expect(config).not.toHaveProperty('disclaimerMarkdown')
        expect(config).not.toHaveProperty('searchConfig')
        expect(config).not.toHaveProperty('globalClassName')
        expect(config).not.toHaveProperty('overridesUrl')
        expect(config).not.toHaveProperty('overrides')
    })

    test('always forwards mode as "messaging"', () => {
        injectCommerceClientWidget(messagingFields)

        expect(mockInject.mock.calls[0][0].mode).toBe('messaging')
    })

    test('returns false and logs when injectMessagingWidget throws', () => {
        const error = new Error('boom')
        window.CimulateMessaging = {
            injectMessagingWidget: jest.fn(() => {
                throw error
            })
        }

        expect(injectCommerceClientWidget(messagingFields)).toBe(false)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error injecting Commerce Client messaging widget: ',
            error
        )
    })

    test('returns false when not running on the client (SSR guard)', () => {
        const originalWindow = global.window
        // Remove window so the module-level `onClient` guard re-evaluates to false.
        delete global.window

        let injectInSSR
        jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const ssrModule = require('@salesforce/retail-react-app/app/hooks/use-commerce-client-messaging')
            injectInSSR = ssrModule.injectCommerceClientWidget
        })

        try {
            expect(injectInSSR(messagingFields)).toBe(false)
        } finally {
            global.window = originalWindow
        }
    })
})

describe('useCommerceClientMessaging', () => {
    let mockInject

    beforeEach(() => {
        mockInject = jest.fn()
        window.CimulateMessaging = {injectMessagingWidget: mockInject}
        // Suppress the expected error log from the failed-injection retry test.
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        delete window.CimulateMessaging
        jest.restoreAllMocks()
    })

    test('does not inject while the script has not finished loading', () => {
        renderHook(() => useCommerceClientMessaging({loaded: false, error: false}, messagingFields))

        expect(mockInject).not.toHaveBeenCalled()
    })

    test('does not inject when the script failed to load', () => {
        renderHook(() => useCommerceClientMessaging({loaded: true, error: true}, messagingFields))

        expect(mockInject).not.toHaveBeenCalled()
    })

    test('injects the widget once the script has loaded', () => {
        renderHook(() => useCommerceClientMessaging({loaded: true, error: false}, messagingFields))

        expect(mockInject).toHaveBeenCalledTimes(1)
    })

    test('injects only once even when the effect re-runs', () => {
        const {rerender} = renderHook(
            ({status}) => useCommerceClientMessaging(status, messagingFields),
            {
                initialProps: {status: {loaded: true, error: false}}
            }
        )

        expect(mockInject).toHaveBeenCalledTimes(1)

        // A new status object reference re-runs the effect, but the widget should
        // not be injected a second time.
        rerender({status: {loaded: true, error: false}})

        expect(mockInject).toHaveBeenCalledTimes(1)
    })

    test('retries injection when the first attempt fails because the bundle was not ready', () => {
        // Bundle not present yet: the first injection attempt fails (returns false)
        // and must NOT mark the widget as injected.
        delete window.CimulateMessaging

        const {rerender} = renderHook(
            ({status}) => useCommerceClientMessaging(status, messagingFields),
            {
                initialProps: {status: {loaded: true, error: false}}
            }
        )

        expect(mockInject).not.toHaveBeenCalled()

        // Bundle becomes available and the effect re-runs -> injection succeeds.
        window.CimulateMessaging = {injectMessagingWidget: mockInject}
        rerender({status: {loaded: true, error: false}})

        expect(mockInject).toHaveBeenCalledTimes(1)
    })
})
