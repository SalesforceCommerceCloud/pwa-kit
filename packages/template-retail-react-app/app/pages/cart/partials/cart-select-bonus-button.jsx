/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Stack, Button, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

const CartSelectBonusButton = ({
    handleBonusButtonClick,
    promotionName,
    maxOfferCount,
    selectedOfferCount
}) => {
    return (
        <Stack spacing={2} p={6}>
            <Text fontSize="lg" fontWeight="bold">
                {promotionName} ({selectedOfferCount} of {maxOfferCount} selected)
            </Text>
            <Box pt={2}>
                <Button
                    onClick={handleBonusButtonClick}
                    width="100%"
                    variant="outline"
                    size="lg"
                    borderColor="gray.500"
                    color="blue.500"
                >
                    Select Bonus Products
                </Button>
            </Box>
        </Stack>
    )
}

CartSelectBonusButton.propTypes = {
    handleBonusButtonClick: PropTypes.func.isRequired,
    maxOfferCount: PropTypes.number.isRequired,
    selectedOfferCount: PropTypes.number.isRequired,
    promotionName: PropTypes.string
}

export default CartSelectBonusButton
