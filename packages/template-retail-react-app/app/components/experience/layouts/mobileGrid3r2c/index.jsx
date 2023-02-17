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

export const MobileGrid3r2c = ({regions}) => {
    return (
        <SimpleGrid className="mobile-3r-2c" style={{border: '1px solid black'}} columns={2}>
            {regions.map((region) => (
                <Region key={region.id} region={region} />
            ))}
        </SimpleGrid>
    )
}

MobileGrid3r2c.displayName = 'MobileGrid1r1c'

MobileGrid3r2c.propTypes = {
    // Internally Provided
    regions: PropTypes.array.isRequired
}

export default MobileGrid3r2c
