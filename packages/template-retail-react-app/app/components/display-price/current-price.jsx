/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Text, VisuallyHidden} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import msg from '@salesforce/retail-react-app/app/components/display-price/messages'

/**
 * Component that displays current price of a product with a11y
 * @param price - price of the product
 * @param as - an HTML tag or component to be rendered as
 * @param isRange - show price as range or not
 * @param currency - currency to show the price in
 * @param labelForA11y - label to be used for a11y
 * @param extraProps - extra props to be passed into Text Component
 * @returns {JSX.Element}
 */
const CurrentPrice = ({labelForA11y, price, as, isRange = false, currency, ...extraProps}) => {
    const intl = useIntl()
    const currentPriceText = intl.formatNumber(price, {
        style: 'currency',
        currency
    })
    return (
        <>
            {isRange ? (
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
                    {...extraProps}
                    aria-label={intl.formatMessage(msg.ariaLabelCurrentPrice, {
                        currentPrice: currentPriceText
                    })}
                >
                    {currentPriceText}
                </Text>
            )}
            {/*For screen reader, we want to make sure the product name is announced before the price to avoid confusion*/}
            <VisuallyHidden aria-live="polite" aria-atomic={true}>
                {labelForA11y}
                {isRange
                    ? intl.formatMessage(msg.ariaLabelCurrentPriceWithRange, {
                          currentPrice: currentPriceText
                      })
                    : intl.formatMessage(msg.ariaLabelCurrentPrice, {
                          currentPrice: currentPriceText
                      })}
            </VisuallyHidden>
        </>
    )
}
CurrentPrice.propTypes = {
    price: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    labelForA11y: PropTypes.string,
    as: PropTypes.string,
    isRange: PropTypes.bool,
    extraProps: PropTypes.object
}

export default CurrentPrice
