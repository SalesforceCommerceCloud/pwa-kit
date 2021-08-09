/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * @module progressive-web-sdk/dist/utils/universal-utils
 */
import {render, hydrate} from 'react-dom'
import {VIEWPORT_SIZE_NAMES} from '../ssr/constants'
import {setIsServerSideOrHydratingFlag} from '../store/app/actions'
import {runningServerSide} from './utils'
import {getSSRTimer, proxyConfigs} from './ssr-shared-utils'

// Set default breakpoints
let BREAKPOINTS = {
    [VIEWPORT_SIZE_NAMES.SMALL]: 0,
    [VIEWPORT_SIZE_NAMES.MEDIUM]: 600,
    [VIEWPORT_SIZE_NAMES.LARGE]: 960,
    [VIEWPORT_SIZE_NAMES.XLARGE]: 1280
}

export const REACT_RENDER_WAIT_TIME = 50

/**
 * @function
 * @param breakpoints {Object} A dictionary of breakpoint names and their
 * values. Values must be integers. Use `setBreakpoints` to configure which
 * labels the `calculateViewportSize` utility function returns.
 * @return {Object} A non-referencial copy of the newly configured
 * breakpoints object
 * @example
 * setBreakpoints({
 *     MEDIUM: 700,
 *     CUSTOM_BREAKPOINT: 1440
 * })
 */
export const setBreakpoints = (breakpoints) => {
    /* istanbul ignore else */
    if (breakpoints === undefined || typeof breakpoints !== 'object') {
        throw new TypeError('`setBreakpoints` must be passed an object')
    }

    Object.keys(breakpoints).forEach((key) => {
        /* istanbul ignore else */
        if (typeof breakpoints[key] !== 'number') {
            throw new TypeError('`breakpoints` values passed to `setBreakpoints` must be numbers')
        }
    })

    BREAKPOINTS = {...breakpoints}

    return {...BREAKPOINTS}
}

/**
 * @function
 * @return {Object} Dictionary of the registered breakpoints. Each breakpoint
 * consists of a label (the keys) and a width (the values).
 */
export const getBreakpoints = () => ({...BREAKPOINTS})

/**
 * Calculate the browsers viewportSize. This compares `window.innerWidth`
 * against the breakpoints set by `setBreakpoints`. These breakpoints are
 * treated as `min-width` for the purpose of determining the active breakpoint.
 * For example, where `BREAKPOINTS` remains at it's default values, a
 * `window.innerWidth` of `700`, `calculateViewportSize` returns `MEDIUM`
 *
 * For testing only, this function accepts a width parameter (since
 * it's challenging to mock out window.innerWidth).
 * @function
 * @returns {String} the viewport sizes. Default return values include `SMALL`,
 * `MEDIUM`, `LARGE` and `XLARGE`
 * @example
 * calculateViewportSize(700) // => 'MEDIUM'
 */
export const calculateViewportSize = (width) => {
    /* istanbul ignore next */
    const viewportWidth = width || window.innerWidth
    const matches = []

    // Get all breakpoints that match the current viewport size
    Object.keys(BREAKPOINTS).forEach((breakpoint) => {
        const width = BREAKPOINTS[breakpoint]
        const isViewportInBreakpoint = viewportWidth >= width

        /* istanbul ignore else */
        if (isViewportInBreakpoint) {
            matches.push(width)
        }
    })

    // We only care about the largest matching width. That decides which
    // breakpoint is active.
    const largestMatch = Math.max(...matches)

    // Return the BREAKPOINTS key who's value matches largestMatch. For example,
    // if the largest match was 600, then return `MEDIUM` (by default, anyway)
    return Object.keys(BREAKPOINTS).find((key) => BREAKPOINTS[key] === largestMatch)
}

