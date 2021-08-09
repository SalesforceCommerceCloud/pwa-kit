/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {displayPreloader, hidePreloader, PRELOADER_CLASSES} from './preloader'

test('hidePreloader removes all elements with the preloader classes', () => {
    ;['div', 'p', 'a', 'script']
        .map((elementName) => document.createElement(elementName))
        .map((element) => {
            element.className = PRELOADER_CLASSES
            return element
        })
        .forEach((element) => document.body.appendChild(element))

    expect(document.getElementsByClassName(PRELOADER_CLASSES).length).toBe(4)
    hidePreloader()
    expect(document.getElementsByClassName(PRELOADER_CLASSES).length).toBe(0)
})

test('displayPreloader adds a meta viewport tag', () => {
    expect(document.getElementsByTagName('meta').length).toBe(0)
    displayPreloader()

    const metaTags = document.head.getElementsByTagName('meta')
    expect(metaTags.length).toBe(1)
    expect(metaTags[0].name).toBe('viewport')
    expect(metaTags[0].content).toBe('width=device-width')
    hidePreloader()
})

test('displayPreloader adds a style tag with the passed CSS', () => {
    const testCss = 'p { text-color: red; }'
    expect(document.head.getElementsByTagName('style').length).toBe(0)
    displayPreloader(testCss)

    const styleElements = document.head.getElementsByTagName('style')
    expect(styleElements.length).toBe(1)
    expect(styleElements[0].className).toBe(PRELOADER_CLASSES)
    expect(styleElements[0].innerHTML).toBe(testCss)
    hidePreloader()
})

test('displayPreloader adds a div container with the passed HTML', () => {
    const testHtml = '<p>This is a <em>real</em> test</p>'
    expect(document.body.getElementsByTagName('div').length).toBe(0)
    displayPreloader('', testHtml)

    const divElements = document.body.getElementsByTagName('div')
    expect(divElements.length).toBe(1)
    expect(divElements[0].className).toBe(`preloader ${PRELOADER_CLASSES}`)
    expect(divElements[0].innerHTML).toBe(testHtml)
    hidePreloader()
})

test('displayPreloader adds a script tag with the passed JS', () => {
    const testJs = 'function test() { this.test = true; }'
    expect(document.head.getElementsByTagName('script').length).toBe(0)
    displayPreloader('', '', testJs)

    const scriptElements = document.head.getElementsByTagName('script')
    expect(scriptElements.length).toBe(1)
    expect(scriptElements[0].className).toBe(PRELOADER_CLASSES)
    expect(scriptElements[0].innerHTML).toBe(testJs)
    hidePreloader()
})

describe('displayPreloader failure handling', () => {
    beforeEach(() => {
        if (document.head) {
            document.head.remove()
        }

        if (document.body) {
            document.body.remove()
        }
    })

    test("displayPreloader does nothing if <head> doesn't exist", () => {
        document.documentElement.appendChild(document.createElement('body'))

        displayPreloader('', '', '')

        expect(document.head).toBeFalsy()
        expect(document.body.childNodes.length).toBe(0)
    })

    test('displayPreloader does nothing if <body> is empty', () => {
        document.documentElement.appendChild(document.createElement('head'))
        const headCount = document.head.childNodes.length

        displayPreloader('', '', '')

        expect(document.body).toBeFalsy()
        expect(document.head.childNodes.length).toBe(headCount)
    })
})
