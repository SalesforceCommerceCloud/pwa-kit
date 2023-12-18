/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
    Button,
    Box,
    Center,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Link as RouteLink} from 'react-router-dom'

/**
 * The Swatch Component displays item inside `SwatchGroup`. For proper keyboard accessibility,
 * ensure that the rendered elements can receive keyboard focus, and are immediate siblings.
 */
const Swatch = ({
    children,
    disabled,
    href,
    label,
    name,
    selected,
    isFocusable,
    variant = 'square'
}) => {
    const styles = useMultiStyleConfig('SwatchGroup', {variant, disabled, selected})
    /** Mimic the behavior of native radio inputs by using arrow keys to select prev/next value. */
    const onKeyDown = (evt) => {
        let sibling
        // This is not a very react-y way implementation... ¯\_(ツ)_/¯
        switch (evt.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                evt.preventDefault()
                sibling =
                    evt.target.previousElementSibling || evt.target.parentElement.lastElementChild
                break
            case 'ArrowDown':
            case 'ArrowRight':
                evt.preventDefault()
                sibling =
                    evt.target.nextElementSibling || evt.target.parentElement.firstElementChild
                break
            default:
                break
        }
        sibling?.click()
        sibling?.focus()
    }

    return (
        <Button
            {...styles.swatch}
            as={RouteLink}
            to={href}
            aria-label={name}
            aria-checked={selected}
            variant="outline"
            role="radio"
            onKeyDown={onKeyDown}
            // To mimic the behavior of native radio inputs, only one input should be focusable.
            // (The rest are selectable via arrow keys.)
            tabIndex={isFocusable ? 0 : -1}
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
     * The display value for each swatch
     */
    name: PropTypes.string,
    /**
     * The value for the option.
     */
    value: PropTypes.string,
    /**
     * Whether the swatch can receive tab focus
     */
    isFocusable: PropTypes.bool
}

export default Swatch