/**
 * This function should be called by UPWA code running server side when all
 * rendering for the page has been completed. It must be passed the current
 * application state.
 *
 * This function should be called once and once only by UPWA code. Once it
 * has been called, further execution of the UPWA code may not be possible.
 * @function
 * @param {object} appState - the application store
 * @param {object} [responseOptions] - optional values to configure the
 * HTTP response
 * @param {Number} [responseOptions.statusCode] - the HTTP status code for
 * the response (defaults to 200 for all pages except the configured
 * pageNotFoundURL, which uses 404).
 * @param {Object} [responseOptions.headers] - an object containing header
 * values to be set on the response. The object keys are the header names,
 * and the object values may be strings (for single-value headers) or
 * arrays of strings (for multi-value headers). You may also choose to set
 * response headers in the responseHook function of the SSRServer. Any header
 * values passed to ssrRenderingComplete are set before responseHook is
 * called.
 * @param {Boolean} [responseOptions.suppressBody] - if the statusCode is one
 * that means the response body is redundant (e.g., 301 or 302), then you
 * should pass suppressBody: true so that the response doesn't include any
 * of the body (which can be very large).
 * @returns {Promise}
 */
export const ssrRenderingComplete = (appState, responseOptions) =>
    new Promise((resolve) => {
        // We save these values on entry because it's complex to patch
        // window.Progressive in Jest asynchronous tests - if we save them
        // in the setTimeout they may have changed.
        const windowProgressive = window.Progressive || {}
        const initialRenderComplete = windowProgressive.initialRenderComplete
        /* istanbul ignore else */
        if (initialRenderComplete) {
            const timer = getSSRTimer()
            timer && timer.start('ssr-post-render')
            // We use a setTimeout here to reduce the chance of calling
            // `initialRenderComplete` while JSDOM and/or React is still processing,
            // diffing, and/or rendering the UPWA.
            //
            // We would prefer to NOT use setTimeout. We would rather use
            // `requestIdleCallback`, but that is not an option at this time.
            setTimeout(
                () => {
                    timer && timer.end('ssr-post-render')
                    // Set a flag that tells the UPWA to stop rendering.
                    // When server-side rendering is complete, the ssrRenderingCompleted
                    // flag is set. Any props changes or re-renders after it is set
                    // should be ignored. This flag is only relevant for server-side
                    // rendering, and is not for general use.
                    windowProgressive.ssrRenderingCompleted = true

                    // Clone the current app state so that any further changes
                    // don't affect it, and resolve the promise with it. Also
                    // shallow-clone any responseOptions and ensure that the default
                    // is an empty object.
                    initialRenderComplete({
                        appState: Object.assign({}, appState),
                        responseOptions: Object.assign({}, responseOptions || {})
                    })
                    resolve()
                },
                // 50 mS should be long enough to allow React to start processing all
                // batched render operations, and the actual timeout function will be
                // called when that is complete.
                REACT_RENDER_WAIT_TIME
            )
        }
    })

/**
 * This thunk should be dispatched by UPWA code running server side when all
 * rendering for the page has been completed.
 * @param {object} [responseOptions] - optional values to configure the
 * HTTP response. Refer to the ssrRenderingComplete function above for details.
 * @returns {Function}
 */
export const ssrRenderingCompleteThunk = (responseOptions) => (dispatch, getState) => {
    return ssrRenderingComplete(getState(), responseOptions)
}

/**
 * This function may be called by UPWA code running server side if
 * an error occurs that prevents rendering of the page from completing.
 *
 * In general, if the UPWA is unable to fetch data for a page, it is preferable
 * to render the page partially and call ssrRenderingComplete. This function
 * should only be called in the event of an error that prevents any rendering
 * from being done.
 * @function
 * @param {Object|String} error - an Error or an error string
 */
export const ssrRenderingFailed = (error) => {
    const windowProgressive = window.Progressive || {}
    const initialRenderFailed = windowProgressive.initialRenderFailed
    if (initialRenderFailed) {
        windowProgressive.ssrRenderingCompleted = true
        initialRenderFailed(error)
    }
}

/**
 * This thunk should be dispatched by UPWA code running server side if an error occurs
 * that prevents rendering of the page from completing.
 * @param {Object|String} error - an Error or an error string
 * @returns {function}
 */
// eslint-disable-next-line no-unused-vars
export const ssrRenderingFailedThunk = (error) => (dispatch) => {
    ssrRenderingFailed(error)
}

/**
 * This function may be called by UPWA code running server-side
 * to determine if ssrRenderingComplete has been called.
 *
 * If called client-side, this function will always return a falsy
 * value.
 * @function
 * @returns {boolean} - true if ssrRenderingComplete has been called,
 * false if not.
 */
