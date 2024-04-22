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
    basePriceProps,
    skeletonProps
}) => {
    const intl = useIntl()
    const {currency: activeCurrency} = useCurrency()
    const discountPriceText = intl.formatNumber(discountPrice, {
        style: 'currency',
        currency: currency || activeCurrency
    })
    const basePriceText = intl.formatNumber(basePrice, {
        style: 'currency',
        currency: currency || activeCurrency
    })

    return (
        <Skeleton isLoaded={basePrice} display={'flex'} {...skeletonProps}>
            {isProductASet && (
                <Text fontWeight="bold" fontSize="md" mr={1}>
                    {intl.formatMessage({
                        id: 'product_view.label.starting_at_price',
                        defaultMessage: 'Starting at'
                    })}
                </Text>
            )}
            {typeof discountPrice === 'number' && (
                <Text as="b" {...discountPriceProps} aria-label={`Sale price ${discountPriceText}`}>
                    {discountPriceText}
                </Text>
            )}
            {basePrice > discountPrice && (
                <Text
                    aria-label={`Original price ${basePriceText}`}
                    as={typeof discountPrice === 'number' ? 's' : 'b'}
                    ml={typeof discountPrice === 'number' ? 2 : 0}
                    fontWeight={discountPrice ? 'normal' : 'bold'}
                    {...basePriceProps}
                >
                    {basePriceText}
                </Text>
            )}
        </Skeleton>
    )
}

DisplayPrice.propTypes = {
    basePrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    discountPrice: PropTypes.number,
    currency: PropTypes.string,
    isProductASet: PropTypes.bool,
    discountPriceProps: PropTypes.object,
    basePriceProps: PropTypes.object,
    skeletonProps: PropTypes.object
}

export default DisplayPrice
