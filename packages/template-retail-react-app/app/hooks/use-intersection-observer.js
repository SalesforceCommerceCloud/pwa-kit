/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from 'react'

/**
 * Returns a boolean to indicate if an element is visible on the screen. Fall back to `true`
 * if IntersectionObserver is not supported.
 * https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver
 * @param {Object} ref - element ref
 * @param {Object} options
 * @param {Object} options.root - See IntersectionObserver options
 * @param {string} options.rootMargin - See IntersectionObserver options
 * @param {number|Array<number>} options.threshold - See IntersectionObserver options
 * @param {boolean} options.useOnce - Detach the observer after the element appears.
 * @returns {boolean}
 */
const useIntersectionObserver = (ref, options = {}) => {
    const [isIntersecting, setIntersecting] = useState(false)

    const {useOnce, ...ioOptions} = options

    useEffect(() => {
        if (!ref?.current) return

        // Just set `isIntersecting` true if browser doesn't implement IntersectionObserver. If the use-case
        // is critical and you need to support very old browsers, a polyfill will need to be added.
        if (
            !('IntersectionObserver' in window) ||
            !('IntersectionObserverEntry' in window) ||
            !('intersectionRatio' in window.IntersectionObserverEntry.prototype)
        ) {
            if (!isIntersecting) {
                setIntersecting(true)
            }

            // We want to return early, but `useEffect` expects a function as the return value,
            // so we just return a noop function.
            return () => null
        }

        const observer = new IntersectionObserver(([entry]) => {
            const onScreen = entry.isIntersecting
            setIntersecting(onScreen)
            if (useOnce && onScreen) {
                observer.disconnect()
            }
        }, ioOptions)

        observer.observe(ref?.current)

        // Remove the observer as soon as the component is unmounted
        return () => {
            observer.disconnect()
        }
    }, [ref?.current])

    return isIntersecting
}

export default useIntersectionObserver
