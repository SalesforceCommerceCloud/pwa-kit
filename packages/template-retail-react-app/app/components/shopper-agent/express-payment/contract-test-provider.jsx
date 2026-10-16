/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'

import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

/**
 * Temporary provider used to validate the iframe shell before a real payment
 * provider is connected. Replace the export in provider.jsx to change providers.
 */
const ContractTestProvider = ({context, lifecycle}) => {
    useEffect(() => {
        lifecycle.available({paymentMethods: ['CONTRACT_TEST']})
    }, [lifecycle])

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
        </Box>
    )
}

ContractTestProvider.propTypes = {
    context: PropTypes.oneOfType([
        PropTypes.shape({
            contractVersion: PropTypes.number.isRequired,
            surface: PropTypes.oneOf(['cart']).isRequired,
            siteId: PropTypes.string.isRequired,
            locale: PropTypes.string.isRequired,
            currency: PropTypes.string.isRequired,
            basket: PropTypes.shape({
                id: PropTypes.string,
                status: PropTypes.oneOf(['loading', 'ready', 'empty', 'error']).isRequired
            }).isRequired
        }),
        PropTypes.shape({
            contractVersion: PropTypes.number.isRequired,
            surface: PropTypes.oneOf(['product']).isRequired,
            siteId: PropTypes.string.isRequired,
            locale: PropTypes.string.isRequired,
            currency: PropTypes.string.isRequired,
            productId: PropTypes.string.isRequired,
            quantity: PropTypes.number.isRequired
        })
    ]).isRequired,
    lifecycle: PropTypes.shape({
        available: PropTypes.func.isRequired,
        unavailable: PropTypes.func.isRequired,
        success: PropTypes.func.isRequired,
        failure: PropTypes.func.isRequired,
        cancel: PropTypes.func.isRequired
    }).isRequired
}

export default ContractTestProvider
