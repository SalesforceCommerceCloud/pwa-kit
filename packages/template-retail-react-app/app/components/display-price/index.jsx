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
 * @param quantity - quantity to take into the account for price display
 * @param currentPriceProps - extra props to be passing to CurrentPrice component
 * @param listPriceProps - extra props to be passing to ListPrice component
 * @param isLiveRegion - for a11y, a prop to indicate if this is a dynamical content
 * @param name - product name
 */
const DisplayPrice = ({
    name,
    isLiveRegion = false,
    priceData,
    currency,
    quantity = 1,
    currentPriceProps = {},
    listPriceProps = {}
}) => {
    const {listPrice, currentPrice, isASet, isMaster, isOnSale, isRange} = priceData
    const renderCurrentPrice = (isRange) => (
        <CurrentPrice
            name={name}
            isLiveRegion={isLiveRegion}
            price={currentPrice * quantity}
            as="b"
            currency={currency}
            isRange={isRange}
            {...currentPriceProps}
        />
    )

    const renderListPrice = (isRange) =>
        listPrice && (
            <ListPrice
                name={name}
                currency={currency}
                price={listPrice * quantity}
                isRange={isRange}
                isLiveRegion={isLiveRegion}
                {...listPriceProps}
            />
        )

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
        pricePerUnit: PropTypes.number,
        isASet: PropTypes.bool,
        isMaster: PropTypes.bool,
        isRange: PropTypes.bool,
        maxPrice: PropTypes.number,
        tieredPrice: PropTypes.number
    }),
    currency: PropTypes.string.isRequired,
    isLiveRegion: PropTypes.bool,
    name: PropTypes.string,
    currentPriceProps: PropTypes.object,
    listPriceProps: PropTypes.object,
    quantity: PropTypes.number
}

export default DisplayPrice
