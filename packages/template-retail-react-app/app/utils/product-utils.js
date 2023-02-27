/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Get the human-friendly version of the variation values that users have selected.
 * Useful for displaying these values in the UI.
 *
 * @param {Object} variationAttributes - The products variation attributes.
 * @param {Object} values - The variations selected attribute values.
 * @returns {Object} - A key value map of the display name and display value.
 *
 * @example
 * const displayValues = getDisplayVariationValues(
 *     [ { "id": "color", "name": "Colour", "values": [ { "name": "royal", "orderable": true, "value": "JJ5FUXX" } ] } ],
 *     { "color": "JJ5FUXX" }
 * )
 * // returns { "Colour": "royal" }
 */
export const getDisplayVariationValues = (variationAttributes, values = {}) => {
    const returnVal = Object.entries(values).reduce((acc, [id, value]) => {
        const attribute = variationAttributes.find(({id: attributeId}) => attributeId === id)
        const attributeValue = attribute.values.find(
            ({value: attributeValue}) => attributeValue === value
        )
        return {
            ...acc,
            [attribute.name]: attributeValue.name
        }
    }, {})
    return returnVal
}
