/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage, FormattedNumber} from 'react-intl'

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
    const PRICE_DATA_CUSTOM_TAGS = {
        // we re-defined here since they are specific for this component
        s: (chunks) => (
            <Text as="s" color="gray.600">
                {chunks}
            </Text>
        ),
        price: (chunks) => <FormattedNumber style="currency" currency={currency} value={chunks} />
    }
    return (
        <Box>
            <FormattedMessage
                id="product_tile.price_display"
                defaultMessage="
                   {isMaster, select,
                        true
                            {
                                {
                                    isRange, select,
                                        true {
                                            {
                                                isOnSale, select,
                                                    true {<b>From</b>}
                                                    fales {
                                                        {
                                                            hasRepresentedProduct, select,
                                                                true {<b>From</b>}
                                                                false {<span>From</span>}
                                                                other {}
                                                        }
                                                    }
                                                    other {<span>From</span>}
                                            }
                                        }
                                        false {}
                                        other {}
                                }
                            }
                        false {}
                        other {}
                      }
                   {isASet, select,
                        true {From <span>{salePrice}</span>}
                        false
                            {
                                {
                                    isOnSale, select,
                                         true {
                                            <b><price>{salePrice}</price></b> <s><price>{listPrice}</price></s>
                                         }
                                         false {
                                            {
                                                hasRepresentedProduct, select,
                                                    true  {<span><price>{salePrice}</price></span>}
                                                    false {<b><price>{salePrice}</price></b>}
                                                    other {<b><price>{salePrice}</price></b>}
                                            }
                                         }
                                         other {<b><price>{salePrice}</price></b>}
                                }

                            }
                        other {}
                   }
                "
                values={{
                    ...priceData,
                    ...PRICE_DATA_CUSTOM_TAGS
                }}
            />
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
