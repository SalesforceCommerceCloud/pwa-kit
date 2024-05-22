/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import {Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useItemVariant} from '.'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'

const PricePerItem = ({currency, basket, basePrice}) => {
    const {currency: activeCurrency} = useCurrency()
    return (
        <Text fontSize={{base: '12px', lg: '14px'}}>
            <FormattedNumber
                style="currency"
                currency={currency || basket?.currency || activeCurrency}
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
    basePrice: PropTypes.number
}

/**
 * In the context of a cart product item variant, this component renders the item's
 * pricing, taking into account applied discounts as well as base item prices.
 */
const ItemPrice = ({currency, align = 'right', baseDirection = 'column', ...props}) => {
    const variant = useItemVariant()
    const {data: basket} = useCurrentBasket()
    const {price, basePrice, priceAfterItemDiscount} = variant
    const isSet = variant?.type?.set
    const isMaster = variant?.type?.master
    let priceData
    // this indicates the variant is on cart page
    // variant on cart page will have price info that takes quantity into the account
    // we should prioritize use these val instead of having to re-calculate them again
    if (variant?.itemId) {
        priceData = {
            currentPrice: priceAfterItemDiscount,
            listPrice: price,
            isSet,
            isMaster,
            isRange: isSet || isMaster || false,
            isOnSale: price > priceAfterItemDiscount
        }
    } else {
        // for wishlist page
        priceData = getPriceData(variant)
    }
    const isOnSale = price > priceAfterItemDiscount || priceData?.isOnSale

    return (
        <Stack
            textAlign={align}
            direction={isOnSale ? 'column' : {base: baseDirection, lg: 'row'}}
            justifyContent={align === 'left' ? 'flex-start' : 'flex-end'}
            alignItems="baseline"
            spacing={isOnSale ? 0 : 1}
            wrap="nowrap"
            {...props}
        >
            {basePrice && price !== basePrice && (
                <HideOnDesktop>
                    <PricePerItem currency={currency} basePrice={basePrice} basket={basket} />
                </HideOnDesktop>
            )}
            <DisplayPrice
                currency={currency}
                priceData={priceData}
                listPriceProps={{fontSize: 'sm'}}
            />

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
