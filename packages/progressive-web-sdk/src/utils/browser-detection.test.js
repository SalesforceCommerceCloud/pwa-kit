/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {detectBrowser, checkBrowserCompatibility} from './browser-detection'

/**
 * A list of supported browser objects.
 *
 * It's preferable to provide major versions, which can be
 * exact, greater or equal to (+) or lower or equal to (-).
 *
 * A RegExp object can also be provided, which can be tailored
 * to any specific case needed (remember to use lowercase browser
 * names).
 */
const supportedBrowsersList = [
    {
        name: 'chrome',
        version: 53
    },
    // to detect Chrome, it has to be not Edge or Opera
    // this detects versions 51 & 52.1.2
    /^(?!.*(opr|opera|edge)).*chrome\/(51|52\.1\.2)/,
    {
        name: 'samsungbrowser',
        version: 5
    },
    /samsungbrowser\/4/,
    {
        name: 'safari',
        version: 10
    },
    /version\/[8][\d\w.]+safari/,
    {
        name: 'firefox',
        version: 49
    },
    /firefox\/(43|45)/,
    {
        name: 'msie',
        version: 11
    },
    {
        name: 'edge',
        version: 14
    },
    /(googlebot|adsbot-google)/,
    {
        name: 'safari',
        mobile: true,
        version: 9
    },
    {
        name: 'chrome',
        mobile: true,
        version: 53
    }
]

/**
 * A list of test cases.
 *
 * Each User-Agent in the navigator object is a minimal test case,
 * not an actual User-Agent, for brevity.
 */
const testCases = [
    {
        navigator: {userAgent: 'Firefox/49.0', appName: '', appVersion: ''},
        name: 'Firefox',
        version: '49.0',
        mobile: false,
        supported: true
    },
    {
        navigator: {userAgent: 'Firefox/42.0', appName: '', appVersion: ''},
        name: 'Firefox',
        version: '42.0',
        mobile: false,
        supported: false
    },
    {
        navigator: {userAgent: 'Chrome/53.2 Safari/537.36', appName: '', appVersion: ''},
        name: 'Chrome',
        version: '53.2',
        mobile: false,
        supported: true
    },
    {
        navigator: {userAgent: 'Chrome/51.1.1', appName: '', appVersion: ''},
        name: 'Chrome',
        version: '51.1.1',
        mobile: false,
        supported: true
    },
    {
        navigator: {userAgent: 'Chrome/52.0', appName: '', appVersion: ''},
        name: 'Chrome',
        version: '52.0',
        mobile: false,
        supported: false
    },
    {
        navigator: {userAgent: 'Chrome/52.1.2', appName: '', appVersion: ''},
        name: 'Chrome',
        version: '52.1.2',
        mobile: false,
        supported: true
    },
    {
        navigator: {
            userAgent: 'Chrome/51.0.2704.106 OPR/38.0.2220.41',
            appName: '',
            appVersion: ''
        },
        name: 'Opera',
        version: '38.0.2220.41',
        mobile: false,
        supported: false
    },
    {
        navigator: {userAgent: 'Version/10.0 Safari/602.1', appName: '', appVersion: ''},
        name: 'Safari',
        version: '10.0',
        mobile: false,
        supported: true
    },
    {
        navigator: {userAgent: 'Version/9.1.2 Safari/601.7.7', appName: '', appVersion: ''},
        name: 'Safari',
        version: '9.1.2',
        mobile: false,
        supported: false
    },
    {
        navigator: {userAgent: 'Trident/7.0; rv:9.0', appName: 'MSIE', appVersion: '9.0'},
        name: 'MSIE',
        version: '9.0',
        mobile: false,
        supported: false
    },
    {
        navigator: {userAgent: 'Trident/7.0; rv:11.0', appName: 'MSIE', appVersion: '11.0'},
        name: 'MSIE',
        version: '11.0',
        mobile: false,
        supported: true
    },
    {
        navigator: {
            userAgent: 'Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
            appName: '',
            appVersion: ''
        },
        name: 'Edge',
        version: '14.14393',
        mobile: false,
        supported: true
    },
    {
        navigator: {
            userAgent: 'Chrome/51.0.2704.79 Safari/537.36 Edge/12.0',
            appName: '',
            appVersion: ''
        },
        name: 'Edge',
        version: '12.0',
        mobile: false,
        supported: false
    },
    // The RegExp allows any browser with Googlebot in the User-Agent
    {
        navigator: {userAgent: 'Googlebot/2.1', appName: '', appVersion: ''},
        // The detectBrowser method doesn't match on Googlebot and its version
        name: '',
        version: '',
        // Default value of mobile
        mobile: false,
        supported: true
    },
    // The RegExp allows any browser with AdsBot-Google in the User-Agent
    {
        navigator: {userAgent: 'AdsBot-Google', appName: '', appVersion: ''},
        // The detectBrowser method doesn't match on AdsBot-Google and its version
        name: '',
        version: '',
        // Default value of mobile
        mobile: false,
        supported: true
    },
    {
        navigator: {userAgent: 'SamsungBrowser/6.2', appName: '', appVersion: ''},
        name: 'SamsungBrowser',
        version: '6.2',
        mobile: false,
        supported: true
    },
    {
        navigator: {userAgent: 'SamsungBrowser/3.2', appName: '', appVersion: ''},
        name: 'SamsungBrowser',
        version: '3.2',
        mobile: false,
        supported: false
    },
    {
        navigator: {userAgent: 'Firefox/45.0', appName: '', appVersion: ''},
        name: 'Firefox',
        version: '45.0',
        mobile: false,
        supported: true
    },
    {
        navigator: {userAgent: 'Chrome 53.0 Mobile', appName: '', appVersion: ''},
        name: 'Chrome',
        version: '53.0',
        mobile: true,
        supported: true
    },
    {
        navigator: {userAgent: 'Chrome 52.0 Mobile', appName: '', appVersion: ''},
        name: 'Chrome',
        version: '52.0',
        mobile: true,
        supported: false
    },
    {
        navigator: {
            userAgent: 'Version/9.0 Mobile/13A404 Safari/601.1',
            appName: '',
            appVersion: ''
        },
        name: 'Safari',
        version: '9.0',
        mobile: true,
        supported: true
    },
    {
        navigator: {
            userAgent: 'Version/8.0 Mobile/13A404 Safari/601.1',
            appName: '',
            appVersion: ''
        },
        name: 'Safari',
        version: '8.0',
        mobile: true,
        supported: false
    }
]

