/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, createContext} from 'react'
import PropTypes from 'prop-types'

const onClient = typeof window !== 'undefined'

const readValue = (key) => {
    if (onClient) {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : []
        } catch {
            return []
        }
    }
    return []
}

const writeValue = (key, value) => {
    if (onClient) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // Silently fail if localStorage is not available
        }
    }
}

export const ComparisonContext = createContext(null)

export const ComparisonProvider = ({children}) => {
    const [comparedProducts, setComparedProducts] = useState(() => readValue('comparedProducts'))
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    // Persist compared products to localStorage whenever it changes
    useEffect(() => {
        writeValue('comparedProducts', comparedProducts)
    }, [comparedProducts])

    const addToComparison = (product) => {
        if (comparedProducts.length >= 4) {
            throw new Error('Maximum 4 products can be compared at once')
        }
        
        if (!comparedProducts.find(p => p.productId === product.productId)) {
            setComparedProducts(prev => [...prev, product])
        }
    }

    const removeFromComparison = (productId) => {
        setComparedProducts(prev => prev.filter(p => p.productId !== productId))
    }

    const clearComparison = () => {
        setComparedProducts([])
    }

    const isInComparison = (productId) => {
        return comparedProducts.some(p => p.productId === productId)
    }

    const toggleDrawer = () => {
        setIsDrawerOpen(prev => !prev)
    }

    const closeDrawer = () => {
        setIsDrawerOpen(false)
    }

    const openDrawer = () => {
        setIsDrawerOpen(true)
    }

    const value = {
        comparedProducts,
        isDrawerOpen,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        toggleDrawer,
        closeDrawer,
        openDrawer,
        canCompare: comparedProducts.length < 4,
        hasProducts: comparedProducts.length > 0,
        count: comparedProducts.length
    }

    return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>
}

ComparisonProvider.propTypes = {
    children: PropTypes.node
}
