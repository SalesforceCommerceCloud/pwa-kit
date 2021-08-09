/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// Default to matching any path on the current origin
let reactRoutes = []

const isClientSide = typeof window !== 'undefined'

export const setRouteList = (regexes) => {
    reactRoutes = regexes
}
export const setBlacklist = (routes) => {
    // This is just a safeguard so
    // we don't reference window when it doesn't exist
    /* istanbul ignore else */
    if (isClientSide) {
        window.Progressive = window.Progressive || {}
        window.Progressive.blacklist = routes.map((text) => RegExp(text))
    }
}

export const getRouteList = () => reactRoutes
export const getBlacklist = () => {
    // This is just a safeguard so
    // we don't reference window when it doesn't exist
    /* istanbul ignore next */
    if (!isClientSide) {
        return []
    }

    window.Progressive = window.Progressive || {}
    return window.Progressive.blacklist || []
}

/**
 * HACK:
 *
 * For client-side apps the value of ORIGIN can be determined by looking at
 * window.location. During SSR rendering it can't and the correct value isn't even
 * known before the SSR server starts. For that reason, when rendering server-side,
 * we set ORIGIN to undefined and wait for the server to start, which is expected to
 * set the correct value here.
 *
 * This mutable global is difficult to work with in tests, etc. but we need to
 * maintain it for backwards compatibility – ORIGIN has always been exported, it is
 * in use by components and, potentially, end-user code.
 */
export let ORIGIN =
    // The else clause is only for real browsers.
    isClientSide
        ? window.location.href === 'http://localhost/'
            ? 'https://www.mobify.com' // for testing!
            : /* istanbul ignore next */
              window.location.origin
        : undefined

export const isBlacklisted = (href) => {
    return getBlacklist().some((regex) => regex.test(href))
}

export const isReactRoute = (href) => {
    // Have blacklisted routes fall through immediately
    if (isBlacklisted(href)) {
        return false
    }

    // We don't match on fragments and queries (yet?)
    if (href.includes('#') || href.includes('?')) {
        return isReactRoute(href.split('#')[0].split('?')[0])
    }

    if (href.startsWith(ORIGIN)) {
        return isReactRoute(href.replace(ORIGIN, ''))
    }

    if (href.startsWith('http') || href.startsWith('//')) {
        return false
    }

    return reactRoutes.some((regex) => regex.test(href))
}

export default isReactRoute