describe('Test browser detection', () => {
    testCases.forEach((testCase) => {
        test(`Test browser userAgent, name, version and mobile values for ${testCase.name}/${
            testCase.version
        } (${testCase.mobile ? 'mobile' : 'desktop'})`, () => {
            const browser = detectBrowser(testCase.navigator)

            expect(
                browser.userAgent,
                `Expected ${browser.userAgent} to equal ${browser.userAgent.toLowerCase()}`
            ).toEqual(browser.userAgent.toLowerCase()) // detectBrowser returns lowercase userAgent

            expect(browser.name, `Expected ${browser.name} to equal ${testCase.name}`).toEqual(
                testCase.name.toLowerCase()
            ) // detectBrowser returns lowercase name

            expect(
                browser.version,
                `Expected ${browser.version} to equal ${testCase.version}`
            ).toEqual(testCase.version)

            expect(
                browser.mobile,
                `Expected ${browser.mobile} to equal ${testCase.mobile}`
            ).toEqual(testCase.mobile)
        })
    })
})

describe('Test browser support', () => {
    testCases.forEach((testCase) => {
        test(`Test browser support for ${testCase.name}/${testCase.version} (${
            testCase.mobile ? 'mobile' : 'desktop'
        })`, () => {
            const browser = detectBrowser(testCase.navigator)
            const browserCompatible = checkBrowserCompatibility(browser, supportedBrowsersList)

            expect(
                browserCompatible,
                `Expected ${testCase.name}/${testCase.version} to be${
                    testCase.supported ? ' ' : ' un'
                }supported`
            ).toEqual(testCase.supported)
        })
    })
})
