/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
/* global jsdom */

import {
    getScriptOrigin,
    getBuildOrigin,
    initCacheManifest,
    getAssetUrl,
    loadAsset,
    LOADER_SCRIPT_ID,
    PREVIEW_SCRIPT_ID,
    clearOrigin,
    loadScript,
    isDataURL,
    isInternalLink
} from './assets'

import sinon from 'sinon'

const sandbox = sinon.sandbox.create()

// Silence the error messages, they're on purpose here
let consoleError
beforeEach(() => {
    consoleError = console.error
    console.error = jest.fn()
})
afterEach(() => {
    clearOrigin()
    console.error = consoleError
    sandbox.restore()
})

describe('getScriptOrigin', () => {
    test('should return null if the argument is null', () => {
        expect(getScriptOrigin(null)).toBe(null)
    })

    test('should return the origin of the script src', () => {
        const scriptEl = document.createElement('script')
        scriptEl.src = 'https://www.mobify.com/test.js'

        expect(getScriptOrigin(scriptEl)).toBe('https://www.mobify.com/')
    })
})

describe('getBuildOrigin', () => {
    afterEach(() => {
        const scripts = Array.from(document.getElementsByTagName('script'))
        scripts.forEach((script) => script.parentElement.removeChild(script))
    })

    test("should return the default origin if it can't find the right script", () => {
        expect(document.getElementsByTagName('script').length).toBe(0)

        expect(getBuildOrigin()).toBe('//0.0.0.0:8443/')
    })

    test('should return the origin of whatever script has the preview ID', () => {
        const scriptEl = document.createElement('script')
        scriptEl.src = 'http://www.mobify.com/bundle.js'
        scriptEl.id = PREVIEW_SCRIPT_ID

        document.body.appendChild(scriptEl)

        expect(getBuildOrigin()).toBe('http://www.mobify.com/')
    })

    test('should identify loader.js by id', () => {
        const scriptEl1 = document.createElement('script')
        scriptEl1.src = 'http://cdn1.mobify.com/loader.js'
        scriptEl1.id = LOADER_SCRIPT_ID
        document.body.appendChild(scriptEl1)

        expect(getBuildOrigin()).toBe('http://cdn1.mobify.com/')
    })

    test('should identify loader.js by domain', () => {
        const scriptEl1 = document.createElement('script')
        scriptEl1.src = 'http://cdn1.mobify.com/loader.js'
        scriptEl1.id = 'some-other-id'
        document.body.appendChild(scriptEl1)

        expect(getBuildOrigin()).toBe('http://cdn1.mobify.com/')
    })

    test('should return the origin of only a Mobify CDN loader.js', () => {
        const scriptEl1 = document.createElement('script')
        scriptEl1.src = 'https://cdn.mobify.com/loader.js'
        document.body.appendChild(scriptEl1)

        const scriptEl2 = document.createElement('script')
        scriptEl2.src = 'https://cdn.thirdparty.com/loader.js'
        document.body.appendChild(scriptEl2)

        // Insert potential false positive, i.e. script containing the text
        // `loader.js`, as well as `mobify` in the domain name
        const scriptEl3 = document.createElement('script')
        scriptEl3.src = 'https://webpush-cdn.mobify.net/webpush-client-loader.min.js'
        document.body.appendChild(scriptEl3)

        expect(getBuildOrigin()).toBe('https://cdn.mobify.com/')
    })

    test('should also handle adaptive.min.js', () => {
        const scriptEl = document.createElement('script')
        scriptEl.src = 'https://cdn99.mobify.com/adaptive.min.js'
        document.body.appendChild(scriptEl)

        expect(getBuildOrigin()).toBe('https://cdn99.mobify.com/')
    })

    test('should return arbitrary `loader.js` if loaded via v7 tag', () => {
        window.Mobify = window.Mobify || {}
        window.Mobify.tagVersion = [7, 0]

        const scriptEl1 = document.createElement('script')
        scriptEl1.src = 'https://192.168.1.1:8443/loader.js'
        document.body.appendChild(scriptEl1)

        // Insert potential false positive, i.e. script containing the text
        // `loader.js`, as well as `mobify` in the domain name
        const scriptEl2 = document.createElement('script')
        scriptEl2.src = 'https://webpush-cdn.mobify.net/webpush-client-loader.min.js'
        document.body.appendChild(scriptEl2)

        expect(getBuildOrigin()).toBe('https://192.168.1.1:8443/')
    })

    test("should return the default origin if it can't find the right script", () => {
        const scriptEl = document.createElement('script')
        scriptEl.src = 'http://www.bundle-host.com/'
        document.body.appendChild(scriptEl)

        expect(getBuildOrigin()).toBe('//0.0.0.0:8443/')
    })

    test('stop building origin on further appended scripts', () => {
        initCacheManifest({hashes: {}, buildDate: 65536})

        const scriptEl1 = document.createElement('script')
        scriptEl1.src = 'http://cdn1.mobify.com/loader.js'
        scriptEl1.id = LOADER_SCRIPT_ID

        const scriptEl2 = document.createElement('script')
        scriptEl2.src =
            "https://f.monetate.net/?r='https://cdn.mobify.com/loader.js%26disabled%3D0%26domain%3D"

        document.body.appendChild(scriptEl1)
        expect(getBuildOrigin()).toBe('http://cdn1.mobify.com/')
        document.body.appendChild(scriptEl2)
        expect(getBuildOrigin()).toBe('http://cdn1.mobify.com/')
    })

    test('should use window.Progressive.buildOrigin if set', () => {
        window.Progressive = window.Progressive || {}
        const old = window.Progressive.buildOrigin
        window.Progressive.buildOrigin = 'https://an.origin.somewhere'

        try {
            expect(getBuildOrigin()).toBe(window.Progressive.buildOrigin)
        } finally {
            window.Progressive.buildOrigin = old
        }
    })
})

