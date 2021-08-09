/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {
    capturingIsLoaded,
    jQueryIsLoaded,
    jqueryResponse,
    setGetter,
    setWaitTimeout,
    waitForCondition,
    waitForDependencies
} from './jquery-response'

import getJQueryHtml from './get-jquery-html'

const sinon = require('sinon')
const jquery = require('jquery')

const oldTimeout = setWaitTimeout(155)
const originalDOMParser = window.DOMParser
const sandbox = sinon.sandbox.create()

const EMPTY_HTML_TEXT = ''
const FULL_HTML_TEXT =
    '<html><head><title>ABC</title></head><body><div><p>XYZ</p></div></body></html>'
const PARTIAL_HTML_TEXT = '<div><span>ABC</span></div><div><strong>XYZ</strong></div><em>test</em>'
const DOCTYPE_HTML_TEXT =
    '<!DOCTYPE html><html><head><title>ABC</title></head><body><div><p>XYZ</p></div></body></html>'
const COMMENTED_HTML_TEXT = '<!--ABC--><div><p>XYZ</p></div>'

// Create a spy function to wrap getJQueryHtml
const getJQueryHtmlSpy = sinon.spy((selectorLibrary, responseHTML) =>
    getJQueryHtml(selectorLibrary, responseHTML)
)
setGetter(getJQueryHtmlSpy)

afterAll(() => {
    setWaitTimeout(oldTimeout)
})

afterEach(() => {
    sandbox.restore()
    window.DOMParser = originalDOMParser
})

beforeEach(() => {
    getJQueryHtmlSpy.reset()
    window.Capture = {disable: sandbox.stub()}
    window.$ = jquery
    window.Progressive = {$: jquery}
})

describe('waitForCondition', () => {
    const condition = sinon.stub()
    beforeEach(() => {
        condition.reset()
    })

    test('Resolves immediately when the condition is true', () => {
        condition.onCall(0).returns(true)

        return waitForCondition(condition).then(() => {
            expect(condition.callCount).toEqual(1)
        })
    })
    /* This test is flakey on CircleCI due a race condition behaviour.
    TODO: Revisit and fix */
    test.skip('Resolves when the condition becomes true', () => {
        condition.onCall(0).returns(false)
        condition.onCall(1).returns(true)

        return waitForCondition(condition).then(() => {
            expect(condition.callCount > 1, 'Expected condition to be called more than once').toBe(
                true
            )
        })
    })

    test('Rejects if the condition never becomes true', () => {
        condition.onCall(0).returns(false)

        return waitForCondition(condition)
            .then(() => {
                expect(true, 'Did not expect success').toBe(false)
            })
            .catch((cond) => {
                expect(cond).toBe(condition)
            })
    })
})

describe('waitForDependencies checks ssrOptions flags', () => {
    const $ = jquery
    const capture = {disable: sinon.stub()}

    window.Progressive = {}

    const testCases = [
        {
            name: 'Non-universal, no ssrOptions set',
            isUniversal: false,
            $,
            capture
        },
        {
            name: 'Universal, no ssrOptions set',
            isUniversal: true,
            $,
            ssrOptions: {}
        },
        {
            name: 'Universal, all ssrOptions set',
            isUniversal: true,
            $,
            capture,
            ssrOptions: {
                loadCaptureJS: true,
                loadJQuery: true
            }
        },
        {
            name: 'Universal, all ssrOptions set, no JQuery',
            isUniversal: true,
            $: undefined,
            capture,
            ssrOptions: {
                loadCaptureJS: true,
                loadJQuery: true
            },
            expectError: 'jQuery did not load'
        },
        {
            name: 'Universal, all ssrOptions set, no capturing',
            isUniversal: true,
            $,
            capture: undefined,
            ssrOptions: {
                loadCaptureJS: true,
                loadJQuery: true
            },
            expectError: 'capturing did not load'
        }
    ]

    testCases.forEach((testCase) =>
        test(testCase.name, () => {
            window.Progressive.isUniversal = testCase.isUniversal
            window.Progressive.ssrOptions = testCase.ssrOptions
            window.Capture = testCase.capture
            window.$ = window.Progressive.$ = testCase.$

            let error

            return waitForDependencies()
                .catch((err) => {
                    // eslint-disable-line max-nested-callbacks
                    error = err
                })
                .then(() => {
                    // eslint-disable-line max-nested-callbacks
                    if (testCase.expectError) {
                        expect(error, 'Expected error to be defined').toBeDefined()
                        expect(
                            error.message.includes(testCase.expectError),
                            `Expected error message to contain '${testCase.expectedError}'`
                        ).toBe(true)
                    } else {
                        expect(error, 'Expected error to be undefined').not.toBeDefined()
                    }
                })
        })
    )
})

