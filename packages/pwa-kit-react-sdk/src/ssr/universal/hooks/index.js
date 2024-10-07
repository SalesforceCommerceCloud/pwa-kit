/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */

import React, {useContext} from 'react'
import {CorrelationIdContext, ServerContext} from '../contexts'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Use this hook to get the correlation id value of the closest CorrelationIdProvider component.
 *
 * @returns {object} The correlation id
 */
export const useCorrelationId = () => {
    const context = React.useContext(CorrelationIdContext)
    if (context === undefined) {
        throw new Error('useCorrelationId needs to be used within CorrelationIdProvider')
    }
    return context
}

/**
 * Server context
 * @typedef {Object} ServerContext
 * @property {Object} req - Request object
 * @property {Object} res - Response object
 */

/**
 * Get the server context
 * @returns {ServerContext} ServerContext object
 *
 * @example
 * const {res} = useServerContext()
 * if (res && query.error) { res.status(404) }
 */
export const useServerContext = () => {
    const serverContext = useContext(ServerContext)

    return serverContext
}

export const useOrigin = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    const {
        app: {enableXForwardedHost}
    } = getConfig()

    const {APP_ORIGIN} = process.env

    const {res, req} = useServerContext()
    const xForwardedHost = res.locals.xForwardedHost
    if (enableXForwardedHost && xForwardedHost) {
        return `${req.protocol}://${xForwardedHost}`
    }
    return APP_ORIGIN
}
