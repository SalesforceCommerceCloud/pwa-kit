/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Heading} from '@chakra-ui/react'

const OrderStatusPage = () => {
    return (
        <Box data-testid="order-status-page" minH="100vh" bg="gray.50" pt={24}>
            <Heading as="h1" size="lg" textAlign="center">
                Order Status
            </Heading>
        </Box>
    )
}

export default OrderStatusPage
