/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, useRadio, useRadioGroup} from '@chakra-ui/react'
import {CheckIcon} from '../icons'

const RadioCardGroupContext = React.createContext()

export const RadioCard = (props) => {
    const getRadioProps = React.useContext(RadioCardGroupContext)
    const {getInputProps, getCheckboxProps} = useRadio(getRadioProps(props))

    const input = getInputProps()
    const checkbox = getCheckboxProps()
    return (
        <Box as="label">
            <input {...input} />
            <Box
                {...checkbox}
                aria-hidden={false}
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
                {input.checked && (
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

                {props.children}
            </Box>
        </Box>
    )
}

export const RadioCardGroup = (props) => {
    const {getRootProps, getRadioProps} = useRadioGroup(props)
    const group = getRootProps()

    return (
        <RadioCardGroupContext.Provider value={getRadioProps}>
            <Box {...group}>{props.children}</Box>
        </RadioCardGroupContext.Provider>
    )
}

RadioCard.propTypes = {children: PropTypes.any}
RadioCardGroup.propTypes = {children: PropTypes.any}
