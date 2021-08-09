/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import getJQueryHtml, {makeDocument, markup, errorString} from './get-jquery-html'

const $ = require('../vendor/jquery.min.js')
const lang = 'en-US'
const id = 'hello-world'
const doctype = '<!doctype html>'
const html =
    `<html lang="${lang}">` +
    '<head>' +
    '<script type="mobify/script">' +
    "console.log('hello world');" +
    '</script>' +
    '</head>' +
    `<body id="${id}">` +
    '<div id="sup">Hello World</div>' +
    '<div><span>This is only a test</span></div>' +
    '</body>' +
    '</html>'

jest.useFakeTimers()

beforeEach(jest.resetModules)
afterEach(jest.runAllTimers)

it('makeDocument provides a document matching the provided HTML', () => {
    const htmlFromDocument = makeDocument(html)

    expect(htmlFromDocument.documentElement.outerHTML).toBe(html)
})

it("makeDocument doesn't explode when responseHTML is undefined", () => {
    const undefinedHtml = makeDocument()

    expect(undefinedHtml.documentElement.outerHTML).toBe(markup)
})

it('makeDocument does not leave iframe elements in the DOM after timeouts', () => {
    expect(document.getElementsByTagName('iframe').length).toBe(0)
    makeDocument(html)
    expect(document.getElementsByTagName('iframe').length).toBe(1)
    jest.runOnlyPendingTimers()
    expect(document.getElementsByTagName('iframe').length).toBe(0)
})

it("getJQueryHtml doesn't explode when responseHTML is undefined", () => {
    const $undefinedHtml = getJQueryHtml($)

    expect($undefinedHtml[0].outerHTML).toBe(markup)
})

it("getJQueryHtml properly throws if a selector library function isn't provided", () => {
    const testFunction = () => getJQueryHtml('blah blah blah')

    expect(testFunction).toThrowError(errorString)
})

it('getJQueryHtml provides a jQuery-wrapped document matching the provided HTML', () => {
    const $html = getJQueryHtml($, `${doctype}${html}`)

    expect($html[0].outerHTML).toBe(html)
    expect($html.attr('lang')).toBe(lang)
    expect($html.find('body').attr('id')).toBe(id)
    expect($html.find('#sup').length).toBe(1)
})
