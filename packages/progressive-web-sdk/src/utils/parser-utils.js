/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/parser-utils
 */
import Immutable from 'immutable'

/**
 * Get text from an element.
 * @function
 * @param $element {node} - a jQuery object
 * @param selector {string}
 * @returns {String}
 * @example
 * import {getTextFrom} from 'progressive-web-sdk/dist/utils/parser-utils'
 *
 * getTextFrom($('<div><div class="class-name"><span>Text</span></div></div>'), '.class-name')
 * // Text
 */

export const getTextFrom = ($element, selector) =>
    $element
        .find(selector)
        .text()
        .trim()

/**
 * Set immutable for link attributes.
 * @constant
 * @type {object}
 */

export const textLink = Immutable.Record({
    href: '',
    text: '',
    title: ''
})

/**
 * Parse link that outputs link attributes: href, text and title.
 * @function
 * @param $link {node} - a jQuery object
 * @returns {Object}
 * @example
 * import {parseTextLink} from 'progressive-web-sdk/dist/utils/parser-utils'
 *
 * parseTextLink($('<a href="/test.html" title="Test">Click Here!</a>'))
 * // {href: '/test.html', text: 'Click Here!', title: 'Test'}
 */

export const parseTextLink = ($link) => {
    return textLink({
        href: $link.attr('href'),
        text: $link.text().trim(),
        title: $link.attr('title')
    })
}

/**
 * Parse button that outputs button attributes: children, type, name, value,
 * and disabled.
 * @function
 * @param $button {node} - a jQuery object
 * @returns {Object}
 * @example
 * import {parseButton} from 'progressive-web-sdk/dist/utils/parser-utils'
 *
 * parseButton($(<button type="submit" name="Submit" value="test" disabled>Button</button>))
 * // {type: 'submit', children: 'Button', name: 'Submit', value: 'test', disabled: true}
 */

export const parseButton = ($button) => {
    return {
        children: $button.html(),
        type: $button.attr('type'),
        name: $button.attr('name'),
        value: $button.attr('value'),
        disabled: !!$button.attr('disabled')
    }
}

/**
 * Parse image that outputs image attributes: title, alt, and src.
 * @function
 * @param $img {node} - a jQuery object
 * @returns {Object}
 * @example
 * import {parseImage} from 'progressive-web-sdk/dist/utils/parser-utils'
 *
 * parseImage($('<img src="equality.svg" title="Equality Now!" alt="An equals sign" />'))
 * // {src: 'equality.svg', title: 'Equality Now!', alt: 'An equals sign'}
 */

export const parseImage = ($img) => {
    return {
        title: $img.attr('title'),
        alt: $img.attr('alt'),
        src: $img.attr('x-src') ? $img.attr('x-src') : $img.attr('src')
    }
}

/**
 * Parse option to use in select element, option attributes includes: key,
 * value, selected and text.
 * @function
 * @param $option {node} - a jQuery object
 * @returns {Object}
 * @example
 * import {parseOption} from 'progressive-web-sdk/dist/utils/parser-utils'
 *
 * parseOption($('<option value="test" selected>Option</option>'))
 * // {key: 'test', value: 'test', selected: true, text: 'Option'}
 */

export const parseOption = ($option) => {
    const value = $option.attr('value')
    return {
        key: value,
        value,
        selected: !!$option.attr('selected'),
        text: $option.text().trim()
    }
}

/**
 * Parse select that outputs select attributes: name and options.
 * @function
 * @param $ {node} - an instance of jQuery
 * @param $select {node} - a jQuery object
 * @returns {Object}
 * @example
 * import {parseSelect} from 'progressive-web-sdk/dist/utils/parser-utils'
 *
 * parseSelect($, $('<select name="tester"><option value="Jest" selected>Jest</option><option value="Mocha">Mocha</option></select>'))
 * // {name: 'test', options: [{key: 'Jest', value: 'Jest', selected: true, text: 'Jest'}, {key: 'Mocha', value: 'Mocha', selected: false, text: 'Mocha'}]}
 */

export const parseSelect = ($, $select) => {
    return {
        name: $select.attr('name'),
        options: $.makeArray($select.children()).map((item) => parseOption($(item)))
    }
}

/**
 * Parse page's metadata that includes title, description and keywords.
 * @function
 * @param $ {node} - an instance of jQuery
 * @param $response {node} - a jQuery object
 * @returns {Object}
 * @example
 * import {parsePageMeta} from 'progressive-web-sdk/dist/utils/parser-utils'
 *
 * const $test = $('head')
 * $test.append(`<title>Page Title</title>`)
 * $test.append(`<meta name="description" content="Page description"/>`)
 * $test.append(`<meta name="keywords" content="Keyword1, Keyword2, Keyword3"/>`)
 * parsePageMeta($, $test)
 * // pageMeta: {title: "Page Title", description: "Page description", keywords: "Keyword1, Keyword2, Keyword3"}
 */

export const parsePageMeta = ($, $response) => {
    return {
        pageMeta: {
            // eslint-disable-next-line
            title: $response
                .find('title')
                .last()
                .text(),
            description: $response.find('meta[name="description"]').attr('content'),
            keywords: $response.find('meta[name="keywords"]').attr('content')
        }
    }
}
