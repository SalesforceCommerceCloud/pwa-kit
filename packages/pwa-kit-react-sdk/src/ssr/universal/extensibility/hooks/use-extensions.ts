/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */

import React, {useContext} from 'react'
import ExtensionsContext from '../contexts/extensions'

/**
 * Use this hook to get the application extensions value of the closest ExtensionsProvider component.
 *
 * @returns {object} Array of Extensions
 */
export const useExtensions = () => {
    const context = React.useContext(ExtensionsContext)
    if (context === undefined) {
        throw new Error('useExtensions needs to be used within ExtensionsProvider')
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
