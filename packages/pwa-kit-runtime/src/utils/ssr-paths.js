/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const startsWithMobify = (url) => {
    return url.startsWith(`/mobify`)
}

export const getProxyPathBase = () => {
    return '/mobify/proxy'
}

export const getBundlePathBase = () => {
    return '/mobify/bundle'
}

export const getCachingPathBase = () => {
    return '/mobify/caching'
}

export const getHealtCheckPathBase = () => {
    return '/mobify/ping'
}

export const getSLASPrivateProxyPath = () => {
    return '/mobify/slas/private'
}
