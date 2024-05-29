/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {
    Stack,
    Text,
    useBreakpointValue
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useItemVariant} from '.'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'

const PricePerItem = ({currency, basePrice}) => {
    return (
        <Text fontSize={{base: '12px', lg: '14px'}}>
            <FormattedNumber style="currency" currency={currency} value={basePrice} />
            <FormattedMessage
                defaultMessage="ea"
                id="price_per_item.label.each"
                description="Abbreviated 'each', follows price per item, like $10/ea"
            />
        </Text>
    )
}

PricePerItem.propTypes = {
    currency: PropTypes.string.isRequired,
    basePrice: PropTypes.number
}

/**
 * In the context of a cart product item variant, this component renders the item's
 * pricing, taking into account applied discounts as well as base item prices.
 */
const ItemPrice = ({currency, align = 'right', baseDirection = 'column', ...props}) => {
    const variant = useItemVariant()
    const {price, priceAfterItemDiscount} = variant
    const isASet = variant?.type?.set
    const isMaster = variant?.type?.master
    let priceData
    // When variant has basket pricing, we should prioritize these prices for displaying
    // since they may have take promotion/discount into account
    // NOTE: try NOT to re-calculate these values since basket-level discount is complicated
    if (variant?.itemId) {
        priceData = {
            currentPrice: priceAfterItemDiscount,
            listPrice: price,
            pricePerUnit: variant?.pricePerUnit,
            isASet,
            isMaster,
            isRange: isASet || isMaster || false,
            isOnSale: price > priceAfterItemDiscount
        }
    } else {
        // for wishlist page we extract price info from variant/product obj
        priceData = getPriceData(variant)
    }
    const isDesktop = useBreakpointValue({base: false, lg: true})
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
            {variant?.quantity > 1 && !isASet && priceData?.pricePerUnit && !isDesktop && (
                <PricePerItem currency={currency} basePrice={priceData.pricePerUnit} />
            )}
            {variant?.itemId ? (
                <DisplayPrice
                    currency={currency}
                    priceData={priceData}
                    listPriceProps={{fontSize: 'sm'}}
                />
            ) : (
                <DisplayPrice
                    currency={currency}
                    priceData={priceData}
                    quantity={variant?.quantity}
                    listPriceProps={{fontSize: 'sm'}}
                />
            )}

            {variant?.quantity > 1 && !isASet && priceData?.pricePerUnit && isDesktop && (
                <PricePerItem currency={currency} basePrice={priceData.pricePerUnit} />
            )}
        </Stack>
    )
}

ItemPrice.propTypes = {
    currency: PropTypes.string.isRequired,
    align: PropTypes.string,
    baseDirection: PropTypes.string
}

export default ItemPrice
