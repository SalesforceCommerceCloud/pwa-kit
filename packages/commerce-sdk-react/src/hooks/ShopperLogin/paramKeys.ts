/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getUserInfo = ['organizationId', 'channel_id'] as const
const getWellknownOpenidConfiguration = ['organizationId'] as const
const getJwksUri = ['organizationId'] as const

export default {
    getUserInfo,
    getWellknownOpenidConfiguration,
    getJwksUri
}
