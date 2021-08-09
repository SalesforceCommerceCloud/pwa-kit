/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import {
    documentWriteSupported,
    extractPathFromURL,
    getChromeVersion,
    isChrome68OrHigher,
    getFirefoxVersion,
    iOSBrowser,
    isFirefoxBrowser,
    isLocalStorageAvailable,
    browserSupportsMessaging,
    isSamsungBrowser,
    isSessionStorageAvailable,
    loadScript,
    loadScriptAsPromise,
    preventDesktopSiteFromRendering,
    urlToBasicPathKey,
    urlToPathKey,
    validatePageNumber,
    runningServerSide,
    isStandalone,
    isCrawler,
    buildQueryString,
    splitFullName,
    getCookieValue,
    getPath,
    getURL,
    stripEvent,
    prefetchLink,
    isDataURL
} from './utils'

import {createAction} from './action-creation'

import sinon from 'sinon'

const sandbox = sinon.sandbox.create()

afterEach(() => sandbox.restore())

describe('extractPathFromURL', () => {
    test('returns its input if it is already a path', () => {
        ;['/index.html', '/products/product.html?id=1450', '/products/1450#test'].forEach(
            (path) => {
                expect(extractPathFromURL(path, true)).toBe(path)
            }
        )
    })

    test('extracts the path from URLs with no query or hash', () => {
        ;[false, true].forEach((includeHash) => {
            expect(extractPathFromURL('http://www.mobify.com/test', includeHash)).toBe('/test')
        })
    })

    test('extracts the path and query from URLs with a query but no hash', () => {
        ;[false, true].forEach((includeHash) => {
            expect(extractPathFromURL('https://localhost:8443/test?id=5', includeHash)).toBe(
                '/test?id=5'
            )
        })
    })

    test('extracts path and query but no hash if includeHash not provided (defaulting to false)', () => {
        expect(extractPathFromURL('https://localhost:8443/test?id=5#lower')).toBe('/test?id=5')
    })

    test('extracts path and query but no hash if includeHash is false', () => {
        expect(extractPathFromURL('https://localhost:8443/test?id=5#lower', false)).toBe(
            '/test?id=5'
        )
    })

    test('extracts path, query, and hash if includeHash is true', () => {
        expect(extractPathFromURL('https://localhost:8443/test?id=5#lower', true)).toBe(
            '/test?id=5#lower'
        )
    })

    test('extracts path but no query or hash if includeHash is false and includeQuery is false', () => {
        expect(extractPathFromURL('https://localhost:8443/test?id=5#lower', false, false)).toBe(
            '/test'
        )
    })
})

describe('urlToPathKey', () => {
    test('extracts path and query from full URLs (excluding hash)', () => {
        const testCases = [
            {input: 'http://www.mobify.com/test', output: '/test'},
            {input: 'https://localhost:8443/test?id=5#lower', output: '/test?id=5'},
            {input: '/test?id=5#lower', output: '/test?id=5'}
        ]

        testCases.forEach((testCase) => {
            expect(urlToPathKey(testCase.input)).toBe(testCase.output)
        })
    })

    test('urlToBasicPathKey', () => {
        expect(urlToBasicPathKey('http://www.mobify.com/test')).toBe('/test')
    })
})

describe('isSamsungBrowser', () => {
    test('returns true when userAgent is SamsungBrowser', () => {
        const userAgent = 'Mozilla/5.0 ... SamsungBrowser'
        expect(isSamsungBrowser(userAgent, true))
    })

    test('returns true when Chrome version is below 28', () => {
        const userAgent = 'Mozilla/5.0 ... Chrome/27.0.1500.94 Safari/537.36'
        expect(isSamsungBrowser(userAgent, true))
    })

    test('returns false when userAgent chrome version is above 28 ', () => {
        const userAgent = 'Mozilla/5.0 ... Chrome/30.0.1599.92 Mobile Safari/537.36'
        expect(isSamsungBrowser(userAgent, false))
    })

    test('returns false when user Agent passes google page speed insights', () => {
        const userAgent = 'Mozilla/5.0 ... SamsungBrowser Google Page Speed Insights'
        expect(isSamsungBrowser(userAgent, false))
    })
})

describe('isFirefoxBrowser', () => {
    test('returns true when userAgent is Firefox', () => {
        const userAgent = 'Mozilla/5.0 ... Firefox'
        expect(isFirefoxBrowser(userAgent, true))
    })

    test('returns true when userAgent is iOS Firefox', () => {
        const userAgent = 'Mozilla/5.0 ... FxiOS'
        expect(isFirefoxBrowser(userAgent, true))
    })
})

