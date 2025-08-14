/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const handleAction = (navigate) => async (component, responses) => {
    if (responses?.paymentsResponse?.action?.type === 'voucher') {
        const action = btoa(JSON.stringify(responses?.paymentsResponse?.action))
        const url = `/checkout/confirmation/${responses?.paymentsResponse?.merchantReference}?adyenAction=${action}`
        navigate(url)
    } else {
        await component.handleAction(responses?.paymentsResponse?.action)
    }
}

export const onPaymentsSuccess = (navigate) => async (state, component, props, responses) => {
    if (responses?.paymentsResponse?.isSuccessful) {
        navigate(`/checkout/confirmation/${responses?.paymentsResponse?.merchantReference}`)
    } else if (responses?.paymentsResponse?.action) {
        await handleAction(navigate)(component, responses)
    } else {
        return new Error(responses?.paymentsResponse)
    }
}

export const onPaymentsDetailsSuccess =
    (navigate) => async (state, component, props, responses) => {
        if (responses?.paymentsDetailsResponse?.isSuccessful) {
            navigate(
                `/checkout/confirmation/${responses?.paymentsDetailsResponse?.merchantReference}`
            )
        } else if (responses?.paymentsDetailsResponse?.action) {
            await component.handleAction(responses?.paymentsDetailsResponse?.action)
        } else {
            return new Error(responses?.paymentsDetailsResponse)
        }
    }
