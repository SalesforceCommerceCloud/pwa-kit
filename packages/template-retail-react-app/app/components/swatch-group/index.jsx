/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
    Flex,
    Box,
    HStack,
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage} from 'react-intl'

/**
 * SwatchGroup allows you to create a list of swatches
 * Each Swatch is a link with will direct to a href passed to them
 */
const SwatchGroup = (props) => {
    const {displayName, children, value: selectedValue, label = '', variant = 'square'} = props
    const styles = useStyleConfig('SwatchGroup')
    return (
        <Flex {...styles.swatchGroup} role="radiogroup" aria-label={label}>
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
            <Flex {...styles.swatchesWrapper}>
                {React.Children.map(children, (child) => {
                    return React.cloneElement(child, {
                        selected: child.props.value === selectedValue,
                        variant
                    })
                })}
            </Flex>
        </Flex>
    )
}

SwatchGroup.displayName = 'SwatchGroup'

SwatchGroup.propTypes = {
    /**
     * The attribute name of the swatch group. E.g color, size
     */
    label: PropTypes.string,
    /**
     * The selected Swatch value.
     */
    value: PropTypes.string,
    /**
     * The display value of the selected option
     */
    displayName: PropTypes.string,
    /**
     * The Swatch options to choose between
     */
    children: PropTypes.array,
    /**
     * The shape of the swatches
     */
    variant: PropTypes.oneOf(['square', 'circle'])
}

export default SwatchGroup
