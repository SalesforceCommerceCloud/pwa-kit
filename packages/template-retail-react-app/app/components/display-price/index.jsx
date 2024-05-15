/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import CurrentPrice from '@salesforce/retail-react-app/app/components/display-price/current-price'
import ListPrice from '@salesforce/retail-react-app/app/components/display-price/list-price'

/**
 * @param priceData - price info extracted from a product
 * // If a product is a set,
 *      on PLP, Show From X where X is the lowest of its children
 *      on PDP, Show From X where X is the lowest of its children and
 *          the set children will have it own price as From X (cross) Y
 * // if a product is a master
 *      on PLP and PDP, show From X (cross) Y , the X and Y are
 *          current and list price of variant that has the lowest price (including promotionalPrice)
 * // if a standard/bundle
 *      show exact price on PLP and PDP as X (cross) Y
 * @param currency - currency
 */
const DisplayPrice = ({priceData, currency}) => {
    const {listPrice, currentPrice, isASet, isMaster, isOnSale, isRange} = priceData
    const renderCurrentPrice = (isRange) => (
        <CurrentPrice price={currentPrice} as="b" currency={currency} isRange={isRange} />
    )

    const renderListPrice = (isRange) =>
        listPrice && <ListPrice currency={currency} price={listPrice} isRange={isRange} />

    const renderPriceSet = (isRange) => (
        <>
            {renderCurrentPrice(isRange)} {isOnSale && renderListPrice(isRange)}
        </>
    )

    if (isASet) {
        return renderCurrentPrice(true)
    }

    if (isMaster) {
        return renderPriceSet(isRange)
    }

    return <Box>{renderPriceSet(false)}</Box>
}

DisplayPrice.propTypes = {
    priceData: PropTypes.shape({
        currentPrice: PropTypes.number.isRequired,
        isOnSale: PropTypes.bool.isRequired,
        listPrice: PropTypes.number,
        isASet: PropTypes.bool,
        isMaster: PropTypes.bool,
        isRange: PropTypes.bool,
        maxPrice: PropTypes.number,
        tieredPrice: PropTypes.number
    }),
    currency: PropTypes.string.isRequired
}

export default DisplayPrice
