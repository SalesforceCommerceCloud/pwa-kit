/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {ServerContext} from '../contexts'

/**
 * Server context
 * @typedef {Object} ServerContext
 * @property {Object} req - Request object
 * @property {Object} res - Response object
 */

/**
 * @callback serverCtxCallback
 * @param {ServerContext} serverContext
 */

/**
 * Execute the given function within the server context of a server-rendered page
 *
 * @param {serverCtxCallback} fn - Function will be called when the server has received the request but the response is not sent yet
 * @example
 * useServerContext(({req, res}) => { res.status(404) })
 */
export const useServerContext = (fn) => {
    const serverContext = useContext(ServerContext)
    const isOnServer = Boolean(serverContext.req)

    if (isOnServer) {
        fn(serverContext)
    }
}
