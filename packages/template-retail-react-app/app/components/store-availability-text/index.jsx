/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'

// Components
import {Box, Link} from '@salesforce/retail-react-app/app/components/shared/ui'

const StoreAvailabilityText = ({selectedStore, productInventories}) => {
    const inStock = productInventories?.find(
        (inventory) => inventory.id === selectedStore.inventoryId && inventory.orderable
    )

    return (
        <Box gap={1} fontWeight={400} display="flex">
            {!productInventories || inStock ? (
                <FormattedMessage
                    id={'product_view.store_availability.in_stock_at'}
                    defaultMessage={'In Stock at'}
                />
            ) : (
                <FormattedMessage
                    id={'product_view.store_availability.out_of_stock_at'}
                    defaultMessage={'Out of Stock at'}
                />
            )}
            <Link>
                {selectedStore?.name ? (
                    selectedStore.name
                ) : (
                    <FormattedMessage
                        id={'product_view.link.select_store'}
                        defaultMessage={'Select Store'}
                    />
                )}
            </Link>
        </Box>
    )
}

StoreAvailabilityText.propTypes = {
    selectedStore: PropTypes.object,
    productInventories: PropTypes.arrayOf(PropTypes.object)
}

export default StoreAvailabilityText
