/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {randomUUID} from 'crypto'

/**
 * This middleware will attach an uuid to request.apiGateway object
 * @param res
 * @param req
 * @param next
 */
export const addRequestIdToReqMiddleware = (req, res, next) => {
    req['apiGateway'] = {
        requestId: randomUUID()
    }
    next()
}
