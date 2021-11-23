/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Stack, Text} from '@chakra-ui/react'
import useBasket from '../../commerce-api/hooks/useBasket'
import {useItemVariant} from '.'
import {HideOnDesktop, HideOnMobile} from '../responsive'
import {useCurrency} from '../../hooks'

const PricePerItem = ({currency, basket, basePrice}) => {
    const {currency: activeCurrency} = useCurrency()
    return (
        <Text fontSize={{base: '12px', lg: '14px'}}>
            <FormattedNumber
                style="currency"
                currency={currency || basket.currency || activeCurrency}
                value={basePrice}
            />
            <FormattedMessage
                defaultMessage="ea"
                id="price_per_item.label.each"
                description="Abbreviated 'each', follows price per item, like $10/ea"
            />
        </Text>
    )
}

PricePerItem.propTypes = {
    currency: PropTypes.string,
    basket: PropTypes.object,
    basePrice: PropTypes.string
}

/**
 * In the context of a cart product item variant, this component renders the item's
 * pricing, taking into account applied discounts as well as base item prices.
 */
const ItemPrice = ({currency, align = 'right', baseDirection = 'column', ...props}) => {
    const variant = useItemVariant()
    const basket = useBasket()
    const {currency: activeCurrency} = useCurrency()

    const {price, basePrice, priceAfterItemDiscount} = variant

    const displayPrice = priceAfterItemDiscount ? Math.min(price, priceAfterItemDiscount) : price

    const hasDiscount = displayPrice !== price

    return (
        <Stack
            textAlign={align}
            direction={hasDiscount ? 'column' : {base: baseDirection, lg: 'row'}}
            justifyContent={align === 'left' ? 'flex-start' : 'flex-end'}
            alignItems="baseline"
            spacing={hasDiscount ? 0 : 1}
            wrap="row"
            {...props}
        >
            {basePrice && price !== basePrice && (
                <HideOnDesktop>
                    <PricePerItem currency={currency} basePrice={basePrice} basket={basket} />
                </HideOnDesktop>
            )}
            <Text fontWeight="bold" lineHeight={{base: '0.5', lg: '24px'}}>
                <FormattedNumber
                    style="currency"
                    currency={currency || basket.currency || activeCurrency}
                    value={displayPrice}
                />
                {hasDiscount && (
                    <Text
                        as="span"
                        fontSize="sm"
                        fontWeight="normal"
                        textDecoration="line-through"
                        color="gray.500"
                        marginLeft={1}
                    >
                        <FormattedNumber
                            style="currency"
                            currency={currency || basket.currency || activeCurrency}
                            value={price}
                        />
                    </Text>
                )}
            </Text>

            {basePrice && price !== basePrice && (
                <HideOnMobile>
                    <PricePerItem currency={currency} basePrice={basePrice} basket={basket} />
                </HideOnMobile>
            )}
        </Stack>
    )
}

ItemPrice.propTypes = {
    currency: PropTypes.string,
    align: PropTypes.string,
    baseDirection: PropTypes.string
}

export default ItemPrice
