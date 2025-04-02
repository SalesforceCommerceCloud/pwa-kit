/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Router, Request, Response, NextFunction} from 'express'

const tenantIdRegExp = /^[a-zA-Z]{4}_([0-9]{3}|s[0-9]{2}|stg|dev|prd)$/
const shortCodeRegExp = /^[a-zA-Z0-9-]+$/

const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }

const jwksCachingMiddleware = () => {
    const router = Router()

    router.get(
        '/:shortCode/:tenantId/oauth2/jwks',
        asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const {shortCode, tenantId} = req.params
            const isValidRequest = tenantIdRegExp.test(tenantId) && shortCodeRegExp.test(shortCode)

            if (!isValidRequest) {
                return res
                    .status(400)
                    .json({error: 'Bad request parameters: Tenant ID or short code is invalid.'})
            }

            try {
                const JWKS_URI = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/f_ecom_${tenantId}/oauth2/jwks`
                const response = await fetch(JWKS_URI)

                if (!response.ok) {
                    throw new Error(`Request failed with status: ${response.status}`)
                }

                // JWKS rotate every 30 days. Cache response for 14 days
                res.set('Cache-Control', 'public, max-age=1209600, stale-while-revalidate=86400')

                return res.json(await response.json())
            } catch (error) {
                next(error) // Pass the error to Express error handling middleware
            }
        })
    )

    // Express error handler
    // router.use((err: Error, req: Request, res: Response) => {
    //     res.status(500).json({error: `Internal Server Error: ${err.message}`})
    // })

    return router
}

export default jwksCachingMiddleware