describe('capturingIsLoaded', () => {
    test('checks for window.Capture', () => {
        window.Capture = undefined
        expect(capturingIsLoaded()).toBe(false)
        window.Capture = {}
        expect(capturingIsLoaded()).toBe(true)
    })
})

describe('jQueryIsLoaded', () => {
    test('checks for window.$', () => {
        window.$ = window.Progressive.$ = undefined
        expect(jQueryIsLoaded()).toBe(false)
        window.$ = {}
        expect(jQueryIsLoaded()).toBe(true)
    })

    test('checks for window.Progressive.$', () => {
        window.$ = window.Progressive.$ = undefined
        expect(jQueryIsLoaded()).toBe(false)
        window.Progressive.$ = {}
        expect(jQueryIsLoaded()).toBe(true)
    })
})

describe('jqueryResponse', () => {
    let parser

    test('response text is parsed using (local) jQuery', () => {
        return jqueryResponse({text: () => Promise.resolve(FULL_HTML_TEXT)}).then(
            // eslint-disable-next-line no-unused-vars
            ([selectorLib, jqueryObject]) => {
                expect(
                    getJQueryHtmlSpy.calledWith(jquery, FULL_HTML_TEXT),
                    'jQuery getter should be called'
                ).toBe(true)
                // verifyResult(jqueryObject)
            }
        )
    })

    describe('Parsing tests', () => {
        beforeEach(() => {
            parser = new window.DOMParser()

            window.Progressive = {
                $: jquery,
                isUniversal: true
            }
        })

        test('response text is NOT parsed using jQuery', () => {
            return jqueryResponse({text: () => Promise.resolve(FULL_HTML_TEXT)}).then(
                // eslint-disable-next-line no-unused-vars
                ([selectorLib, jqueryObject]) => {
                    expect(
                        getJQueryHtmlSpy.calledWith(jquery, FULL_HTML_TEXT),
                        'jQuery getter should be called'
                    ).not.toBe(true)
                }
            )
        })

        test('uses DOMParser in a UPWA', () => {
            const parseFromString = sandbox.spy((text, type) => parser.parseFromString(text, type))
            class TestDOMParser {
                parseFromString(text, type) {
                    return parseFromString(text, type)
                }
            }
            window.DOMParser = TestDOMParser
            window.Capture = undefined

            // eslint-disable-next-line no-unused-vars
            return jqueryResponse(FULL_HTML_TEXT).then(([selectorLib, dom]) => {
                expect(selectorLib).toBe(jquery)
                expect(parseFromString.calledWith(FULL_HTML_TEXT, 'text/html')).toBe(true)
            })
        })

        test('uses timer', () => {
            const parseFromString = sandbox.spy((text, type) => parser.parseFromString(text, type))
            window.DOMParser = () => ({parseFromString})
            window.Capture = undefined
            window.Progressive = window.Progressive || {}
            const timer = (window.Progressive.ssrPerformanceTimer = {
                start: sinon.stub(),
                end: sinon.stub(),
                operationId: 1
            })

            try {
                // eslint-disable-next-line no-unused-vars
                return jqueryResponse(FULL_HTML_TEXT).then(([selectorLib, dom]) => {
                    expect(selectorLib).toBe(jquery)
                    expect(parseFromString.calledWith(FULL_HTML_TEXT, 'text/html')).toBe(true)
                    expect(timer.start.callCount).toBe(2)
                    expect(timer.end.callCount).toBe(2)
                })
            } finally {
                window.Progressive.ssrTimer = undefined
            }
        })

        test('falls back if DOMParser is not available', () => {
            window.Progressive = {
                $: jquery,
                isUniversal: true
            }
            delete window.DOMParser // simulate browser without DOMParser
            window.Capture = undefined

            // eslint-disable-next-line no-unused-vars
            return jqueryResponse(FULL_HTML_TEXT).then(([selectorLib, dom]) => {
                expect(selectorLib).toBe(jquery)
                expect(getJQueryHtmlSpy.calledWith(jquery, FULL_HTML_TEXT)).toBe(true)
            })
        })

        test('falls back if DOMParser fails', () => {
            const parseFromString = sandbox.spy(
                // We pass XML as the type to force a failure - the HTML parser
                // is hugely forgiving and will accept almost anything!
                (text) => parser.parseFromString(text, 'text/xml')
            )
            class TestDOMParser {
                parseFromString(text, type) {
                    return parseFromString(text, type)
                }
            }
            window.DOMParser = TestDOMParser
            window.Capture = undefined

            const bogusText = '<<this is bogus>'
            return jqueryResponse(bogusText).then(([selectorLib, dom]) => {
                expect(dom).toBeDefined()
                expect(selectorLib).toBe(jquery)
                expect(parseFromString.calledWith(bogusText, 'text/html')).toBe(true)
                expect(getJQueryHtmlSpy.calledWith(jquery, bogusText)).toBe(true)
                // We won't verify the results because the bogus text won't parse
            })
        })
    })
})

