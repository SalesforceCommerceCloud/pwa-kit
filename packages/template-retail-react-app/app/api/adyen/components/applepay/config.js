/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {baseConfig} from '@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig'

export const applePayConfig = (props) => {
    return {
        ...baseConfig(props),
        showPayButton: true
    }
}
