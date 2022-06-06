/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useEffect} from 'react'

const useQuantity = (product) => {
    const initialQuantity = product?.quantity || product?.minOrderQuantity || 1

    const [quantity, setQuantity] = useState(initialQuantity || 0)
    const stockLevel = product?.inventory?.stockLevel || 0

    const stepQuantity = product?.stepQuantity || 1
    const minOrderQuantity = stockLevel > 0 ? product?.minOrderQuantity || 1 : 0
    const unfulfillable = stockLevel < quantity

    // If the `initialQuantity` changes, update the state. This typically happens
    // when either the master product changes, or the inventory of the product changes
    // from out-of-stock to in-stock or vice versa.
    useEffect(() => {
        setQuantity(initialQuantity)
    }, [initialQuantity])

    return {
        stockLevel,
        stepQuantity,
        minOrderQuantity,
        quantity,
        setQuantity,
        unfulfillable
    }
}

export default useQuantity
