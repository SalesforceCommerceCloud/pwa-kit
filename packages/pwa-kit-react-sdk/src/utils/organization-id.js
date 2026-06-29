/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Commerce API organization ids have the shape `f_ecom_<realm>_<instanceType>`,
 * e.g. `f_ecom_bjnl_prd` (realm `bjnl`, instance type `prd`) or
 * `f_ecom_zzrf_001` (realm `zzrf`, instance type `001`).
 *
 * Parse the realm and instance type out of an organization id. Both are derived
 * from the first two segments after the `f_ecom_` prefix; any trailing segments
 * are ignored. Returns an empty object when the input is missing or does not
 * carry the expected segments, so callers can treat each field as optional.
 *
 * @param {string} [organizationId] e.g. `f_ecom_bjnl_prd`
 * @returns {{realm?: string, instanceType?: string}}
 */
export const parseOrganizationId = (organizationId) => {
    if (!organizationId || typeof organizationId !== 'string') return {}
    const [realm, instanceType] = organizationId.replace(/^f_ecom_/, '').split('_')
    const result = {}
    if (realm) result.realm = realm
    if (instanceType) result.instanceType = instanceType
    return result
}
