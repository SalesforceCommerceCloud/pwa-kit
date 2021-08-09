/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Text} from '@chakra-ui/react'

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
