/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'

const OrderTypeDisplay = ({
    isPickupOrder,
    store,
    itemsInShipment,
    totalItemsInCart,
    onChangeStore
}) => {
    return (
        <Box>
            {isPickupOrder ? (
                <Box>
                    <Text fontWeight="bold" mb={2}>
                        <FormattedMessage
                            defaultMessage="Pick Up in Store - {itemsInShipment} out of {totalItemsInCart} items"
                            id="cart.order_type.pickup_in_store"
                            values={{
                                itemsInShipment,
                                totalItemsInCart
                            }}
                        />
                    </Text>
                    <Box layerStyle="cardBordered" p={4} borderRadius="md">
                        <StoreDisplay
                            store={store}
                            showDistance={true}
                            textSize="sm"
                            nameStyle={{fontSize: 'sm', fontWeight: 'semibold'}}
                            onChangeStore={onChangeStore}
                        />
                    </Box>
                </Box>
            ) : (
                <Text fontWeight="bold">
                    <FormattedMessage
                        defaultMessage="Delivery - {itemsInShipment} out of {totalItemsInCart} items"
                        id="cart.order_type.delivery"
                        values={{
                            itemsInShipment,
                            totalItemsInCart
                        }}
                    />
                </Text>
            )}
        </Box>
    )
}

OrderTypeDisplay.propTypes = {
    isPickupOrder: PropTypes.bool.isRequired,
    store: PropTypes.object,
    itemsInShipment: PropTypes.number.isRequired,
    totalItemsInCart: PropTypes.number.isRequired,
    onChangeStore: PropTypes.func
}

export default OrderTypeDisplay
