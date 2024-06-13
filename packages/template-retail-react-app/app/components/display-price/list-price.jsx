/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Text, Box, VisuallyHidden} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import msg from '@salesforce/retail-react-app/app/components/display-price/messages'
/**
 * Component that displays list price of a product with a11y
 * @param currency - currency
 * @param price - price of the product
 * @param as - an HTML tag or component to be rendered as
 * @param isRange - show price as range or not
 * @param name - product name
 * @param extraProps - extra props to be passed into Text Component
 * @returns {JSX.Element}
 */
const ListPrice = ({name, price, isRange = false, as = 's', currency, ...extraProps}) => {
    const intl = useIntl()
    const listPriceText = intl.formatNumber(price, {
        style: 'currency',
        currency
    })

    return (
        <Box>
            {isRange ? (
                <Text
                    as={as}
                    {...extraProps}
                    aria-label={intl.formatMessage(msg.ariaLabelListPriceWithRange, {
                        listPrice: listPriceText || ''
                    })}
                    color="gray.600"
                >
                    {listPriceText}
                </Text>
            ) : (
                <Text
                    as={as}
                    {...extraProps}
                    aria-label={intl.formatMessage(msg.ariaLabelListPrice, {
                        listPrice: listPriceText || ''
                    })}
                    color="gray.600"
                >
                    {listPriceText}
                </Text>
            )}

            <VisuallyHidden aria-live="polite" key={listPriceText}>
                {name}
                {intl.formatMessage(msg.ariaLabelListPrice, {
                    listPrice: listPriceText || ''
                })}
            </VisuallyHidden>
        </Box>
    )
}

ListPrice.propTypes = {
    price: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    name: PropTypes.string,
    as: PropTypes.string,
    isRange: PropTypes.bool,
    extraProps: PropTypes.object
}

export default ListPrice
