/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Children, useCallback, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {
    Flex,
    Box,
    HStack,
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage} from 'react-intl'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

const DIRECTIONS = {
    FORWARD: 1,
    BACKWARD: -1
}

/**
 * SwatchGroup allows you to create a list of swatches
 * Each Swatch is a link with will direct to a href passed to them
 */
const SwatchGroup = (props) => {
    const {ariaLabel, displayName, children, label = '', value, handleChange = noop} = props

    const styles = useStyleConfig('SwatchGroup')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const wrapperRef = useRef(null)

    // Handle keyboard navigation.
    const onKeyDown = useCallback(
        (e) => {
            const {key} = e
            const move = (direction = DIRECTIONS.FORWARD) => {
                let index = selectedIndex + direction // forward = +1 backwards = -1
                index = (selectedIndex + direction) % children.length // keep number in bounds of array with modulus
                index = index < 0 ? children.length - Math.abs(index) : Math.abs(index) // We we are dealing with a negative we have to invert the index

                // Get a reference to the newly selected swatch as we are going to focus it later.
                const swatchEl = wrapperRef?.current?.children[index]

                // Set the new index that is always in the arrays range.
                setSelectedIndex(index)

                // Behave like a radio button a focus the new swatch.
                swatchEl?.focus()
            }

            switch (key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault()
                    move(DIRECTIONS.BACKWARD)
                    break
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault()
                    move(DIRECTIONS.FORWARD)
                    break
                default:
                    break
            }
        },
        [selectedIndex]
    )

    // Initialize the component state on mount, this includes the selected index value.
    useEffect(() => {
        if (!value) {
            return
        }
        const childrenArray = Children.toArray(children)
        const index = childrenArray.findIndex(({props}) => props?.value === value)

        setSelectedIndex(index)
    }, [])

    // Whenever the selected index changes ensure that we call the change handler.
    useEffect(() => {
        const childrenArray = Children.toArray(children)
        const newValue = childrenArray[selectedIndex].props.value

        handleChange(newValue)
    }, [selectedIndex])

    return (
        <Box onKeyDown={onKeyDown}>
            <Flex {...styles.swatchGroup} role="radiogroup" aria-label={ariaLabel || label}>
                {label && (
                    <HStack {...styles.swatchLabel}>
                        <Box fontWeight="semibold">
                            <FormattedMessage
                                id="swatch_group.selected.label"
                                defaultMessage="{label}:"
                                values={{label}}
                            />
                        </Box>
                        <Box>{displayName}</Box>
                    </HStack>
                )}
                <Flex ref={wrapperRef} {...styles.swatchesWrapper}>
                    {Children.toArray(children).map((child, index) => {
                        const selected = child.props.value === value
                        return React.cloneElement(child, {
                            handleSelect: handleChange,
                            selected,
                            isFocusable: value ? selected : index === 0
                        })
                    })}
                </Flex>
            </Flex>
        </Box>
    )
}

SwatchGroup.displayName = 'SwatchGroup'

SwatchGroup.propTypes = {
    /**
     * The aria label to be used on the group. If none is provided we will
     * use the label prop.
     */
    ariaLabel: PropTypes.string,
    /**
     * The attribute name of the swatch group. E.g color, size
     */
    label: PropTypes.string,
    /**
     * The display value of the selected option
     */
    displayName: PropTypes.string,
    /**
     * The Swatch options to choose between
     */
    children: PropTypes.node,
    /**
     * This function is called whenever the selected swatch changes.
     */
    handleChange: PropTypes.func,
    /**
     * The currentvalue for the option.
     */
    value: PropTypes.string
}

export default SwatchGroup
