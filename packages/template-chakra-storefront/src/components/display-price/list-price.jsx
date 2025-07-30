/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {Text, VisuallyHidden} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import msg from './messages'
/**
 * Component that displays list price of a product with a11y
 * @param currency - currency
 * @param price - price of the product
 * @param as - an HTML tag or component to be rendered as
 * @param isRange - show price as range or not
 * @param labelForA11y - label to be used for a11y
 * @param extraProps - extra props to be passed into Text Component
 * @returns {JSX.Element}
 */
const ListPrice = ({labelForA11y, price, isRange = false, as = 's', currency, ...extraProps}) => {
    const intl = useIntl()
    const {formatMessage, formatNumber} = intl
    const listPriceText = formatNumber(price, {
        style: 'currency',
        currency
    })

    const messages = useMemo(
        () => ({
            ariaLabels: {
                listPrice: intl.formatMessage(msg.ariaLabelListPrice, {
                    listPrice: listPriceText || ''
                }),
                listPriceWithRange: intl.formatMessage(msg.ariaLabelListPriceWithRange, {
                    listPrice: listPriceText || ''
                })
            }
        }),
        [intl, listPriceText]
    )

    return (
        <>
            {isRange ? (
                <Text
                    as={as}
                    {...extraProps}
                    aria-label={messages.ariaLabels.listPriceWithRange}
                    color="gray.600"
                >
                    {listPriceText}
                </Text>
            ) : (
                <Text
                    as={as}
                    {...extraProps}
                    aria-label={messages.ariaLabels.listPrice}
                    color="gray.600"
                >
                    {listPriceText}
                </Text>
            )}
            {/*For screen reader, we want to make sure the product name is announced before the price to avoid confusion*/}
            <VisuallyHidden aria-live="polite" aria-atomic={true}>
                {labelForA11y}
                {messages.ariaLabels.listPrice}
            </VisuallyHidden>
        </>
    )
}

ListPrice.propTypes = {
    price: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    labelForA11y: PropTypes.string,
    as: PropTypes.string,
    isRange: PropTypes.bool,
    extraProps: PropTypes.object
}

export default ListPrice
