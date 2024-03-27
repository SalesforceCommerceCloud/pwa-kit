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
    return (
        <Skeleton isLoaded={basePrice} display={'flex'} {...skeletonProps}>
            <Text fontWeight="bold" fontSize="md" mr={1}>
                {isProductASet &&
                    `${intl.formatMessage({
                        id: 'product_view.label.starting_at_price',
                        defaultMessage: 'Starting at'
                    })} `}
            </Text>
            {typeof discountPrice === 'number' && (
                <Text as="b" {...discountPriceProps}>
                    {intl.formatNumber(discountPrice, {
                        style: 'currency',
                        currency: currency || activeCurrency
                    })}
                </Text>
            )}
            <Text
                as={typeof discountPrice === 'number' ? 's' : 'b'}
                ml={typeof discountPrice === 'number' ? 2 : 0}
                fontWeight={discountPrice ? 'normal' : 'bold'}
                {...basePriceProps}
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
    basePrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    discountPrice: PropTypes.number,
    currency: PropTypes.string,
    isProductASet: PropTypes.bool,
    discountPriceProps: PropTypes.object,
    basePriceProps: PropTypes.object,
    skeletonProps: PropTypes.object
}

export default DisplayPrice
