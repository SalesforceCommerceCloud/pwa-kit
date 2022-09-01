/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {ServerContext} from '../contexts'

/**
 * Get the server context of the current page.
 * Avoid using it for rendering the content of your component. Otherwise, there would be a mismatch in html markup during hydration.
 * @returns {Object} Request and Response objects `{req, res}`
 *
 * @example
 * const {req, res} = useServerContext()
 * // Request, Response will be available only on the server-side
 * if (res) { res.status(404) }
 */
export const useServerContext = () => useContext(ServerContext)
