/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {defineMessages, useIntl} from 'react-intl'

const msg = defineMessages({
    // price display
    currentPrice: {
        id: 'display_price.label.current_price',
        defaultMessage: '{currentPrice}'
    },
    currentPriceWithRange: {
        id: 'display_price.label.current_price_with_range',
        defaultMessage: 'From {currentPrice}'
    },
    listPrice: {
        id: 'display_price.label.list_price',
        defaultMessage: '{listPrice}'
    },
    // aria-label
    ariaLabelCurrentPrice: {
        id: 'display_price.assistive_msg.current_price',
        defaultMessage: `current price {currentPrice}`
    },
    ariaLabelCurrentPriceWithRange: {
        id: 'display_price.assistive_msg.current_price_with_range',
        defaultMessage: `From current price {currentPrice}`
    },
    ariaLabelListPrice: {
        id: 'display_price.assistive_msg.strikethrough_price',
        defaultMessage: `original price {listPrice}`
    },
    ariaLabelListPriceWithRange: {
        id: 'display_price.assistive_msg.strikethrough_price_with_range',
        defaultMessage: `From original price {listPrice}`
    }
})

/**
 * @param priceData - price info extracted from a product
 * // If a product is a set,
 *      on PLP, Show From X where X is the lowest of its children
 *      on PDP, Show From X where X is the lowest of its children and
 *          the set children will have it own price as From X (cross) Y
 * // if a product is a master
 *      on PLP and PDP, show From X (cross) Y , the X and Y are
 *          current and list price of variant that has the lowest price (including promotionalPrice)
 * // if a standard/bundle
 *      show exact price on PLP and PDP as X (cross) Y
 * @param currency - currency
 */
const DisplayPrice = ({priceData, currency}) => {
    const {listPrice, currentPrice, isASet, isMaster, isOnSale, isRange, hasRepresentedProduct} =
        priceData

    if (isASet) {
        return hasRepresentedProduct ? (
            <CurrentPrice price={currentPrice} as="span" currency={currency} isRange={true} />
        ) : (
            <CurrentPrice price={currentPrice} as="b" currency={currency} isRange={true} />
        )
    }
    if (isMaster) {
        if (isRange) {
            if (isOnSale) {
                return (
                    <>
                        <CurrentPrice
                            price={currentPrice}
                            as="b"
                            currency={currency}
                            isRange={true}
                        />{' '}
                        {listPrice && (
                            <ListPrice currency={currency} price={listPrice} isRange={true} />
                        )}
                    </>
                )
            } else {
                // bold front on PDP, normal font on PLP
                return hasRepresentedProduct ? (
                    <CurrentPrice
                        price={currentPrice}
                        as="span"
                        currency={currency}
                        isRange={true}
                    />
                ) : (
                    <CurrentPrice price={currentPrice} as="b" currency={currency} isRange={true} />
                )
            }
        } else {
            if (isOnSale) {
                return (
                    <>
                        <CurrentPrice price={currentPrice} as="b" currency={currency} />{' '}
                        <ListPrice currency={currency} price={listPrice} />
                    </>
                )
            } else {
                return hasRepresentedProduct ? (
                    <CurrentPrice price={currentPrice} as="span" currency={currency} />
                ) : (
                    <CurrentPrice price={currentPrice} as="b" currency={currency} />
                )
            }
        }
    }
    return (
        <Box>
            {isOnSale ? (
                <>
                    <CurrentPrice price={currentPrice} as="b" currency={currency} />{' '}
                    {listPrice && <ListPrice currency={currency} price={listPrice} />}
                </>
            ) : (
                <CurrentPrice price={currentPrice} as="span" currency={currency} />
            )}
        </Box>
    )
}
/**
 * @private
 * Component that displays current price of a product with a11y
 * @param price - price of the product
 * @param as - an HTML tag or component to be rendered as
 * @param isRange - show price as range or not
 * @param currency - currency to show the price in
 * @param extraProps - extra props to be passed into Text Component
 * @returns {JSX.Element}
 */
const CurrentPrice = ({price, as, isRange = false, currency, ...extraProps}) => {
    const intl = useIntl()
    const currentPriceText = intl.formatNumber(price, {
        style: 'currency',
        currency
    })
    return isRange ? (
        <Text
            as={as}
            {...extraProps}
            aria-label={intl.formatMessage(msg.ariaLabelCurrentPriceWithRange, {
                currentPrice: currentPriceText
            })}
        >
            {intl.formatMessage(msg.currentPriceWithRange, {
                currentPrice: currentPriceText
            })}
        </Text>
    ) : (
        <Text
            as={as}
            aria-label={intl.formatMessage(msg.ariaLabelCurrentPrice, {
                currentPrice: currentPriceText
            })}
        >
            {intl.formatMessage(msg.currentPrice, {
                currentPrice: currentPriceText
            })}
        </Text>
    )
}
CurrentPrice.propTypes = {
    price: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    as: PropTypes.string,
    isRange: PropTypes.bool,
    extraProps: PropTypes.object
}

/**
 * Component that displays list price of a product with a11y
 * @param price - price of the product
 * @param as - an HTML tag or component to be rendered as
 * @param isRange - show price as range or not
 * @param props - extra props to be passed into Text Component
 * @param extraProps - extra props to be passed into Text Component
 * @returns {JSX.Element}
 */
const ListPrice = ({price, isRange = false, as = 's', currency, ...extraProps}) => {
    const intl = useIntl()
    const listPriceText = intl.formatNumber(price, {
        style: 'currency',
        currency
    })

    return isRange ? (
        <Text
            as={as}
            {...extraProps}
            aria-label={intl.formatMessage(msg.ariaLabelListPriceWithRange, {
                listPrice: listPriceText || ''
            })}
            color="gray.600"
        >
            {intl.formatMessage(msg.listPrice, {
                listPrice: listPriceText
            })}
        </Text>
    ) : (
        <Text
            as={as}
            aria-label={intl.formatMessage(msg.ariaLabelListPrice, {
                listPrice: listPriceText || ''
            })}
            color="gray.600"
        >
            {intl.formatMessage(msg.listPrice, {
                listPrice: listPriceText
            })}
        </Text>
    )
}
ListPrice.propTypes = {
    price: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    as: PropTypes.string,
    isRange: PropTypes.bool,
    extraProps: PropTypes.object
}
DisplayPrice.propTypes = {
    priceData: PropTypes.shape({
        currentPrice: PropTypes.number.isRequired,
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