describe('getAssetUrl', () => {
    test('returns the path with base url and cache breaker if all provided', () => {
        expect(getAssetUrl('test.png', 'http://localhost:3333/', 'abcdef')).toBe(
            'http://localhost:3333/test.png?abcdef'
        )
    })

    test('falls back to the build origin if no baseUrl is provided', () => {
        expect(getAssetUrl('test.png', null, 'fcdabe')).toBe('//0.0.0.0:8443/test.png?fcdabe')
    })

    test('gets the cache breaker from the hash manifest if not provided', () => {
        initCacheManifest({hashes: {'test.png': 123456}})
        expect(getAssetUrl('test.png')).toBe('//0.0.0.0:8443/test.png?123456')
    })

    test('falls back to the build date if the hash is not found', () => {
        initCacheManifest({hashes: {}, buildDate: 65536})
        expect(getAssetUrl('test.png')).toBe('//0.0.0.0:8443/test.png?65536')
    })

    test('omits the cachebreaker if there is no manifest', () => {
        initCacheManifest()
        expect(getAssetUrl('test.png')).toBe('//0.0.0.0:8443/test.png')
    })
})

/* eslint-disable max-nested-callbacks */
describe('loadAsset', () => {
    test('loadAsset adds the specified type of node with the given options', () => {
        const scripts = Array.from(document.getElementsByTagName('script'))
        scripts.forEach((script) => script.parentElement.removeChild(script))

        const firstScript = document.createElement('script')
        firstScript.src = 'placeholder.js'
        document.body.appendChild(firstScript)
        const nodeAttributes = {
            link: {href: 'stylesheet.css', rel: 'stylesheet'},
            script: {src: 'more-code.js'}
        }
        Object.keys(nodeAttributes).forEach((type) => {
            const attributes = nodeAttributes[type]
            loadAsset(type, attributes)

            const nodes = document.body.children
            expect(nodes[1].tagName).toBe('SCRIPT')
            expect(nodes[1].src).toBe('http://localhost/placeholder.js')
            expect(nodes[0].tagName).toBe(type.toUpperCase())
            Object.keys(attributes).forEach((name) => {
                expect(nodes[0].getAttribute(name)).toBe(attributes[name])
            })
            document.body.removeChild(nodes[0])
        })
    })
})

describe('loadScript', () => {
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

describe('isInternalLink', () => {
    const externalURLs = [
        'https://www.mobify.com/react/test',
        'http://localhost:8080/path',
        'https://localhost/path',
        'https://localhost',
        "javascript:alert('Hello');",
        'mailto:admin@mobify.com'
    ]
    const internalURLs = [
        '/',
        '/path/test.html',
        'http://localhost/path',
        '//localhost',
        '//localhost/path'
    ]

    const windowLocationOrigin = 'http://localhost'

    beforeAll(() => {
        jsdom.reconfigure({
            url: windowLocationOrigin
        })
    })

    test('external URLs returns true', () => {
        externalURLs.forEach((href) => {
            expect(isInternalLink(href)).toBeFalsy()
        })
    })

    test('internal URLs returns false', () => {
        internalURLs.forEach((href) => {
            expect(isInternalLink(href)).toBeTruthy()
        })
    })
})
