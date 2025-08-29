/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedNumber, useIntl} from 'react-intl'
import {
    Box,
    Flex,
    Stack,
    Text,
    VStack,
    Radio,
    RadioGroup
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Controller} from 'react-hook-form'
import {useShippingMethodsForShipment} from '@salesforce/commerce-sdk-react'
import PropTypes from 'prop-types'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Component to handle shipping options for a single shipment (without product cards)
const ShippingMethodOptions = ({shipment, basketId, currency, control}) => {
    const {formatMessage} = useIntl()
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    const {data: shippingMethods, isLoading: isShippingMethodsLoading} =
        useShippingMethodsForShipment(
            {
                parameters: {
                    basketId: basketId,
                    shipmentId: shipment.shipmentId
                }
            },
            {
                enabled: Boolean(basketId && shipment.shipmentId && shipment.shippingAddress)
            }
        )

    if (!shipment.shippingAddress) {
        return null
    }

    const fieldName = `shippingMethodId_${shipment.shipmentId}`

    // Filter out pickup shipping methods only if store locator/BOPIS is enabled
    const applicableShippingMethods = storeLocatorEnabled
        ? shippingMethods?.applicableShippingMethods?.filter(
              (method) => !method.c_storePickupEnabled
          ) || []
        : shippingMethods?.applicableShippingMethods || []

    return (
        <VStack spacing={6} align="stretch">
            {/* Shipping Options Only */}
            <Box pt={2} pb={6} px={2}>
                {isShippingMethodsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                        <LoadingSpinner />
                    </Box>
                ) : (
                    applicableShippingMethods.length > 0 && (
                        <Box px={4}>
                            <Controller
                                name={fieldName}
                                control={control}
                                defaultValue=""
                                rules={{required: true}}
                                render={({field}) => (
                                    <RadioGroup
                                        {...field}
                                        name={`shipping-options-radiogroup-${shipment.shipmentId}`}
                                    >
                                        <Stack spacing={2}>
                                            {applicableShippingMethods.map((opt) => (
                                                <Radio value={opt.id} key={opt.id}>
                                                    <Box w="full">
                                                        <Flex
                                                            justify="space-between"
                                                            w="full"
                                                            align="flex-start"
                                                        >
                                                            <Box flex={1}>
                                                                <Text
                                                                    fontSize="sm"
                                                                    fontWeight="medium"
                                                                >
                                                                    {opt.name}
                                                                </Text>
                                                                <Text
                                                                    fontSize="xs"
                                                                    color="gray.600"
                                                                    mt={0.5}
                                                                >
                                                                    {opt.description}
                                                                </Text>
                                                            </Box>
                                                            <Box
                                                                fontWeight="bold"
                                                                fontSize="sm"
                                                                ml={2}
                                                            >
                                                                {opt.price === 0 ? (
                                                                    <Text color="green.600">
                                                                        {formatMessage({
                                                                            defaultMessage: 'Free',
                                                                            id: 'shipping_options.free'
                                                                        })}
                                                                    </Text>
                                                                ) : (
                                                                    <FormattedNumber
                                                                        value={opt.price}
                                                                        style="currency"
                                                                        currency={currency}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Flex>
                                                        {opt.shippingPromotions &&
                                                            opt.shippingPromotions.length > 0 && (
                                                                <VStack
                                                                    spacing={0.5}
                                                                    mt={1}
                                                                    align="flex-start"
                                                                >
                                                                    {opt.shippingPromotions.map(
                                                                        (promo) => (
                                                                            <Text
                                                                                key={
                                                                                    promo.promotionId
                                                                                }
                                                                                fontSize="xs"
                                                                                color="green.600"
                                                                            >
                                                                                {promo.calloutMsg}
                                                                            </Text>
                                                                        )
                                                                    )}
                                                                </VStack>
                                                            )}
                                                    </Box>
                                                </Radio>
                                            ))}
                                        </Stack>
                                    </RadioGroup>
                                )}
                            />
                        </Box>
                    )
                )}
            </Box>
        </VStack>
    )
}

ShippingMethodOptions.propTypes = {
    shipment: PropTypes.shape({
        shipmentId: PropTypes.string.isRequired,
        shippingAddress: PropTypes.shape({
            firstName: PropTypes.string,
            lastName: PropTypes.string,
            address1: PropTypes.string,
            city: PropTypes.string,
            stateCode: PropTypes.string,
            postalCode: PropTypes.string
        }),
        shippingMethod: PropTypes.shape({
            id: PropTypes.string
        })
    }).isRequired,
    basketId: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    control: PropTypes.object.isRequired
}

export default ShippingMethodOptions
