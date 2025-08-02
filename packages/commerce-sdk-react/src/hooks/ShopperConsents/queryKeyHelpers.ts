/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Query Key Helper for getSubscriptions
 * @group ShopperConsents
 * @category Query Key Helper
 */
export const getSubscriptions = {
    queryKey: (options?: {
        organizationId: string
        siteId: string
        locale: string
        tags?: string
    }) => ['shopperConsents', 'getSubscriptions', options],
    parameters: (options?: {
        organizationId: string
        siteId: string
        locale: string
        tags?: string
    }) => options
}
