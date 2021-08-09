import React from 'react'
import {Box, Spinner} from '@chakra-ui/react'

const LoadingSpinner = () => {
    return (
        <Box
            zIndex="10"
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            background="whiteAlpha.800"
        >
            <Spinner
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

export default LoadingSpinner
