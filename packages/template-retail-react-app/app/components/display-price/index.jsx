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

const DisplayPrice = ({
    strikethroughPrice,
    currentPrice,
    prefixLabel,
    currency,
    currentPriceProps,
    strikethroughPriceProps
}) => {
    const intl = useIntl()
    const currentPriceText = intl.formatNumber(currentPrice, {
        style: 'currency',
        currency: currency
    })
    const strikethroughPriceText =
        strikethroughPrice &&
        intl.formatNumber(strikethroughPrice, {
            style: 'currency',
            currency: currency
        })
    return (
        <Box display={'flex'}>
            {prefixLabel && (
                <Text fontWeight="bold" fontSize="md" mr={1}>
                    {prefixLabel}
                </Text>
            )}
            <Text
                as="b"
                aria-label={intl.formatMessage(
                    {
                        id: 'product_tile.assistive_msg.sale_price',
                        defaultMessage: 'current price {currentPrice}'
                    },
                    {
                        currentPrice: currentPriceText
                    }
                )}
                {...currentPriceProps}
            >
                {currentPriceText}
            </Text>
            {/*Allowing display price of 0*/}
            {typeof strikethroughPrice === 'number' && (
                <Text
                    color="gray.600"
                    aria-label={intl.formatMessage(
                        {
                            id: 'product_tile.assistive_msg.original_price',
                            defaultMessage: 'strikethrough price {strikethroughPrice}'
                        },
                        {
                            strikethroughPrice: strikethroughPriceText
                        }
                    )}
                    as={typeof currentPrice === 'number' ? 's' : 'b'}
                    ml={typeof currentPrice === 'number' ? 2 : 0}
                    fontWeight={typeof currentPrice === 'number' ? 'normal' : 'bold'}
                    {...strikethroughPriceProps}
                >
                    {strikethroughPriceText}
                </Text>
            )}
        </Box>
    )
}

DisplayPrice.propTypes = {
    strikethroughPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currentPrice: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    prefixLabel: PropTypes.string,
    strikethroughPriceProps: PropTypes.object,
    currentPriceProps: PropTypes.object
}

export default DisplayPrice