describe('validatePageNumber', () => {
    test('returns 1 if page is not a number', () => {
        const page = 'Page 22'
        expect(validatePageNumber(page)).toBe(1)
    })

    test('returns 1 if page is less than 1', () => {
        const page = -6
        expect(validatePageNumber(page)).toBe(1)
    })

    test('returns page count if page is greater than page count', () => {
        const page = 100
        const count = 10
        expect(validatePageNumber(page, count)).toBe(10)
    })

    test('returns page if valid', () => {
        const page = 2
        const count = 10
        expect(validatePageNumber(page, count)).toBe(page)
    })
})

describe('isLocalStorageAvailable', () => {
    afterEach(() => {
        localStorage.clear()
        localStorage.getItem.mockRestore()
    })

    test('returns true when local storage is available', () => {
        expect(isLocalStorageAvailable()).toBe(true)
    })

    test('returns false when accessing local storage throws', () => {
        localStorage.getItem.mockImplementation(() => {
            throw new Error()
        })

        expect(isLocalStorageAvailable()).toBe(false)
    })

    test("returns false when local storage doesn't retain what is set", () => {
        localStorage.getItem.mockImplementation(() => {
            return undefined
        })

        expect(isLocalStorageAvailable()).toBe(false)
    })
})

describe('isSessionStorageAvailable', () => {
    afterEach(() => {
        localStorage.clear()
        localStorage.getItem.mockRestore()
    })

    test('returns true when local storage is available', () => {
        expect(isSessionStorageAvailable()).toBe(true)
    })

    test('returns false when accessing local storage throws', () => {
        sessionStorage.getItem.mockImplementation(() => {
            throw new Error()
        })

        expect(isSessionStorageAvailable()).toBe(false)
    })

    test("returns false when local storage doesn't retain what is set", () => {
        sessionStorage.getItem.mockImplementation(() => {
            return undefined
        })

        expect(isSessionStorageAvailable()).toBe(false)
    })
})

describe('documentWriteSupported', () => {
    test('returns true when there is no connection data', () => {
        sandbox.stub(navigator, 'connection').value(undefined)
        expect(documentWriteSupported()).toBeTruthy()
    })

    test('returns true for a good connection', () => {
        sandbox.stub(navigator, 'connection').value({downlinkMax: 0.5})
        expect(documentWriteSupported()).toBeTruthy()
    })

    test('returns false for a bad connection downlinkMax', () => {
        sandbox.stub(navigator, 'connection').value({downlinkMax: 0.4})
        expect(documentWriteSupported()).toBeFalsy()
    })

    test('returns false for a bad connection downlink', () => {
        sandbox.stub(navigator, 'connection').value({downlink: 0.38})
        expect(documentWriteSupported()).toBeFalsy()
    })

    test('returns false for a bad connection effectiveType 2g', () => {
        sandbox.stub(navigator, 'connection').value({effectiveType: '2g'})
        expect(documentWriteSupported()).toBeFalsy()
    })

    test('returns false for a bad connection effectiveType slow-2g', () => {
        sandbox.stub(navigator, 'connection').value({effectiveType: 'slow-2g'})
        expect(documentWriteSupported()).toBeFalsy()
    })
})

