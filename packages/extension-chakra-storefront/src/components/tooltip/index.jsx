/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip as ChakraTooltip} from '@chakra-ui/react'

const Tooltip = React.forwardRef(
    (
        {
            children,
            content,
            placement = 'top',
            showArrow = true,
            disabled = false,
            openDelay = 500,
            closeDelay = 500,
            contentProps,
            positioning
        },
        ref
    ) => {
        if (disabled || !content) {
            return children
        }

        const positioningConfig = positioning || {}
        const finalPositioning = {
            placement,
            ...positioningConfig
        }

        return (
            <ChakraTooltip.Root
                openDelay={openDelay}
                closeDelay={closeDelay}
                positioning={finalPositioning}
            >
                <ChakraTooltip.Trigger asChild ref={ref}>
                    {children}
                </ChakraTooltip.Trigger>
                <ChakraTooltip.Positioner>
                    <ChakraTooltip.Content {...contentProps}>
                        {showArrow && (
                            <ChakraTooltip.Arrow>
                                <ChakraTooltip.ArrowTip />
                            </ChakraTooltip.Arrow>
                        )}
                        {content}
                    </ChakraTooltip.Content>
                </ChakraTooltip.Positioner>
            </ChakraTooltip.Root>
        )
    }
)

Tooltip.displayName = 'Tooltip'

Tooltip.propTypes = {
    children: PropTypes.node.isRequired,
    content: PropTypes.node,
    placement: PropTypes.oneOf([
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'left',
        'left-start',
        'left-end',
        'right',
        'right-start',
        'right-end'
    ]),
    showArrow: PropTypes.bool,
    disabled: PropTypes.bool,
    openDelay: PropTypes.number,
    closeDelay: PropTypes.number,
    contentProps: PropTypes.object,
    positioning: PropTypes.object
}

export default Tooltip
