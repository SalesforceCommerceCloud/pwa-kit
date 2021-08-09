/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import fs from 'fs'
import mapValues from 'lodash.mapvalues'
import getJQueryHtml from './get-jquery-html.js'

// Map of all attributes we should disable (to prevent resources from downloading)
const disablingMap = {
    img: ['src', 'srcset'],
    source: ['src', 'srcset'],
    iframe: ['src'],
    script: ['src', 'type'],
    link: ['href'],
    style: ['media']
}

const attributeDisablingRes = mapValues(disablingMap, (targetAttributes) => {
    return new RegExp(
        `\\s+((?:${targetAttributes.join('|')})\\s*=\\s*(?:('|")[\\s\\S]+?\\2))`,
        'gi'
    )
})

// Inline styles and scripts are disabled using a unknown type.
const tagDisablers = {
    style: ' media="mobify-media"',
    script: ' type="text/mobify-script"'
}

const OPENING_SCRIPT_RE = /(<script[\s\S]*?>)/gi
const SPLIT_RE = /(<!--[\s\S]*?-->)|(?=<\/script)/i
const AFFECTED_TAG_RE = new RegExp(`<(${Object.keys(disablingMap).join('|')})([\\s\\S]*?)>`, 'gi')

export const disableHtml = (htmlStr, prefix) => {
    // Disables all attributes in disablingMap by prepending prefix
    const disableAttributes = (_, tagName, tail) => {
        const lowercaseTagName = tagName.toLowerCase()
        const disabler = tagDisablers[lowercaseTagName] || ''
        const attributes = tail.replace(attributeDisablingRes[lowercaseTagName], ` ${prefix}$1`)

        return `<${lowercaseTagName}${disabler}${attributes}>`
    }

    return htmlStr
        .split(SPLIT_RE)
        .map((fragment) => {
            // Fragment may be empty or just a comment, no need to escape those.
            if (!fragment) {
                return ''
            }
            if (/^<!--/.test(fragment)) {
                return fragment
            }

            // Disable before and the <script> itself.
            // parsed = [before, <script>, script contents]
            const parsed = fragment.split(OPENING_SCRIPT_RE)
            parsed[0] = parsed[0].replace(AFFECTED_TAG_RE, disableAttributes)
            if (parsed[1]) {
                parsed[1] = parsed[1].replace(AFFECTED_TAG_RE, disableAttributes)
            }
            return parsed
        })
        .reduce((complete, item) => complete.concat(item), [])
        .join('')
}

/*
 * Loads a given "file" and converts its content
 * into a jQuery object.
 * This is used to test parsers and follows the same
 * approach as the "jquery-response".
 */
export const jquerifyHtmlFile = (file) => {
    const html = fs.readFileSync(file, 'utf-8')
    return getJQueryHtml(window.$, disableHtml(html, 'x-'))
}

// Utils for creating touch events
const createClientXY = (x, y) => {
    return {clientX: x, clientY: y, screenX: x, screenY: y}
}

export const createTouchEventObject = ({x = 0, y = 0}) => {
    return {touches: [createClientXY(x, y)]}
}
