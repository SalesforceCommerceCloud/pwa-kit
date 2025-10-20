/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useConfigurations} from '@salesforce/commerce-sdk-react'

/**
 * Hook to check if Salesforce Payments is enabled.
 * @returns {boolean} True if Salesforce Payments is enabled, false otherwise
 */
export const useSalesforcePayments = () => {
    const {data: configurations} = useConfigurations()
    return (
        configurations?.configurations?.find(
            (configuration) => configuration.id === 'sfPaymentsEnabled'
        )?.value === 'true'
    )
}
