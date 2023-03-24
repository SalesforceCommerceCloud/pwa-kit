/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import PropTypes from 'prop-types'

/**
 * This PropType represents a `component` object from the ShopperExperience API.
 */
export const componentType = PropTypes.shape({
    data: PropTypes.object,
    id: PropTypes.string,
    typeId: PropTypes.string
})

/**
 * This PropType represents a `region` object from the ShopperExperience API.
 */
export const regionType = PropTypes.shape({
    id: PropTypes.string,
    components: PropTypes.arrayOf(componentType)
})

/**
 * This PropType represents a `page` object from the ShopperExperience API.
 */
export const pageType = PropTypes.shape({
    data: PropTypes.object,
    description: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    regions: PropTypes.arrayOf(regionType),
    typeId: PropTypes.string
})