describe('loadScript and loadScriptAsPromise', () => {
    let fakeScriptElement
    const headElement = document.getElementsByTagName('head')[0]
    const originalReadyState = document.readyState

    beforeEach(() => {
        fakeScriptElement = {
            id: null,
            src: null,
            async: null,
            charset: null,
            onload: null,
            onerror: null,
            dataset: {}
        }

        // Mock out createElement and body.appendChild so that we don't have
        // to fetch an actual script
        sandbox.stub(document, 'createElement').returns(fakeScriptElement)
        sandbox.stub(headElement, 'appendChild')
        sandbox.stub(document, 'write')

        Object.defineProperty(document, 'readyState', {
            value: 'loading',
            writable: true
        })

        // If you need to actually see the logging from these modules,
        // change these `.stub()` calls to `.spy()`. Tests won't be affected.
        sandbox.stub(console, 'log')
        sandbox.stub(console, 'warn')
    })

    afterAll(() => {
        sandbox.restore()
        document.readyState = originalReadyState
    })

    test('loadScriptAsPromise resolves after load', () => {
        const fakeOnload = sandbox.spy()

        const promise = loadScriptAsPromise({
            id: 'loadScriptAsPromiseTest',
            src: 'no-src-needed',
            onload: fakeOnload
        })

        // Make sure our mocks were used
        expect(document.createElement.called).toBe(true)
        expect(headElement.appendChild.called).toBe(true)

        // Check that onload wasn't called yet
        expect(fakeOnload.called).toBe(false)

        // Fake the load event for the script, which will call fakeOnload and
        // then resolve the Promise.
        setTimeout(fakeScriptElement.onload, 1)

        return promise.then(() => expect(fakeOnload.called).toBe(true))
    })

    test('loadScriptAsPromise rejects after error', () => {
        const fakeOnload = sandbox.spy()

        const promise = loadScriptAsPromise({
            id: 'loadScriptAsPromiseTest',
            src: 'no-src-needed',
            isAsync: false,
            onload: fakeOnload,
            rejectOnError: true
        })

        // Make sure our mocks were used
        expect(document.createElement.called).toBe(true)
        expect(headElement.appendChild.called).toBe(true)

        expect(fakeOnload.called).toBe(false)

        // Fake an error event for the script
        setTimeout(fakeScriptElement.onerror, 1)

        return promise.catch(() => {
            expect(fakeOnload.called).toBe(false)
        })
    })

    test('loadScriptAsPromise ignores onload parameter if not a function', () => {
        // no assertions needed... just make sure no errors thrown when
        // 'onload' is not a function
        const loadPromise = loadScriptAsPromise({
            id: 'loadScriptAsPromiseTest',
            src: 'no-src-needed',
            onload: 'not-a-function',
            rejectOnError: true
        })

        // Fake the load event for the script, which will resolve the loadPromise.
        setTimeout(fakeScriptElement.onload, 1)

        return loadPromise
    })

    test('loadScript defaults to using the DOM to load the script', () => {
        loadScript({
            id: 'loadScriptTest1',
            src: 'loadScriptTest1src'
        })
        expect(document.createElement.called).toBe(true)
        expect(headElement.appendChild.called).toBe(true)
        const element = headElement.appendChild.getCall(0).args[0]
        expect(element.id).toEqual('loadScriptTest1')
        expect(element.src).toEqual('loadScriptTest1src')
    })

    test('loadScript uses document.write when the flag is enabled', () => {
        loadScript({
            id: 'loadScriptTest1',
            src: 'loadScriptTest1src',
            docwrite: true
        })

        expect(document.write.called).toBe(true)
    })

    test('loadScript uses document.write when loadScriptAsPromise passes it as true', () => {
        const fakeOnload = sandbox.spy()

        loadScriptAsPromise({
            id: 'loadScriptAsPromiseTest',
            src: 'no-src-needed',
            docwrite: true,
            onload: fakeOnload
        })

        expect(document.createElement.called).toBe(false)
        expect(headElement.appendChild.called).toBe(false)
        expect(document.write.called).toBe(true)
    })

    test('loadScript aborts if it finds the requested script has already been attempted', () => {
        sandbox.stub(document, 'querySelectorAll').returns([1])

        loadScript({
            id: 'loadScriptTest1',
            src: 'loadScriptTest1src'
        })

        // Shouldn't have tried either method of inserting the script
        expect(document.createElement.called).toBe(false)
        expect(headElement.appendChild.called).toBe(false)
        expect(document.write.called).toBe(false)
    })

    test('loadScript throws if `onload` is provided but is not a function', () => {
        expect(() => {
            loadScript({
                src: 'loadScriptTest2src',
                onload: 'onload expects this to be a function'
            })
        }).toThrow()
    })

    test('loadScript throws if `onerror` is provided but is not a function', () => {
        expect(() => {
            loadScript({
                src: 'loadScriptTest2src',
                onerror: 'onerror expects this to be a function'
            })
        }).toThrow()
    })
})

describe('preventDesktopSiteFromRendering', () => {
    test("does nothing when there's already a plaintext tag", () => {
        sandbox.stub(document, 'querySelectorAll').returns(['xyz'])
        const docWrite = sandbox.stub(document, 'write')

        preventDesktopSiteFromRendering()

        expect(docWrite.called).toBe(false)
    })

    test('adds the plaintext tag', () => {
        sandbox.stub(document, 'querySelectorAll').returns([])
        const docWrite = sandbox.stub(document, 'write')

        preventDesktopSiteFromRendering()

        expect(docWrite.calledWith('<plaintext style="display: none;">')).toBe(true)
    })
})

describe('getChromeVersion', () => {
    test('returns zero for non-Chrome', () => {
        expect(
            getChromeVersion(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0'
            )
        ).toBe(0)
        expect(
            getChromeVersion(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8'
            )
        ).toBe(0)
    })

    test('returns the Chrome version', () => {
        expect(
            getChromeVersion(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
            )
        ).toBe(60)
    })
})

