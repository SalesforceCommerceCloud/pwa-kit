/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* global jest expect */
/* eslint-env jest */
/* eslint import/no-commonjs:0 */
/* eslint max-nested-callbacks:0 */
import sinon from 'sinon'
import {getAssetUrl} from '../asset-utils'
import {loadUPWA} from './ssr-loader-utils'

describe('loadUPWA tests', () => {
    const mobifyPropertyId = 'mobifyProp'
    const buildOrigin = 'https://a.b/'
    const progressive = (window.Progressive = {
        buildOrigin
    })

    // Override the functions that we want to check
    const overrides = {
        browserSupportsMessaging: sinon.stub(),
        createGlobalMessagingClientInitPromise: sinon.stub(),
        initCacheManifest: sinon.stub(),
        loadAndInitMessagingClient: sinon.stub(),
        loadAsset: sinon.stub(),
        loadScript: sinon.stub(),
        setPerformanceValues: sinon.stub(),
        trackFirstPaints: sinon.stub(),
        trackTTI: sinon.stub(),
        triggerSandyAppStartEvent: sinon.stub()
    }

    beforeEach(() => {
        Object.keys(overrides).forEach((key) => {
            overrides[key].reset()
        })
        overrides.loadWorker = sinon.stub().returns(Promise.resolve())
    })

    const testCases = [
        {
            name: 'service worker support and messaging',
            browserSupportsMessaging: true,
            debug: true,
            messagingSiteId: 'msg1',
            serviceWorker: true,
            ssrOptions: {}
        },
        {
            name: 'service worker support but messaging not enabled',
            browserSupportsMessaging: true,
            debug: false,
            serviceWorker: true,
            ssrOptions: {}
        },
        {
            name: 'service worker support but messaging unsupported',
            browserSupportsMessaging: false,
            messagingSiteId: 'msg1',
            debug: false,
            serviceWorker: true,
            ssrOptions: {}
        },
        {
            name: 'no service worker support',
            browserSupportsMessaging: false,
            debug: false,
            serviceWorker: false,
            ssrOptions: {}
        },
        {
            name: 'overrides for script names',
            browserSupportsMessaging: false,
            debug: true,
            serviceWorker: false,
            ssrOptions: {
                mainFilename: 'main2.js',
                vendorFilename: 'vendor2.js'
            }
        },
        {
            name: 'loads stylesheet',
            ssrOptions: {
                loadStylesheet: true
            }
        },
        {
            name: 'ssrLoaderScripts is empty',
            ssrOptions: {
                ssrLoaderScripts: []
            }
        },
        {
            name: 'ssrLoaderScripts loads jquery',
            ssrOptions: {
                ssrLoaderScripts: ['static/js/jquery.min.js']
            }
        }
    ]

    testCases.forEach((testCase) =>
        test(`initialize, ${testCase.name}`, () => {
            overrides.browserSupportsMessaging.returns(testCase.browserSupportsMessaging)

            window.navigator = {}
            if (testCase.serviceWorker) {
                window.navigator.serviceWorker = {}
            }

            const messagingEnabled = !!testCase.messagingSiteId

            const ssrOptions = (progressive.ssrOptions = testCase.ssrOptions)

            return loadUPWA({
                debug: testCase.debug,
                messagingSiteId: testCase.messagingSiteId,
                mobifyPropertyId,
                overrides
            }).then(() => {
                expect(progressive.Messaging).toBeTruthy()
                expect(!!progressive.Messaging.enabled).toBe(messagingEnabled)

                expect(progressive.AstroPromise instanceof Promise).toBe(true)
                expect(progressive.capturedDocHTMLPromise instanceof Promise).toBe(true)

                // What we expect to be called once
                expect(overrides.trackFirstPaints.calledOnce).toBe(true)
                expect(overrides.setPerformanceValues.calledOnce).toBe(true)
                expect(overrides.trackTTI.calledOnce).toBe(true)

                // What we expect to have been called with specific values
                const expectedManifest = {
                    hashes: {},
                    buildDate: 0
                }
                expect(overrides.initCacheManifest.calledWith(expectedManifest)).toBe(true)

                expect(
                    overrides.loadWorker.calledWith(true, messagingEnabled, expectedManifest, true)
                ).toBe(true)

                expect(
                    overrides.loadAndInitMessagingClient.calledWith(
                        testCase.debug,
                        testCase.messagingSiteId,
                        true
                    )
                ).toBe(!!(testCase.browserSupportsMessaging && messagingEnabled))

                expect(
                    overrides.createGlobalMessagingClientInitPromise.calledWith(messagingEnabled)
                ).toBe(true)

                // Assets and prefetches
                const mainSrc = getAssetUrl(ssrOptions.mainFilename || 'main.js')
                expect(
                    overrides.loadScript.calledWith({
                        id: 'progressive-web-main',
                        src: mainSrc
                    })
                ).toBe(true)

                const vendorSrc = getAssetUrl(ssrOptions.vendorFilename || 'vendor.js')
                expect(
                    overrides.loadScript.calledWith({
                        id: 'progressive-web-vendor',
                        src: vendorSrc
                    })
                ).toBe(true)

                const mainCSS = getAssetUrl('main.css')
                const loadCSS = !!ssrOptions.loadStylesheet
                expect(
                    overrides.loadAsset.calledWith('link', sinon.match.has('href', mainCSS)),
                    `Expected stylesheet link to be ${loadCSS ? 'present' : 'absent'}`
                ).toBe(loadCSS)

                const ssrLoaderScripts = ssrOptions.ssrLoaderScripts || []
                ssrLoaderScripts.forEach((path, index) => {
                    const src = getAssetUrl(path)
                    expect(
                        overrides.loadScript.calledWith({
                            id: `progressive-web-script-${index}`,
                            src
                        })
                    ).toBe(true)
                })
            })
        })
    )

    test('validates mobifyPropertyId', () => {
        expect(() =>
            loadUPWA({
                debug: false
            })
        ).toThrow('mobifyPropertyId')
    })

    test('validates window.Progressive', () => {
        window.Progressive = null
        expect(() =>
            loadUPWA({
                debug: false,
                mobifyPropertyId
            })
        ).toThrow('window.Progressive')
    })
})
