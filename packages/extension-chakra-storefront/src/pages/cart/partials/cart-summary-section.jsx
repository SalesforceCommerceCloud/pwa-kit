/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Stack, Flex} from '@chakra-ui/react'
import OrderSummary from '../../../components/order-summary'
import CartCta from './cart-cta'

/**
 * Cart summary section component that displays order summary and CTA
 * @param {Object} props - Component props
 * @param {Object} props.basket - The current basket data
 * @param {boolean} props.isDesktop - Whether this is the desktop version
 * @returns {JSX.Element} The cart summary section component
 */
const CartSummarySection = ({basket, isDesktop = true}) => {
    if (isDesktop) {
        return (
            <Stack gap={4}>
                <OrderSummary showPromoCodeForm={true} isEstimate={true} basket={basket} />
                <Box display={{base: 'none', lg: 'block'}}>
                    <CartCta />
                </Box>
            </Stack>
        )
    }

    // Mobile sticky version
    return (
        <Flex
            h="130px"
            position="sticky"
            bottom={0}
            bg="white"
            alignItems="center"
            flexDirection="column"
            display={{base: 'flex', lg: 'none'}}
        >
            <CartCta />
        </Flex>
    )
}

CartSummarySection.propTypes = {
    basket: PropTypes.object.isRequired,
    isDesktop: PropTypes.bool.isRequired
}

export default CartSummarySection
