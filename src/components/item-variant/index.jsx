/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {createContext, useContext} from 'react'
import PropTypes from 'prop-types'

/**
 * This component and associated context/hook provide a convenient wrapper
 * around a group of components used for rendering product variant details.
 */

const ItemVariantContext = createContext()

export const useItemVariant = () => {
    return useContext(ItemVariantContext)
}

/**
 * The Provider component for rendering product item and variant detail.
 */
const ItemVariantProvider = ({variant, children}) => {
    return <ItemVariantContext.Provider value={variant}>{children}</ItemVariantContext.Provider>
}

ItemVariantProvider.propTypes = {
    variant: PropTypes.object,
    children: PropTypes.any
}

export default ItemVariantProvider
