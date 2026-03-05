/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useConfigurations} from '@salesforce/commerce-sdk-react'

/**
 * Hook to get a shopper configuration value.
 * @param {string} configurationId - The ID of the configuration to retrieve
 * @returns {*} The configuration value, or undefined if not found
 */
export const useShopperConfiguration = (configurationId) => {
    // Stale time is set to 10 minutes to avoid unnecessary API calls
    const {data: configurations} = useConfigurations(
        {},
        {
            staleTime: 10 * 60 * 1000 // 10 minutes
        }
    )
    const config = configurations?.configurations?.find(
        (configuration) => configuration.id === configurationId
    )
    return config?.value
}