describe('isChrome68OrHigher', () => {
    test('returns false for non-Chrome', () => {
        expect(
            isChrome68OrHigher(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0'
            )
        ).toBe(false)
        expect(
            isChrome68OrHigher(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8'
            )
        ).toBe(false)
    })

    test('returns false for Chrome versions less than 68', () => {
        expect(
            isChrome68OrHigher(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
            )
        ).toBe(false)
    })

    test('returns true for Chrome versions equal or greather than 68', () => {
        expect(
            isChrome68OrHigher(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3112.101 Safari/537.36'
            )
        ).toBe(true)

        expect(
            isChrome68OrHigher(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3112.101 Safari/537.36'
            )
        ).toBe(true)
    })
})

describe('getFirefoxVersion', () => {
    test('returns zero for non-Firefox', () => {
        expect(
            getFirefoxVersion(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
            )
        ).toBe(0)
        expect(
            getFirefoxVersion(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8'
            )
        ).toBe(0)
    })

    test('returns the Firefox version', () => {
        expect(
            getFirefoxVersion(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0'
            )
        ).toBe(54)
    })
})

describe('iOSBrowser', () => {
    test('identifies iOS correctly', () => {
        expect(
            iOSBrowser(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'
            )
        ).toBe(false)
        expect(
            iOSBrowser(
                'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1'
            )
        ).toBe(true)
        expect(
            iOSBrowser(
                'Mozilla/5.0 (iPad; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4'
            )
        ).toBe(true)
    })
})

describe('browserSupportsMessaging', () => {
    let windowNavigator
    let windowNotification

    beforeEach(() => {
        windowNavigator = window.navigator
        window.navigator = window.Navigator = {}
        window.navigator.serviceWorker = {}
        windowNotification = window.Notification
        window.Notification = windowNotification || {}
    })

    afterEach(() => {
        window.navigator = windowNavigator
        window.Notification = windowNotification
    })

    const defaultUA =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36'

    test("uses the global's `navigator` to get userAgent if not provided", () => {
        expect(browserSupportsMessaging()).toBe(false)
    })

    test("returns false if service worker isn't supported", () => {
        window.navigator.serviceWorker = null
        expect(browserSupportsMessaging(defaultUA)).toBe(false)
    })

    test("returns false if Notification isn't supported", () => {
        window.Notification = null
        expect(browserSupportsMessaging(defaultUA)).toBe(false)
    })

    test('returns false for Chrome < 46', () => {
        expect(
            browserSupportsMessaging(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.3112.101 Safari/537.36'
            )
        ).toBe(false)
    })

    test('returns false for Firefox < 46', () => {
        expect(
            browserSupportsMessaging(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/45.0'
            )
        ).toBe(false)
    })

    test('returns false for iOS Chrome > 46', () => {
        expect(
            browserSupportsMessaging(
                'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1'
            )
        ).toBe(false)
    })

    test('returns false for iOS Firefox > 46', () => {
        expect(
            browserSupportsMessaging(
                'Mozilla/5.0 (iPad; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4'
            )
        ).toBe(false)
    })

    test('returns true for Chrome > 46', () => {
        expect(browserSupportsMessaging(defaultUA)).toBe(true)
    })

    test('returns true for Firefox > 46', () => {
        expect(
            browserSupportsMessaging(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0'
            )
        ).toBe(true)
    })

    test('uses navigation.userAgent when no userAgent provided', () => {
        // Expecting the "node" user agent which should be unsupported.
        expect(browserSupportsMessaging()).toBe(false)
    })
})

describe('isStandalone', () => {
    let windowLocationStub
    // let matchMediaStub
    beforeAll(() => {
        window.matchMedia = () => ({matches: undefined})
        windowLocationStub = sinon.stub(window.location, 'href')
        // matchMediaStub = sinon.stub(window, 'matchMedia')
    })

    afterAll(() => {
        windowLocationStub.resetBehavior()
        // matchMediaStub.resetBehavior()
        window.matchMedia = undefined
    })

    test('isStandalone returns true if URL contains "homescreen=1"', () => {
        global.jsdom.reconfigure({url: 'https://www.merlinspotions.com/?homescreen=1'})

        expect(isStandalone()).toBe(true)
    })

    test('isStandalone returns false if URL does not contain "homescreen=1"', () => {
        global.jsdom.reconfigure({url: 'https://www.merlinspotions.com/'})

        expect(isStandalone()).toBeFalsy()
    })

    test('isStandalone returns true if URL does not contain "homescreen=1" but standalone media query is true', () => {
        global.jsdom.reconfigure({url: 'https://www.merlinspotions.com/'})
        sinon.stub(window, 'matchMedia').returns({matches: true})

        expect(isStandalone()).toBe(true)
    })

    test('isStandalone doesnt throw an error if matchMedia doesnt exist', () => {
        window.matchMedia = undefined
        let noErrorThrown = true

        try {
            isStandalone()
        } catch (e) {
            noErrorThrown = false
        }

        expect(noErrorThrown).toBe(true)
    })
})

