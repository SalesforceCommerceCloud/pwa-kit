/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'

/**
 * @param priceData - price info extracted from a product
 * // If a product is a set,
 *      on PLP, Show From X where X is the lowest of its children
 *      on PDP, Show From X where X is the lowest of its children and
 *          the set children will have it own price as From X (cross) Y
 * // if a product is a master
 *      on PLP and PDP, show From X (cross) Y , the X and Y are
 *          sale and list price of variant that has the lowest price (including promotionalPrice)
 * // if a standard/bundle
 *      show exact price on PLP and PDP as X (cross) Y
 * @param currency - currency
 */
const DisplayPrice = ({priceData, currency}) => {
    const intl = useIntl()
    const {listPrice, salePrice, isASet, isMaster, isOnSale, isRange, hasRepresentedProduct} =
        priceData
    const salePriceText = intl.formatNumber(salePrice, {
        style: 'currency',
        currency: currency
    })
    const listPriceText =
        listPrice &&
        intl.formatNumber(listPrice, {
            style: 'currency',
            currency: currency
        })

    const prefixText = intl.formatMessage({
        id: 'price_display.text.from',
        defaultMessage: 'From '
    })

    const ariaLabelSalePrice = intl.formatMessage(
        {
            id: 'display_price.assistive_msg.current_price',
            defaultMessage: `current price {price}`
        },
        {
            price: intl.formatNumber(salePrice || 0, {style: 'currency', currency})
        }
    )
    const ariaLabelListPrice = intl.formatMessage(
        {
            id: 'display_price.assistive_msg.strikethrough_price',
            defaultMessage: `old price {price}`
        },
        {
            price: intl.formatNumber(listPrice || 0, {style: 'currency', currency})
        }
    )
    if (isASet) {
        return hasRepresentedProduct ? (
            <Text as="span" aria-label={`${prefixText} ${ariaLabelSalePrice}`}>
                {prefixText} {salePriceText}
            </Text>
        ) : (
            <Text as="b" aria-label={`${prefixText} ${ariaLabelSalePrice}`}>
                {prefixText} {salePriceText}
            </Text>
        )
    }
    if (isMaster) {
        if (isRange) {
            if (isOnSale) {
                return (
                    <>
                        <Text as="b" aria-label={`${prefixText} ${ariaLabelSalePrice}`}>
                            {prefixText} {salePriceText}
                        </Text>{' '}
                        <Text
                            as="s"
                            aria-label={`${prefixText} ${ariaLabelListPrice}`}
                            color="gray.600"
                        >
                            {listPriceText}
                        </Text>
                    </>
                )
            } else {
                // bold front on PDP, normal font on PLP
                return hasRepresentedProduct ? (
                    <Text as="span" aria-label={`${prefixText} ${ariaLabelSalePrice}`}>
                        {prefixText} {salePriceText}
                    </Text>
                ) : (
                    <Text as="b" aria-label={`${prefixText} ${ariaLabelSalePrice}`}>
                        {prefixText} {salePriceText}
                    </Text>
                )
            }
        } else {
            if (isOnSale) {
                return (
                    <>
                        <Text as="b" aria-label={ariaLabelSalePrice}>
                            {salePriceText}
                        </Text>{' '}
                        <Text as="s" aria-label={ariaLabelListPrice} color="gray.600">
                            {listPriceText}
                        </Text>
                    </>
                )
            } else {
                return hasRepresentedProduct ? (
                    <Text as="span" aria-label={ariaLabelSalePrice}>
                        {salePriceText}
                    </Text>
                ) : (
                    <Text as="b" aria-label={ariaLabelSalePrice}>
                        {salePriceText}
                    </Text>
                )
            }
        }
    }
    return (
        <Box>
            {isOnSale ? (
                <>
                    <Text as="b" aria-label={ariaLabelSalePrice}>
                        {salePriceText}
                    </Text>{' '}
                    {listPriceText && (
                        <Text as="s" aria-label={ariaLabelListPrice}>
                            {listPriceText}
                        </Text>
                    )}
                </>
            ) : (
                <Text as="span" aria-label={ariaLabelSalePrice}>
                    {salePriceText}
                </Text>
            )}
        </Box>
    )
}

DisplayPrice.propTypes = {
    priceData: PropTypes.shape({
        salePrice: PropTypes.number.isRequired,
        isOnSale: PropTypes.bool.isRequired,
        listPrice: PropTypes.number,
        isASet: PropTypes.bool,
        isMaster: PropTypes.bool,
        isRange: PropTypes.bool,
        hasRepresentedProduct: PropTypes.bool,
        maxPrice: PropTypes.number,
        tieredPrice: PropTypes.number
    }),
    currency: PropTypes.string
}

export default DisplayPrice
