/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

const AddressDisplay = ({address}) => {
    return (
        <Box>
            <Text>
                {address.firstName} {address.lastName}
            </Text>
            <Text>{address.address1}</Text>
            <Text>
                {address.city}, {address.stateCode} {address.postalCode}
            </Text>
            <Text>{address.countryCode}</Text>
        </Box>
    )
}

AddressDisplay.propTypes = {
    address: PropTypes.object
}

export default AddressDisplay
