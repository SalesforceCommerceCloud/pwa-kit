/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {version} from 'react'

// In React 19.0.0 or newer, we must use a camelCase prop to avoid "Warning: Invalid DOM property",
// while in React 18 or older, we must use a lowercase prop to avoid it.
// See https://github.com/facebook/react/pull/25927
const [majorStr] = version.split('.', 1)
const major = parseInt(majorStr, 10)
const fetchPriorityPropName = major > 18 ? 'fetchPriority' : 'fetchpriority'

/**
 * Even on older React versions that don't support the `fetchPriority` property natively,
 * this method guarantees that a `fetchPriority` property gets returned to the consumer.
 * That property then simply isn't enumerable, but due to its availability simplifies
 * code that operates on top of this property.
 * @param {Object} obj
 * @param {string} [priority]
 * @returns {Object}
 */
function ensureFetchPriority(obj, priority) {
    if (priority) {
        const value = ['high', 'low'].includes(priority) ? priority : 'auto'
        obj[fetchPriorityPropName] = value
        if (major <= 18) {
            Object.defineProperty(obj, 'fetchPriority', {value, enumerable: false})
        }
    }
    return obj
}

/**
 * Utility to return optimized image properties based on **explicitly** provided
 * `loading` strategies.
 * @param {{[key: string]: any}} props Image properties
 * @param {('lazy' | 'eager')} [props.loading] Loading strategy
 * @param {('high' | 'low' | 'auto')} [props.fetchPriority] Fetch priority
 * @param {('sync' | 'async' | 'auto')} [props.decoding] Decoding strategy
 * @return {Object} Optimized properties for your image component
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/loading}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority}
 */
export function getImageAttributes(props) {
    const {fetchPriority, ...imageProps} = props
    const priority = fetchPriority?.toLowerCase?.()
    const loadingStrategy = props?.loading?.toLowerCase?.()
    if (loadingStrategy === 'lazy' && !['sync', 'auto'].includes(props.decoding?.toLowerCase?.())) {
        return ensureFetchPriority(
            {
                ...imageProps,
                decoding: 'async'
            },
            priority
        )
    } else if (loadingStrategy === 'eager') {
        return ensureFetchPriority(imageProps, priority || 'high')
    }
    return ensureFetchPriority(imageProps, priority)
}

/**
 * Utility to return the attributes for a `<link preload>` element that's related to
 * an `<img>` element with the given `props`.
 * @param {{[key: string]: any}} props Image properties
 * @param {('lazy' | 'eager')} [props.loading] Loading strategy
 * @param {('high' | 'low' | 'auto')} [props.fetchPriority] Fetch priority
 * @param {string} [props.sizes] Layout width of the image
 * @param {string} [props.srcSet] One or more image candidate strings, separated using commas
 * @param {string} [props.media] Media query for responsive preloading
 * @param {string} [props.type] MIME type of the resource the element points to
 * @returns {({rel: string, as: string, href: string, fetchPriority?: ('high' | 'low' | 'auto'), media?: string, type?: string, imageSizes?: string, imageSrcSet?: string} | undefined)}
 */
export function getImageLinkAttributes(props) {
    const loadingStrategy = props?.loading?.toLowerCase?.()
    const fetchPriority = props?.fetchPriority?.toLowerCase?.()
    return fetchPriority === 'high' && (!loadingStrategy || loadingStrategy === 'eager')
        ? {
              rel: 'preload',
              as: 'image',
              href: props.src,
              fetchPriority,
              ...(props.type ? {type: props.type} : {}),
              ...(props.media ? {media: props.media} : {}),
              ...(props.sizes ? {imageSizes: props.sizes} : {}),
              ...(props.srcSet ? {imageSrcSet: props.srcSet} : {})
          }
        : undefined
}