describe('isCrawler()', () => {
    const windowNavigatorUserAgent = window.navigator.userAgent

    afterEach(() => {
        window.navigator.userAgent = windowNavigatorUserAgent
    })

    test('Check if the web crawler is true', () => {
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'googlebot',
            writable: true
        })

        expect(isCrawler()).toBe(true)
    })

    test('Check if the web crawler is false', () => {
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'something'
        })
        expect(isCrawler()).toBe(false)
    })
})

describe('buildQueryString', () => {
    const queryString = '?q='

    test('returns its input if it is already a path', () => {
        ;['something', '?n=John&n=Susan', '&amp;title=The+title+of+a+post'].forEach((query) => {
            expect(buildQueryString(query)).toBe(`${queryString}${query}`)
        })
    })
})

describe('splitFullName', () => {
    const name = {
        first: 'John',
        last: 'Smith'
    }

    test('if there is no parameter in function and return empty object', () => {
        expect(splitFullName()).toMatchObject({})
    })

    test('transform full name into an object', () => {
        expect(splitFullName(`${name.first} ${name.last}`)).toMatchObject({
            firstname: `${name.first}`,
            lastname: `${name.last}`
        })
    })
})

describe('getCookieValue', () => {
    afterEach(() => {
        document.cookie = ''
    })

    test('get the value of cookie', () => {
        const cookieValue = 'World'
        document.cookie = `test2=${cookieValue}`
        expect(getCookieValue('test2')).toBe(cookieValue)
    })

    test('return empty if cookie does not exist', () => {
        document.cookie = `test1=something`
        expect(getCookieValue('no-cookie')).toBe('')
    })
})

describe('getPath', () => {
    test('get the value of path', () => {
        const object = {
            pathname: 'product',
            search: '?post=1234&action=edit'
        }
        expect(getPath(object)).toBe(`${object.pathname}${object.search}`)
    })
})

describe('getURL', () => {
    const windowLocationOrigin = 'https://www.mobify.com'

    afterEach(() => {
        window.location = ''
    })

    beforeEach(() => {
        global.jsdom.reconfigure({
            url: windowLocationOrigin
        })
    })

    test('get the value of URL', () => {
        const pathName = '/product'
        const searchQuery = '?post=1234&action=edit'
        const object = {
            pathname: pathName,
            search: searchQuery
        }
        expect(getURL(object)).toBe(`${windowLocationOrigin}${object.pathname}${object.search}`)
    })
})

test('check if stripEvent is a function', () => {
    const createActionFunction = createAction('Test Action', ['a', 'b', 'c'])
    const action = createActionFunction(1, 2, 3)
    const stripEventFunction = stripEvent(action)

    expect(typeof stripEventFunction).toBe('function')
})

describe('prefetchLink function', () => {
    prefetchLink({href: 'path'})
    const linkElement = document.getElementsByTagName('head')[0].innerHTML
    test('Checks for attributes in link element', () => {
        ;['charset="([^\'"]+)', 'href="([^\'"]+)', 'rel="([^\'"]+)'].forEach((regex) => {
            const check = RegExp(regex, 'g')
            expect(check.test(linkElement)).toBe(true)
        })
    })
})

test('runningServerSide', () => {
    if (window.Progressive) {
        delete window.Progressive
    }
    expect(runningServerSide()).toBeFalsy()

    window.Progressive = {}
    expect(runningServerSide()).toBeFalsy()

    window.Progressive.isServerSide = false
    expect(runningServerSide()).toBeFalsy()

    window.Progressive.isServerSide = true
    expect(runningServerSide()).toBeTruthy()
})

describe('isDataURL', () => {
    const validDataURL =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const invalidDataURL = '/smile.gif'

    test('valid dataURL returns true', () => {
        expect(isDataURL(validDataURL)).toBeTruthy()
    })

    test('invalid dataURL returns false', () => {
        expect(isDataURL(invalidDataURL)).toBeFalsy()
    })
})

/* eslint-enable no-global-assign, no-native-reassign */
