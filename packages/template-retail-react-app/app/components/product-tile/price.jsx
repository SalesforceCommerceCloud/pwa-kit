/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Text, useMultiStyleConfig} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'

const Price = ({product, ...rest}) => {
    const {price, currency, hitType} = product
    const intl = useIntl()
    const styles = useMultiStyleConfig('ProductTile')
    const {currency: activeCurrency} = useCurrency()

    return (
        <Text {...styles.price} data-testid="product-tile-price" {...rest}>
            {hitType === 'set' &&
                intl.formatMessage({
                    id: 'product_tile.label.starting_at_price',
                    defaultMessage: 'Starting at'
                })}{' '}
            {intl.formatNumber(price, {
                style: 'currency',
                currency: currency || activeCurrency
            })}
        </Text>
    )
}

Price.propTypes = {
    product: PropTypes.shape({
        currency: PropTypes.string,
        price: PropTypes.number,
        hitType: PropTypes.string
    })
}

export default Price
