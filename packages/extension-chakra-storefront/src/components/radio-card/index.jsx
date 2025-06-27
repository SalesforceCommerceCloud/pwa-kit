/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, RadioCard as ChakraRadioCard, useSlotRecipe} from '@chakra-ui/react'
import {CheckIcon} from '../../components/icons'

const RadioCardGroupContext = React.createContext()

export const RadioCard = (props) => {
    const getRadioGroupProps = React.useContext(RadioCardGroupContext)
    const {value, children, isSelected} = getRadioGroupProps(props)
    const recipe = useSlotRecipe({key: 'radioCard'})
    const styles = recipe()

    return (
        <ChakraRadioCard.Item key={value} value={value} css={styles.item}>
            {isSelected && (
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
            <ChakraRadioCard.ItemHiddenInput />
            <ChakraRadioCard.ItemControl>
                {children}
            </ChakraRadioCard.ItemControl>
        </ChakraRadioCard.Item>
    )
}

export const RadioCardGroup = (props) => {
    const {value, onValueChange, ...groupProps} = props
    const recipe = useSlotRecipe({key: 'radioCard'})
    const styles = recipe()

    return (
        <RadioCardGroupContext.Provider value={(itemProps) => ({...itemProps, value: itemProps.value})}>
            <ChakraRadioCard.Root 
                value={value} 
                onValueChange={onValueChange} 
                css={styles.root}
                {...groupProps}
            >
                {props.children}
            </ChakraRadioCard.Root>
        </RadioCardGroupContext.Provider>
    )
}

RadioCard.propTypes = {children: PropTypes.any}
RadioCardGroup.propTypes = {children: PropTypes.any}
