/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Container,
    Heading,
    SimpleGrid,
    Stack,
    Text,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useStores} from '@salesforce/commerce-sdk-react'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'

const onClient = typeof window !== 'undefined'

const ShipmentDetails = ({shipments = []}) => {
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    // Get all unique store IDs from pickup shipments
    const storeIds =
        shipments
            ?.filter((shipment) => storeLocatorEnabled && isPickupShipment(shipment))
            .map((shipment) => shipment.c_fromStoreId)
            .filter(Boolean) || []

    // Fetch store data for all pickup shipments
    const {data: storeData} = useStores(
        {
            parameters: {
                ids: storeIds.join(',')
            }
        },
        {
            enabled: storeIds.length > 0 && onClient
        }
    )

    if (!shipments || shipments.length === 0) {
        return null
    }

    // Group shipments by type (pickup vs delivery)
    const pickupShipments = []
    const deliveryShipments = []

    shipments.forEach((shipment) => {
        const isPickup = storeLocatorEnabled && isPickupShipment(shipment)

        if (isPickup) {
            pickupShipments.push(shipment)
        } else {
            deliveryShipments.push(shipment)
        }
    })

    const getStoreData = (storeId) => {
        if (!storeData?.data) return null
        return storeData.data.find((store) => store.id === storeId)
    }

    return (
        <Stack spacing={4}>
            {/* Pickup Details */}
            {pickupShipments.length > 0 && (
                <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                    <Container variant="form">
                        <Stack spacing={6}>
                            <Heading fontSize="lg">
                                <FormattedMessage
                                    defaultMessage="Pickup Details"
                                    id="checkout_confirmation.heading.pickup_details"
                                />
                            </Heading>

                            <Stack spacing={4}>
                                {pickupShipments.map((shipment, index) => {
                                    const store = getStoreData(shipment.c_fromStoreId)

                                    return (
                                        <Box key={`pickup-${index}`}>
                                            {pickupShipments.length > 1 && (
                                                <Heading as="h3" fontSize="md" mb={3}>
                                                    <FormattedMessage
                                                        defaultMessage="Pickup Location {number}"
                                                        id="checkout_confirmation.heading.pickup_location_number"
                                                        values={{number: index + 1}}
                                                    />
                                                </Heading>
                                            )}

                                            <Stack spacing={2}>
                                                <Heading as="h3" fontSize="sm">
                                                    <FormattedMessage
                                                        defaultMessage="Pickup Address"
                                                        id="checkout_confirmation.heading.pickup_address"
                                                    />
                                                </Heading>
                                                {store ? (
                                                    <StoreDisplay
                                                        store={store}
                                                        showDistance={true}
                                                        showEmail={true}
                                                        showPhone={true}
                                                        showStoreHours={true}
                                                    />
                                                ) : (
                                                    <Text>
                                                        <FormattedMessage
                                                            defaultMessage="Store information isn't available"
                                                            id="checkout_confirmation.message.store_info_unavailable"
                                                        />
                                                    </Text>
                                                )}
                                            </Stack>

                                            {index < pickupShipments.length - 1 && (
                                                <Divider my={4} />
                                            )}
                                        </Box>
                                    )
                                })}
                            </Stack>
                        </Stack>
                    </Container>
                </Box>
            )}

            {/* Delivery Details */}
            {deliveryShipments.length > 0 && (
                <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                    <Container variant="form">
                        <Stack spacing={6}>
                            <Heading fontSize="lg">
                                <FormattedMessage
                                    defaultMessage="Delivery Details"
                                    id="checkout_confirmation.heading.delivery_details"
                                />
                            </Heading>

                            <Stack spacing={4}>
                                {deliveryShipments.map((shipment, index) => (
                                    <Box key={`delivery-${index}`}>
                                        {deliveryShipments.length > 1 && (
                                            <Heading as="h3" fontSize="md" mb={3}>
                                                <FormattedMessage
                                                    defaultMessage="Delivery {number}"
                                                    id="checkout_confirmation.heading.delivery_number"
                                                    values={{number: index + 1}}
                                                />
                                            </Heading>
                                        )}

                                        <SimpleGrid columns={[1, 1, 2]} spacing={6}>
                                            <Stack spacing={1}>
                                                <Heading as="h3" fontSize="sm">
                                                    <FormattedMessage
                                                        defaultMessage="Shipping Address"
                                                        id="checkout_confirmation.heading.shipping_address"
                                                    />
                                                </Heading>
                                                <AddressDisplay
                                                    address={shipment.shippingAddress}
                                                />
                                            </Stack>

                                            <Stack spacing={1}>
                                                <Heading as="h3" fontSize="sm">
                                                    <FormattedMessage
                                                        defaultMessage="Shipping Method"
                                                        id="checkout_confirmation.heading.shipping_method"
                                                    />
                                                </Heading>
                                                <Box>
                                                    <Text>{shipment.shippingMethod.name}</Text>
                                                    <Text>
                                                        {shipment.shippingMethod.description}
                                                    </Text>
                                                </Box>
                                            </Stack>
                                        </SimpleGrid>

                                        {index < deliveryShipments.length - 1 && <Divider my={4} />}
                                    </Box>
                                ))}
                            </Stack>
                        </Stack>
                    </Container>
                </Box>
            )}
        </Stack>
    )
}

ShipmentDetails.propTypes = {
    shipments: PropTypes.array
}

export default ShipmentDetails
