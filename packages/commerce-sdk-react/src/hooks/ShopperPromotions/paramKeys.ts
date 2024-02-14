/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getPromotionsForCampaign = [
    'organizationId',
    'campaignId',
    'siteId',
    'startDate',
    'endDate',
    'currency'
] as const

const getPromotions = ['organizationId', 'siteId', 'ids', 'locale'] as const

export default {
    getPromotionsForCampaign,
    getPromotions
}
