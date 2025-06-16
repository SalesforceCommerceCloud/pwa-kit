/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {RadioCard as ChakraRadioCard, Box} from '@chakra-ui/react'
import {CheckIcon} from '../../components/icons'

// RadioCardGroup is now just a wrapper around ChakraRadioCard.Root
export const RadioCardGroup = ({children, ...props}) => {
    return <ChakraRadioCard.Root {...props}>{children}</ChakraRadioCard.Root>
}

// RadioCard is now a wrapper around ChakraRadioCard.Item with custom styling
export const RadioCard = ({children, ...props}) => {
    return (
        <ChakraRadioCard.Item {...props}>
            <ChakraRadioCard.ItemHiddenInput />
            <ChakraRadioCard.ItemControl>
                <Box
                    position="relative"
                    cursor="pointer"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="base"
                    height="full"
                    _checked={{
                        borderColor: 'blue.600'
                    }}
                    _focus={{
                        boxShadow: 'outline'
                    }}
                    px={4}
                    py={4}
                >
                    {props.value && (
                        <Box
                            position="absolute"
                            top={0}
                            right={0}
                            w={0}
                            h={0}
                            borderStyle="solid"
                            borderWidth="0 38px 38px 0"
                            borderColor="transparent"
                            borderRightColor="blue.600"
                        >
                            <CheckIcon color="white" position="absolute" right="-40px" top="1px" />
                        </Box>
                    )}
                    <ChakraRadioCard.ItemText>{children}</ChakraRadioCard.ItemText>
                </Box>
            </ChakraRadioCard.ItemControl>
        </ChakraRadioCard.Item>
    )
}

RadioCard.propTypes = {
    children: PropTypes.any,
    value: PropTypes.string
}

RadioCardGroup.propTypes = {
    children: PropTypes.any,
    defaultValue: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func
}
