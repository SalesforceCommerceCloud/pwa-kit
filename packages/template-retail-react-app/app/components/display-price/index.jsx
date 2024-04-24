/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Skeleton, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'

const DisplayPrice = ({
    strikethroughPrice,
    currentPrice,
    isProductASet = false,
    currency,
    currentPriceProps,
    strikethroughPriceProps,
    skeletonProps
}) => {
    const intl = useIntl()
    const {currency: activeCurrency} = useCurrency()
    const currentPriceText =
        currentPrice &&
        intl.formatNumber(currentPrice, {
            style: 'currency',
            currency: currency || activeCurrency
        })
    const strikethroughPriceText =
        strikethroughPrice &&
        intl.formatNumber(strikethroughPrice, {
            style: 'currency',
            currency: currency || activeCurrency
        })
    const strikethroughPriceAriaLabel =
        strikethroughPrice &&
        intl.formatMessage(
            {
                id: 'product_tile.assistive_msg.original_price',
                defaultMessage: 'strikethrough price {strikethroughPrice}'
            },
            {
                strikethroughPrice: strikethroughPriceText
            }
        )
    const currentPriceAriaLabel =
        currentPrice &&
        intl.formatMessage(
            {
                id: 'product_tile.assistive_msg.sale_price',
                defaultMessage: 'current price {currentPrice}'
            },
            {
                currentPrice: currentPriceText
            }
        )
    return (
        <Skeleton isLoaded={currentPrice || strikethroughPrice} display={'flex'} {...skeletonProps}>
            {isProductASet && (
                <Text fontWeight="bold" fontSize="md" mr={1}>
                    {intl.formatMessage({
                        id: 'product_view.label.starting_at_price',
                        defaultMessage: 'Starting at'
                    })}
                </Text>
            )}
            {/*Allowing display price of 0*/}
            {typeof currentPrice === 'number' && (
                <Text as="b" {...currentPriceProps} aria-label={currentPriceAriaLabel}>
                    {intl.formatNumber(currentPrice, {
                        style: 'currency',
                        currency: currency || activeCurrency
                    })}
                </Text>
            )}
            {/*Allowing display price of 0*/}
            {typeof strikethroughPrice === 'number' && (
                <Text
                    aria-label={strikethroughPriceAriaLabel}
                    as={typeof currentPrice === 'number' ? 's' : 'b'}
                    ml={typeof currentPrice === 'number' ? 2 : 0}
                    fontWeight={typeof currentPrice === 'number' ? 'normal' : 'bold'}
                    {...strikethroughPriceProps}
                >
                    {intl.formatNumber(strikethroughPrice, {
                        style: 'currency',
                        currency: currency || activeCurrency
                    })}
                </Text>
            )}
        </Skeleton>
    )
}

DisplayPrice.propTypes = {
    strikethroughPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currentPrice: PropTypes.number,
    currency: PropTypes.string,
    isProductASet: PropTypes.bool,
    strikethroughPriceProps: PropTypes.object,
    currentPriceProps: PropTypes.object,
    skeletonProps: PropTypes.object
}

export default DisplayPrice
