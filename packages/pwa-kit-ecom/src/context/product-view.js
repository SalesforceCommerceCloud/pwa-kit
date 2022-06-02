/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

const defaultValues = {
    product: {},
    addVariantToCart: () => {},
    addItemToWishList: () => {}
}

const ProductViewContext = React.createContext(defaultValues)

export const ProductViewProvider = ({children}) => {
    return <ProductViewContext.Provider>{children}</ProductViewContext.Provider>
}

const useProductView = () => {
    const context = React.useContext(ProductViewContext)
    if (context === undefined) {
        throw new Error('useStore must be used within StoreContext')
    }

    return context
}

export default useProductView
