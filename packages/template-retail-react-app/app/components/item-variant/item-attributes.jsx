/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Flex, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useItemVariant} from '@salesforce/retail-react-app/app/components/item-variant'
import PromoPopover from '@salesforce/retail-react-app/app/components/promo-popover'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {usePromotions} from '@salesforce/commerce-sdk-react'

/**
 * In the context of a cart product item variant, this component renders a styled
 * list of the selected variation values as well as any promos (w/ info popover).
 */
const ItemAttributes = ({includeQuantity, currency, ...props}) => {
    const variant = useItemVariant()
    const {data: basket} = useCurrentBasket()
    const {currency: activeCurrency} = useCurrency()
    const promotionIds = variant.priceAdjustments?.map((adj) => adj.promotionId) ?? []

    // Fetch all the promotions given by price adjustments. We display this info in
    // the promotion info popover when applicable.
    const {data: res} = usePromotions(
        {
            parameters: {
                ids: promotionIds.join(',')
            }
        },
        {
            enabled: promotionIds.length > 0
        }
    )
    const promos = res?.data || []
    // Create a mapping of variation values to their associated attributes. This allows us
    // the render the readable names/labels rather than variation value IDs.
    const variationValues = Object.keys(variant.variationValues || []).map((key) => {
        const value = variant.variationValues[key]
        const attr = variant.variationAttributes?.find((attr) => attr.id === key)
        return {
            id: key,
            name: attr?.name || key,
            value: attr.values.find((val) => val.value === value)?.name || value
        }
    })

    return (
        <Stack spacing={1.5} flex={1} {...props}>
            {variationValues?.map((variationValue) => (
                <Text lineHeight={1} color="gray.700" fontSize="sm" key={variationValue.id}>
                    {variationValue.name}: {variationValue.value}
                </Text>
            ))}

            {includeQuantity && (
                <Text lineHeight={1} color="gray.700" fontSize="sm">
                    <FormattedMessage
                        defaultMessage="Quantity: {quantity}"
                        values={{quantity: variant.quantity}}
                        id="item_attributes.label.quantity"
                    />
                </Text>
            )}

            {variant.priceAdjustments?.length > 0 && (
                <Flex alignItems="center">
                    <Text lineHeight={1} color="gray.700" fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Promotions"
                            id="item_attributes.label.promotions"
                        />
                        {': '}
                        <Text as="span" color="green.500">
                            <FormattedNumber
                                style="currency"
                                currency={currency || basket?.currency || activeCurrency}
                                value={variant.priceAdjustments.reduce(
                                    (acc, adj) => acc + (adj.price ?? 0),
                                    0
                                )}
                            />
                        </Text>
                    </Text>
                    <PromoPopover ml={2}>
                        <Stack>
                            {promos?.map((promo) => (
                                <Text key={promo?.id} fontSize="sm">
                                    {promo?.calloutMsg}
                                </Text>
                            ))}
                        </Stack>
                    </PromoPopover>
                </Flex>
            )}
        </Stack>
    )
}

ItemAttributes.propTypes = {
    includeQuantity: PropTypes.bool,
    currency: PropTypes.string
}

export default ItemAttributes
