/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {SimpleGrid} from '@chakra-ui/react'
import {Region} from '../../region'

/**
 * This layout component displays its children in a 3 rows x 1 column grid on mobile and desktop
 * and 1 row x 3 columns on desktop.
 * 
 * NOTE: This component is not intended to be used directly, it's used by the core page designer
 * components.
 * 
 * @param {componentProps} props
 * @param {regionType []} props.regions - The page designer regions for this component.
 * @param {object} props.data - The data for the component.
 * @param {string} props.typeId - A mapping of typeId's to react components representing the type.
 * @returns {React.ReactElement} - Grid component.
 */
export const MobileGrid3r1c = ({regions}) => (
    <SimpleGrid className="mobile-3r-1c" columns={{base: 1, md: 3}} spacingX={15} spacingY={15}>
        {regions.map((region) => (
            <Region key={region.id} region={region} />
        ))}
    </SimpleGrid>
)

MobileGrid3r1c.displayName = 'MobileGrid1r1c'

MobileGrid3r1c.propTypes = {
    // Internally Provided
    regions: PropTypes.array.isRequired
}

export default MobileGrid3r1c