export const ssrRenderingCompleted = () =>
    !!(window.Progressive && window.Progressive.ssrRenderingCompleted)

/**
 * Return the set of proxies configured for a UPWA.
 * The result is an array of objects, each of which has 'protocol'
 * (either 'http' or 'https'), 'host' (the hostname) and 'path' (the
 * path element that follows "/mobify/proxy/", defaulting to 'base' for
 * the first proxy, and 'base2' for the next).
 *
 * Each object also has a 'proxy' property, which is an ExpressJS
 * function that can be called to proxy a request to the target for
 * that object. This uses all the standard SSR proxy handling, including
 * rewriting of request and response headers. This can be used in contexts
 * such as the SSRServer requestHook to proxy requests. Do NOT use the
 * proxy function from UPWA code. It will not work.
 *
 * Ideally, we would return a clone of the configuration, but in the
 * interests of performance we may return a reference. Modifying the value
 * will have no effect on the actual proxy setup, and there should be
 * no need to ever do that.
 *
 * This function will work correctly whether called from UPWA code or
 * from SSR code (for example, from the requestHook or responseHook of
 * the SSR Server).
 * @function
 * @returns {Array<Object>}
 */
export const getProxyConfigs = () => {
    // It's not possible in tests to simply undefine 'window', so this
    // check is a little stricter than it could be. However, it's reasonable
    // to check for window.Progressive since it's always defined in all
    // UPWA environments.
    if (typeof window !== 'undefined' && window.Progressive) {
        // If 'window' is defined, we have been called from UPWA code, and we
        // should use the configs defined in window.Progressive
        /* istanbul ignore next */
        const windowProgressive = window.Progressive || {}
        const ssrOptions = windowProgressive.ssrOptions || {}
        return ssrOptions.proxyConfigs || []
    } else {
        // If 'window' is undefined, then we have been called from SSR code,
        // and we should use the configs exported from ssr-shared-utils.
        // Because changing this list would affect proxy setup, we
        // clone it.
        return proxyConfigs.map((config) => ({
            protocol: config.protocol,
            host: config.host,
            path: config.path
        }))
    }
}

/**
 * Return the identifier of the deploy target where this UPWA is running.
 * For the local development SSR Server, the value returned will normally
 * be an empty string (''). However, if the environment variable
 * DEPLOY_TARGET is defined, it will set the value returned by this
 * function, so that the local development server can be used for testing
 * code that checks the value.
 * @function
 * @returns {String}
 */
export const getDeployTarget = () => {
    // The value is present in window.Progressive.ssrOptions.deployTarget
    /* istanbul ignore next */
    const windowProgressive = window.Progressive || {}
    const ssrOptions = windowProgressive.ssrOptions || {}
    return ssrOptions.deployTarget || ''
}

/**
 * Render and mount a React component. Or, hydrate a React component for a
 * client side UPWA instead. When the React application renders client side or
 * hydrates, the Redux state is dispatched to indicate that
 * `setIsServerSideOrHydratingFlag` is false.
 * @function
 * @param {Object} component - The React component to mount to the root element
 * @param {Object} store - An instance of the application's redux store. It is
 * used internally to dispatch actions.
 * @param {Object} rootEl - The "root element" DOM node for an element that
 * the react application will be mounted to
 * @param {Function} [callback] - The callback function invoked after rendering or
 * hydration is finished.
 * @example
 * const store = configureStore({})
 * const rootEl = document.getElementsByClassName('react-target')[0]
 * renderOrHydrate(<Router store={store} />, store, rootEl)
 */
export const renderOrHydrate = (component, store, rootEl, callback = () => {}) => {
    const isUniversal = window.Progressive && window.Progressive.isUniversal

    if (isUniversal && !runningServerSide()) {
        hydrate(component, rootEl, () => {
            store.dispatch(setIsServerSideOrHydratingFlag(false))
            callback()
        })
    } else {
        render(component, rootEl, callback)
    }
}

/**
 * Return the "request class". This is a string value that may be set
 * by the request processor (which has access to the original request
 * from the browser). By default, the request class is undefined.
 *
 * @returns {String}
 */
export const getRequestClass = () =>
    (window.Progressive &&
        window.Progressive.ssrOptions &&
        window.Progressive.ssrOptions.requestClass) ||
    undefined
