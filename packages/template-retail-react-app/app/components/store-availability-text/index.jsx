/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'

// Components
import {Box, Link} from '@salesforce/retail-react-app/app/components/shared/ui'

// Others
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/components/store-locator-modal'

const StoreAvailabilityText = ({productInventories}) => {
    const {selectedStore, isStoreSelected} = useContext(StoreLocatorContext)
    const inStock =
        selectedStore.inventoryId &&
        Boolean(
            productInventories?.find(
                (inventory) => inventory.id === selectedStore.inventoryId && inventory.orderable
            )
        )

    return (
        <Box gap={1} fontWeight={400} display="flex">
            {isStoreSelected ? (
                <>
                    {inStock ? (
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

                    <Link>{selectedStore.name}</Link>
                </>
            ) : (
                <>
                    <FormattedMessage
                        id={'product_view.store_availability.in_stock_at'}
                        defaultMessage={'In Stock at'}
                    />
                    <Link>
                        <FormattedMessage
                            id={'product_view.link.select_store'}
                            defaultMessage={'Select Store'}
                        />
                    </Link>
                </>
            )}
        </Box>
    )
}

StoreAvailabilityText.propTypes = {
    productInventories: PropTypes.arrayOf(PropTypes.object)
}

export default StoreAvailabilityText
