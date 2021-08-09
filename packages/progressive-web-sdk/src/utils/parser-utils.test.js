/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jquery, jest */
import * as ParserUtils from './parser-utils'

// Parser tests need jQuery librbary
import $ from '../../vendor/jquery.min.js'
global.$ = $

test('getTextFrom returns correct text', () => {
    const text = 'Some Text Here'
    const className = 'page-title'
    const textHtml = `<div><div class="${className}"><span>${text}</span></div></div>`
    expect(ParserUtils.getTextFrom($(textHtml), `.${className}`)).toEqual(text)
})

test('parseTextLink returns the correct href, text, and title', () => {
    expect(
        ParserUtils.parseTextLink($('<a href="/test.html" title="Test">Click Here!</a>'))
    ).toEqual(
        ParserUtils.textLink({
            href: '/test.html',
            text: 'Click Here!',
            title: 'Test'
        })
    )
})

test('parseButton returns the correct values', () => {
    ;[true, false].forEach((isDisabled) => {
        const buttonHtml = `<button type="submit" name="Submit" value="test"${
            isDisabled ? ' disabled' : ''
        }>Button</button>`

        expect(ParserUtils.parseButton($(buttonHtml))).toEqual({
            type: 'submit',
            children: 'Button',
            name: 'Submit',
            value: 'test',
            disabled: isDisabled
        })
    })
})

test('parseImage returns title, alt, and src', () => {
    const imageHtml = '<img src="equality.svg" title="Equality Now!" alt="An equals sign" />'

    expect(ParserUtils.parseImage($(imageHtml))).toEqual({
        src: 'equality.svg',
        title: 'Equality Now!',
        alt: 'An equals sign'
    })
})

test('parseImage prefers x-src to src', () => {
    const imageHtml = '<img src="fail.gif" x-src="pass.gif" />'

    expect(ParserUtils.parseImage($(imageHtml)).src).toBe('pass.gif')
})

test('parseOption gets the right options', () => {
    ;[true, false].forEach((isSelected) => {
        const optionHtml = `<option value="test"${isSelected ? ' selected' : ''}>Option</option>`

        expect(ParserUtils.parseOption($(optionHtml))).toEqual({
            key: 'test',
            value: 'test',
            selected: isSelected,
            text: 'Option'
        })
    })
})

test('parseSelect parses the select and its options', () => {
    const optionVals = ['Jest', 'AVA', 'Mocha']
    const selectHtml = `<select name="tester">${optionVals
        .map((val) => `<option value="${val}" />`)
        .join('')}</select>`

    const result = ParserUtils.parseSelect($, $(selectHtml))

    expect(result.name).toBe('tester')

    for (let i = 0; i < optionVals.length; i++) {
        expect(result.options[i].value).toBe(optionVals[i])
    }
})

// Need help with this test
test('parsePageMeta returns pageMeta object with title, description, and keywords', () => {
    const title = 'Page Title'
    const description = 'Page description'
    const keywords = 'Keyword1, Keyword2, Keyword3'

    const head = document.createElement('head') // jQuery does not insert <html>, <title>, or <head> so we will need to use vanilla JS to create <head>
    const $test = $(head)
    $test.append(`<title>${title}</title>`)
    $test.append(`<meta name="description" content="${description}"/>`)
    $test.append(`<meta name="keywords" content="${keywords}"/>`)

    expect(ParserUtils.parsePageMeta($, $test)).toEqual({
        pageMeta: {
            title,
            description,
            keywords
        }
    })
})
