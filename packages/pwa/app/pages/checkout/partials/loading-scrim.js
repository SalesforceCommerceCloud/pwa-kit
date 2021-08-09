import {Box} from '@chakra-ui/layout'
import {Spinner} from '@chakra-ui/spinner'
import React from 'react'

const LoadingScrim = () => {
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

export default LoadingScrim
