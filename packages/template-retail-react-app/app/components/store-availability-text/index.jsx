/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

// Components
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

// Hooks
import {useIntl} from 'react-intl'

const StoreAvailabilityText = ({selectedStore, productInventories}) => {
    const intl = useIntl()
    const inStock = productInventories?.find(
        (inventory) => inventory.id === selectedStore.inventoryId && inventory.orderable
    )

    return (
        <Box gap={1} fontWeight={400} display="flex">
            <Text>
                {!productInventories || inStock
                    ? intl.formatMessage({
                          defaultMessage: 'In Stock at'
                      })
                    : intl.formatMessage({defaultMessage: 'Out of Stock at'})}
            </Text>
            <Text>{selectedStore.name ? selectedStore.name : 'Select Store'}</Text>
        </Box>
    )
}

StoreAvailabilityText.propTypes = {
    selectedStore: PropTypes.object,
    productInventories: PropTypes.arrayOf(PropTypes.object)
}

export default StoreAvailabilityText
