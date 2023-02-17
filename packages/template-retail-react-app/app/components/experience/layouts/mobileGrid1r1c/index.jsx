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

export const MobileGrid1r1c = ({regions}) => {
    return (
        <SimpleGrid className="mobile-1r-1c" style={{border: '1px solid black'}} columns={1}>
            <Region region={regions?.[0]} />
        </SimpleGrid>
    )
}

MobileGrid1r1c.displayName = 'MobileGrid1r1c'

MobileGrid1r1c.propTypes = {
    // Internally Provided
    regions: PropTypes.array.isRequired
}

export default MobileGrid1r1c
