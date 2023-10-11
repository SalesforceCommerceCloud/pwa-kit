/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Skeleton, Text, useMultiStyleConfig} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import {useCurrency} from '../../hooks'
import useProductPricing from '../../hooks/use-product-pricing'

const DisplayPrice = ({product, scope = 'pdp', quantity = 1}) => {
    const intl = useIntl()
    const {currency: activeCurrency} = useCurrency()
    const {currency, basePrice, discountPrice} = useProductPricing(product, quantity)
    const styles = useMultiStyleConfig('DisplayPrice', {variant: scope})
    const isProductASet = product?.type?.set || product?.hitType === 'set'
    const showDiscount = discountPrice !== null && discountPrice < basePrice
    const basePriceStyle = showDiscount ? styles.strikethroughPrice : styles.price
    return (
        <Skeleton isLoaded={basePrice} display={'flex'}>
            {isProductASet && (
                <Text {...styles.startingAt} data-testid="product-set-price">
                    {intl.formatMessage({
                        id: 'product_view.label.starting_at_price',
                        defaultMessage: 'Starting at'
                    })}
                </Text>
            )}
            {showDiscount && (
                <Text {...styles.price} data-testid="discount-price">
                    {intl.formatNumber(discountPrice, {
                        style: 'currency',
                        currency: currency || activeCurrency
                    })}
                </Text>
            )}
            <Text {...basePriceStyle} data-testid="base-price">
                {intl.formatNumber(basePrice, {
                    style: 'currency',
                    currency: currency || activeCurrency
                })}
            </Text>
        </Skeleton>
    )
}

DisplayPrice.propTypes = {
    product: PropTypes.object,
    scope: PropTypes.string,
    quantity: PropTypes.number
}

export default DisplayPrice
