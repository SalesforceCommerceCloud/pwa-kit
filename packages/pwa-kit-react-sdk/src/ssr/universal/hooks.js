/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {IsPrePassContext, ServerContext} from './contexts'

/**
 * Server context
 * @typedef {Object} ServerContext
 * @property {Object} req - Request object
 * @property {Object} res - Response object
 * @property {boolean} isServerSide
 */

/**
 * Get the server context
 * @returns {ServerContext} ServerContext object
 *
 * @example
 * const {res, isServerSide} = useServerContext()
 * if (isServerSide && query.error) { res.status(404) }
 */
export const useServerContext = () => {
    const serverContext = useContext(ServerContext)
    const isPrePass = useIsPrePass()

    return {
        ...serverContext,
        isServerSide: Boolean(serverContext.req) && !isPrePass
    }
}

/**
 * @private
 */
export const useIsPrePass = () => useContext(IsPrePassContext)
