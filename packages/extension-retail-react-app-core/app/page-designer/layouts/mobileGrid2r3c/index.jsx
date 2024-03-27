/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {SimpleGrid} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Region, regionPropType} from '@salesforce/commerce-sdk-react/components'

/**
 * This layout component displays its children in a 2 row x 3 column grid on mobile
 * and 1 row x 6 column grid on desktop.
 *
 * @param {componentProps} props
 * @param {regionType []} props.regions - The page designer regions for this component.
 * @param {object} props.data - The data for the component.
 * @param {string} props.typeId - A mapping of typeId's to react components representing the type.
 * @returns {React.ReactElement} - Grid component.
 */
export const MobileGrid2r3c = ({regions}) => (
    <SimpleGrid className="mobile-2r-3c" columns={{base: 3, sm: 6}} gridGap={4}>
        {regions.map((region) => (
            <Region key={region.id} region={region} />
        ))}
    </SimpleGrid>
)

MobileGrid2r3c.displayName = 'MobileGrid2r3c'

MobileGrid2r3c.propTypes = {
    // Internally Provided
    regions: PropTypes.arrayOf(regionPropType).isRequired
}

export default MobileGrid2r3c
