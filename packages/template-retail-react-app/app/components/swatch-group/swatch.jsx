/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Button, Box, Center, useMultiStyleConfig} from '@chakra-ui/react'
import {Link as RouteLink} from 'react-router-dom'

/**
 * The Swatch Component displays item inside `SwatchGroup`
 */
const Swatch = (props) => {
    const {
        disabled,
        selected,
        label,
        children,
        href,
        variant = 'square',
        onChange,
        value,
        name
    } = props
    const styles = useMultiStyleConfig('SwatchGroup', {variant, disabled, selected})
    return (
        <Button
            {...styles.swatch}
            as={RouteLink}
            to={href}
            aria-label={name}
            onClick={(e) => {
                e.preventDefault()
                onChange(value, href)
            }}
            aria-checked={selected}
            variant="outline"
        >
            <Center {...styles.swatchButton}>
                {children}
                {label && <Box>{label}</Box>}
            </Center>
        </Button>
    )
}

Swatch.displayName = 'Swatch'

Swatch.propTypes = {
    /**
     * The children to be rendered within swatch item.
     */
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    /**
     * Indicates whether the option is disabled
     */
    disabled: PropTypes.bool,
    /**
     * Indicates whether the option is selected.
     * This props is provided internally by SwatchGroup
     */
    selected: PropTypes.bool,
    /**
     * The shape of the Swatch
     */
    variant: PropTypes.oneOf(['square', 'circle']),
    /**
     * The label of the option.
     */
    label: PropTypes.string,
    /**
     *  The url of this option
     */
    href: PropTypes.string,
    /**
     * This function is called whenever the user selects an option.
     * It is passed the new value.
     */
    onChange: PropTypes.func,
    /**
     * The value for the option.
     */
    value: PropTypes.string,
    /**
     * The display value for each swatch
     */
    name: PropTypes.string
}

export default Swatch