describe('Rendering of DOMParser (default) vs jQuery (fallback)', () => {
    const verifyAnyJQueryResult = (dom, msg) => {
        msg = msg || 'Verifying result'
        try {
            // The result will be an HTMLCollection of length 1, which holds
            // an HTMLHtmlElement with the parsed HTML elements as children.
            expect(dom.length, `${msg}: expected 1 element`).toEqual(1)
            expect(
                dom[0].tagName.toLowerCase(),
                `${msg}: expected the top element to be HTML`
            ).toEqual('html')

            const children = dom.children()
            expect(children.length, `${msg}: expected to find 2 children of the HTML node`).toEqual(
                2
            ) // these children are the head and body

            const head = dom.find('head:first-of-type')[0]
            expect(head, `${msg}: expected to find a HEAD`).toBeDefined()

            const body = dom.find('body:first-of-type')[0]
            expect(body, `${msg}: expected to find a BODY`).toBeDefined()
        } catch (err) {
            console.log(`${msg}: Error ${err}`)
            throw err
        }
    }

    const verifyFullJQueryResult = (dom, msg) => {
        verifyAnyJQueryResult(dom, msg)
        msg = msg || 'Verifying result'
        try {
            const head = dom.find('head:first-of-type')[0]
            const title = head.children[0]
            expect(title, `${msg}: expected to find a TITLE in the HEAD`).toBeDefined()

            const body = dom.find('body:first-of-type')[0]
            const div = body.children[0]
            expect(div, `${msg}: expected to find a DIV in the BODY`).toBeDefined()
        } catch (err) {
            console.log(`${msg}: Error ${err}`)
            throw err
        }
    }

    const verifyPartialJQueryResult = (dom, msg) => {
        verifyAnyJQueryResult(dom, msg)
        msg = msg || 'Verifying result'
        try {
            const head = dom.find('head:first-of-type')[0]
            const title = head.children[0]
            expect(title, `${msg}: expected to find a TITLE in the HEAD`).not.toBeDefined()
        } catch (err) {
            console.log(`${msg}: Error ${err}`)
            throw err
        }
    }

    const verifyDoctypeJQueryResult = (dom, msg) => {
        verifyAnyJQueryResult(dom, msg)
        msg = msg || 'Verifying result'
        try {
            const head = dom.find('head:first-of-type')[0]

            const title = head.children[0]
            expect(title, `${msg}: expected to find a TITLE in the HEAD`).toBeDefined()

            // The doctype should get stripped out
            const comment = dom[0]
            expect(comment).not.toBe(document.COMMENT_NODE)
        } catch (err) {
            console.log(`${msg}: Error ${err}`)
            throw err
        }
    }

    const verifyCommentedJQueryResult = (dom, msg) => {
        verifyAnyJQueryResult(dom, msg)
        msg = msg || 'Verifying result'
        try {
            const head = dom.find('head:first-of-type')[0]

            const title = head.children[0]
            expect(title, `${msg}: expected to find a TITLE in the HEAD`).not.toBeDefined()

            // The comment should get stripped out
            const comment = dom[0].nodeType
            expect(comment).not.toBe(document.COMMENT_NODE)
        } catch (err) {
            console.log(`${msg}: Error ${err}`)
            throw err
        }
    }

    const testCases = [
        ['Parsing w/ full html', FULL_HTML_TEXT, verifyFullJQueryResult],
        ['Parsing w/ empty html', EMPTY_HTML_TEXT, verifyAnyJQueryResult],
        ['Parsing w/ partial html', PARTIAL_HTML_TEXT, verifyPartialJQueryResult],
        ['Parsing w/ doctyped html', DOCTYPE_HTML_TEXT, verifyDoctypeJQueryResult],
        ['Parsing w/ commented html', COMMENTED_HTML_TEXT, verifyCommentedJQueryResult]
    ]

    const sharedResponseTests = (responseFunction) => {
        test('selector library should be jQuery', () => {
            return responseFunction({text: () => Promise.resolve(FULL_HTML_TEXT)}).then(
                // eslint-disable-next-line no-unused-vars
                ([selectorLib, jqueryObject]) => {
                    expect(selectorLib).toBe(jquery)
                }
            )
        })

        test('disables the HTML', () => {
            return responseFunction({text: () => Promise.resolve(FULL_HTML_TEXT)}).then(
                // eslint-disable-next-line no-unused-vars
                ([selectorLib, jqueryObject]) => {
                    expect(
                        window.Capture.disable.calledWith(FULL_HTML_TEXT, 'x-'),
                        'Capture.disabled should be called'
                    ).toBe(true)
                }
            )
        })

        test('accepts a String instead of a Response', () => {
            const $ = jquery
            window.Progressive = {}
            window.$ = $
            window.Capture = {disable: sandbox.stub()}
            window.Capture.disable.returns(FULL_HTML_TEXT)

            // eslint-disable-next-line no-unused-vars
            return responseFunction(FULL_HTML_TEXT).then(([selectorLib, jqueryObject]) => {
                expect(selectorLib).toBe(jquery)
                expect(window.Capture.disable.calledWith(FULL_HTML_TEXT, 'x-')).toBe(true)
                expect(getJQueryHtmlSpy.calledWith(jquery, FULL_HTML_TEXT)).toBe(true)
            })
        })

        test('works if the text() Promise is delayed', () => {
            const $ = jquery
            window.Progressive = {}
            window.$ = $
            window.Capture = {disable: sandbox.stub()}
            window.Capture.disable.returns(FULL_HTML_TEXT)

            // Don't return the text for 500mS
            const textPromise = new Promise((resolve) =>
                setTimeout(() => resolve(FULL_HTML_TEXT), 500)
            )

            // eslint-disable-next-line no-unused-vars
            return responseFunction(textPromise).then(([selectorLib, jqueryObject]) => {
                expect(selectorLib).toBe(jquery)
                expect(window.Capture.disable.calledWith(FULL_HTML_TEXT, 'x-')).toBe(true)
                expect(getJQueryHtmlSpy.calledWith(jquery, FULL_HTML_TEXT)).toBe(true)
            })
        })

        test('disables the HTML and passes it with (global) jQuery', () => {
            const $ = jquery
            window.Progressive = {}
            window.$ = $
            window.Capture = {disable: sandbox.stub()}
            window.Capture.disable.returns(FULL_HTML_TEXT)

            return responseFunction({text: () => Promise.resolve(FULL_HTML_TEXT)}).then(
                // eslint-disable-next-line no-unused-vars
                ([selectorLib, jqueryObject]) => {
                    expect(selectorLib).toBe(jquery)
                    expect(window.Capture.disable.calledWith(FULL_HTML_TEXT, 'x-')).toBe(true)
                    expect(getJQueryHtmlSpy.calledWith(jquery, FULL_HTML_TEXT)).toBe(true)
                }
            )
        })

        testCases.forEach(([msg, html, verify]) => {
            test(`${msg}: response object is compatible with getJQueryHtml result (using DOMParse)`, () => {
                const result1 = getJQueryHtml(jquery, html)
                window.Progressive.isUniversal = true
                window.Capture.disable.returns(html)
                return responseFunction(html).then(([jq, result2]) => {
                    expect(jq).toEqual(window.Progressive.$)
                    expect(result1.length).toEqual(result2.length)
                    verify(result1, 'Verifying getJQueryHtml')
                    verify(result2, 'Verifying responseFunction')
                })
            })
        })
    }

    describe('DOMParser (the default)', () => {
        sharedResponseTests(jqueryResponse)
    })

    describe('jQuery (the fallback)', () => {
        beforeEach(() => {
            delete window.DOMParser // simulate browser without DOMParser
        })
        sharedResponseTests(jqueryResponse)
    })
})
