/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'

import {Box, Button, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {expressPaymentProviderPropTypes} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract'

export const CONTRACT_TEST_PAYMENT_METHOD = 'CONTRACT_TEST'
export const CONTRACT_TEST_ORDER_ID = 'CONTRACT-TEST-ORDER'

/**
 * Temporary provider used to validate the iframe shell before a real payment
 * provider is connected. Replace the export in provider.jsx to change providers.
 */
const ContractTestProvider = ({context, lifecycle}) => {
    const [status, setStatus] = useState('Available')
    const [successSubmitted, setSuccessSubmitted] = useState(false)

    useEffect(() => {
        lifecycle.available({paymentMethods: [CONTRACT_TEST_PAYMENT_METHOD]})
    }, [lifecycle])

    const reportAvailable = () => {
        lifecycle.available({paymentMethods: [CONTRACT_TEST_PAYMENT_METHOD]})
        setStatus('Available')
    }

    const reportUnavailable = () => {
        lifecycle.unavailable()
        setStatus('Unavailable')
    }

    const reportFailure = () => {
        lifecycle.failure({
            shopperMessage: 'Contract-test failure',
            paymentMethod: CONTRACT_TEST_PAYMENT_METHOD
        })
        setStatus('Failure reported; retry remains available')
    }

    const reportCancellation = () => {
        lifecycle.cancel({
            shopperMessage: 'Contract-test cancellation',
            paymentMethod: CONTRACT_TEST_PAYMENT_METHOD
        })
        setStatus('Cancellation reported; retry remains available')
    }

    const reportSuccess = () => {
        lifecycle.success({
            orderId: CONTRACT_TEST_ORDER_ID,
            paymentMethod: CONTRACT_TEST_PAYMENT_METHOD
        })
        setSuccessSubmitted(true)
        setStatus('Simulated success submitted; fixture controls are now disabled')
    }

    return (
        <Box
            data-testid="express-payment-contract-test-provider"
            borderWidth="1px"
            borderRadius="md"
            bg="white"
            p={3}
        >
            <Text fontWeight="semibold">Express payment iframe shell is ready</Text>
            <Text fontSize="sm">
                {context.surface === 'product'
                    ? `Product: ${context.productId}, quantity: ${context.quantity}`
                    : `Cart payment surface, basket: ${context.basket.id || context.basket.status}`}
            </Text>
            <Text fontSize="xs">
                Site: {context.siteId}, locale: {context.locale}, currency: {context.currency}
            </Text>
            <Text role="status" aria-live="polite" fontSize="sm" mt={2}>
                {status}
            </Text>
            <Stack direction="row" flexWrap="wrap" spacing={2} mt={3}>
                <Button size="sm" onClick={reportAvailable} isDisabled={successSubmitted}>
                    Report available
                </Button>
                <Button size="sm" onClick={reportUnavailable} isDisabled={successSubmitted}>
                    Report unavailable
                </Button>
                <Button size="sm" onClick={reportFailure} isDisabled={successSubmitted}>
                    Report failure
                </Button>
                <Button size="sm" onClick={reportCancellation} isDisabled={successSubmitted}>
                    Report cancellation
                </Button>
                <Button size="sm" onClick={reportSuccess} isDisabled={successSubmitted}>
                    Report simulated success
                </Button>
            </Stack>
        </Box>
    )
}

ContractTestProvider.propTypes = expressPaymentProviderPropTypes

export default ContractTestProvider
