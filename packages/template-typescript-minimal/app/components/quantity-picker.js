/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

QuantityPicker.propTypes = {}

export const useQuantity = () => {
    const [quantity, setQuantity] = React.useState(1)
    const onIncrease = () => {
        setQuantity(quantity + 1)
    }
    const onDecrease = () => {
        if (quantity === 0) {
            return
        }
        setQuantity(quantity - 1)
    }
    return {
        quantity,
        setQuantity,
        onIncrease,
        onDecrease
    }
}

function QuantityPicker(props) {
    const {quantity, onDecrease, onIncrease} = props
    return (
        <div style={{display: 'flex'}}>
            <button onClick={onDecrease}>-</button>
            <input readOnly type="number" value={quantity} />
            <button onClick={onIncrease}>+</button>
        </div>
    )
}

export default QuantityPicker
