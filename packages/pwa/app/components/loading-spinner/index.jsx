/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {Box, Spinner} from '@chakra-ui/react'
import PropTypes from 'prop-types'

const LoadingSpinner = ({wrapperStyles = {}, spinnerStyles = {}}) => {
    return (
        <Box
            zIndex="overlay"
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            background="whiteAlpha.800"
            {...wrapperStyles}
        >
            <Spinner
                data-testid="loading"
                {...spinnerStyles}
                position="absolute"
                top="50%"
                left="50%"
                ml="-1.5em"
                mt="-1.5em"
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.600"
                size="xl"
            />
        </Box>
    )
}

LoadingSpinner.propTypes = {
    wrapperStyles: PropTypes.object,
    spinnerStyles: PropTypes.object
}

export default LoadingSpinner
