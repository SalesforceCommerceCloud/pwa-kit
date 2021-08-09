/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Button, Stack, Text} from '@chakra-ui/react'
import {PlusIcon} from '../../components/icons'

const PageActionPlaceHolder = ({heading, text, icon, buttonText, buttonProps, onButtonClick}) => {
    return (
        <Stack
            spacing={2}
            py={12}
            px={4}
            alignItems="center"
            borderRadius="base"
            background="gray.50"
        >
            <Box>{icon}</Box>
            <Stack spacing={6} alignItems="center">
                <Box>
                    <Text align="center" fontSize="lg" fontWeight="bold">
                        {heading}
                    </Text>
                    <Text align="center" fontSize="md" color="gray.700">
                        {text}
                    </Text>
                </Box>
                <Button onClick={onButtonClick} leftIcon={<PlusIcon />} {...buttonProps}>
                    {buttonText}
                </Button>
            </Stack>
        </Stack>
    )
}

PageActionPlaceHolder.propTypes = {
    heading: PropTypes.string,
    text: PropTypes.string,
    buttonText: PropTypes.string,
    icon: PropTypes.any,
    buttonProps: PropTypes.object,
    onButtonClick: PropTypes.func
}

export default PageActionPlaceHolder
