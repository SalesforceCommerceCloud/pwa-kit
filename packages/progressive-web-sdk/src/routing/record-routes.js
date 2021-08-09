/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import escapeRegExp from 'lodash.escaperegexp'

export const doOneOrMany = (item, fn) => {
    if (Array.isArray(item)) {
        return [].concat(...item.map(fn))
    }
    return fn(item)
}

export const extractRoute = (route, prefix = '') => {
    let path = route.props.path

    // This route has no path list relevance (e.g. it's an IndexRoute)
    // or it's a catch-all route
    if (!path) {
        return []
    }

    // Remove the leading / from the path
    // The root route provides / as a prefix
    // so if we don't strip that out, we can end up with routes like
    // '//potions.html' which will not work correctly
    if (/\/$/.test(prefix)) {
        path = path.replace(/^\//, '')
    }
    const currentPath = `${prefix}${path.replace(/\/$/, '')}`

    const paths = [currentPath || '/']

    if (route.props.children) {
        return paths.concat(
            doOneOrMany(route.props.children, (child) => extractRoute(child, `${currentPath}/`))
        )
    }
    return paths
}

export const findRegexpMatches = (regexp, text) => {
    let lastIndex = 0
    const matches = []
    let match

    while ((match = regexp.exec(text))) {
        if (match.index !== lastIndex) {
            matches.push(text.slice(lastIndex, match.index))
        }

        matches.push(match)
        lastIndex = regexp.lastIndex
    }

    if (lastIndex !== text.length) {
        matches.push(text.slice(lastIndex))
    }

    return matches
}

const convertPatternPiece = (match) => {
    if (!Array.isArray(match)) {
        return escapeRegExp(match)
    }

    if (match[1]) {
        return '[^/]+'
    }
    if (match[0] === '(') {
        return '(?:'
    }
    if (match[0] === ')') {
        return ')?'
    }
    if (match[0] === '**') {
        return '.*'
    }
    // The regex below guarantees that this will always be true
    /* istanbul ignore else */
    if (match[0] === '*') {
        return '.*?'
    }
    /* istanbul ignore next */
    return ''
}

export const patternToRegex = (pattern) => {
    const innerRegex = findRegexpMatches(/:([a-zA-Z_$][a-zA-Z0-9_$]*)|\(|\)|\*\*|\*/g, pattern)
        .map(convertPatternPiece)
        .join('')

    return `^${innerRegex}/?$`
}

export const extractRouteRegexes = (routes) => {
    return doOneOrMany(routes, extractRoute)
        .map(patternToRegex)
        .map((text) => RegExp(text))
}

export const recordRoutes = (destinationFn, routes) => {
    destinationFn(extractRouteRegexes(routes))
    return routes
}

export default recordRoutes
