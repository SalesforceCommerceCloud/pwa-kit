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
    basePrice,
    discountPrice,
    isProductASet = false,
    currency,
    discountPriceProps,
    basePriceProps
}) => {
    console.log('basePriceProps', basePriceProps)
    const intl = useIntl()
    const {currency: activeCurrency} = useCurrency()
    return (
        <Skeleton isLoaded={basePrice} display={'flex'}>
            <Text fontWeight="bold" fontSize="md" aria-label="price">
                {isProductASet &&
                    `${intl.formatMessage({
                        id: 'product_view.label.starting_at_price',
                        defaultMessage: 'Starting at'
                    })} `}
            </Text>
            {discountPrice > 0 && (
                <Text as="b" {...discountPriceProps}>
                    {intl.formatNumber(discountPrice, {
                        style: 'currency',
                        currency: currency || activeCurrency
                    })}
                </Text>
            )}
            <Text
                as={discountPrice ? 's' : 'b'}
                ml={discountPrice ? 2 : 0}
                fontWeight={discountPrice ? 500 : 'bold'}
            >
                {intl.formatNumber(basePrice, {
                    style: 'currency',
                    currency: currency || activeCurrency
                })}
            </Text>
        </Skeleton>
    )
}

DisplayPrice.propTypes = {
    basePrice: PropTypes.number,
    discountPrice: PropTypes.number,
    currency: PropTypes.string,
    isProductASet: PropTypes.bool,
    discountPriceProps: PropTypes.object,
    basePriceProps: PropTypes.object
}

export default DisplayPrice
