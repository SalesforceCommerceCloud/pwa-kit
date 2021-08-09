/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// Don't import this in web code - it is for use with the
// extract-routes script only.

const babelParser = require('@babel/parser')
const traverse = require('@babel/traverse')
const recordRoutes = require('./record-routes')

/**
 * This is a replacement for record-routes.extractRouteRegexes
 * that works with Babel's AST instead of mounting a component
 * tree in JSDOM. This approach is faster and easier to maintain.
 *
 * @param sourceStr  the source code to a js file containing react-router routes
 * @return {Array} an array of Regexes
 */
export const extractRouteRegexesFromSource = (sourceStr) => {
    const ast = babelParser.parse(sourceStr, {
        sourceType: 'module',
        plugins: ['jsx', 'dynamicImport']
    })

    const stack = []
    const regexes = []

    traverse.default(ast, {
        JSXOpeningElement: function(path) {
            if (path.node.name.name === 'Route') {
                const attribute = path.node.attributes.find((attr) => attr.name.name === 'path')
                if (attribute.value.type !== 'StringLiteral') {
                    const badSource = sourceStr.slice(path.node.start, path.node.end)
                    throw new Error(
                        'Cannot extract route regexes because of a problem in your route-config, here:\n\n' +
                            `${badSource}\n\n` +
                            'Note that you can only use plain strings for the paths in your route-config, not JSX Expressions\n' +
                            '(eg. <Route path="/home-page" /> and not <Route path={getHomePageURL()} />).'
                    )
                }
                const segment = attribute.value.value
                // Replace repeated runs of "/" in the URL which occur when path="/"
                // is used at the root, which is a common react-router pattern.
                const fullPath = [...stack, segment].join('/').replace(/\/+/g, '/')
                regexes.push(new RegExp(recordRoutes.patternToRegex(fullPath)))
                if (!path.node.selfClosing) {
                    stack.push(segment)
                }
            }
        },
        JSXClosingElement: function(path) {
            if (path.node.name.name === 'Route') {
                stack.pop()
            }
        }
    })
    return regexes
}
