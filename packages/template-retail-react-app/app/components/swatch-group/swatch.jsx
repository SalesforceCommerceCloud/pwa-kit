/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {
    Button,
    Box,
    Center,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Link as RouteLink} from 'react-router-dom'
import {useBreakpointValue} from '@salesforce/retail-react-app/app/components/shared/ui'

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
    value,
    handleChange,
    variant = 'square'
}) => {
    const styles = useMultiStyleConfig('SwatchGroup', {variant, disabled, selected})
    const isDesktop = useBreakpointValue({base: false, lg: true})
    const [changeHandlers, setChangeHandlers] = useState({})

    const onKeyDown = useCallback((evt) => {
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
    }, [])

    const onChange = useCallback(
        (e) => {
            e.preventDefault()
            handleChange(value)
        },
        [handleChange]
    )

    useEffect(() => {
        if (!handleChange) {
            return
        }

        setChangeHandlers({
            [isDesktop ? 'onMouseEnter' : 'onClick']: onChange
        })
    }, [onChange, isDesktop])

    return (
        <Button
            {...styles.swatch}
            as={RouteLink}
            to={href}
            aria-label={name}
            aria-checked={selected}
            onKeyDown={onKeyDown}
            variant="outline"
            role="radio"
            // To mimic the behavior of native radio inputs, only one input should be focusable.
            // (The rest are selectable via arrow keys.)
            tabIndex={isFocusable ? 0 : -1}
            {...changeHandlers}
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
    isFocusable: PropTypes.bool,
    /**
     * This function is called whenever the mouse enters the swatch on desktop or when clicked on mobile.
     * The values is passed as the first argument.
     */
    handleChange: PropTypes.func
}

export default Swatch
