/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {baseConfig} from '@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig'

export const cardConfig = (props) => {
    const isRegistered = props?.isCustomerRegistered
    return {
        ...baseConfig(props),
        _disableClickToPay: true,
        showPayButton: true,
        hasHolderName: true,
        holderNameRequired: true,
        billingAddressRequired: false,
        enableStoreDetails: isRegistered
    }
}
