/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {forwardRef} from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'

// Components
import {
    Box,
    PopoverTrigger,

    // Hooks
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Link from '@salesforce/retail-react-app/app/components/link'

// Others
import {categoryUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import {ChevronDownIcon} from '@salesforce/retail-react-app/app/components/icons'

const ChevronIconTrigger = forwardRef(function ChevronIconTrigger(props, ref) {
    return (
        <Box {...props} ref={ref}>
            <ChevronDownIcon />
        </Box>
    )
})

const ListMenuTrigger = ({item, name, isOpen, onOpen, onClose}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu

    const keyMap = {
        Escape: () => onClose(),
        Enter: () => onOpen()
    }

    return (
        <Box {...baseStyle.listMenuTriggerContainer}>
            <Link
                as={RouteLink}
                to={categoryUrlBuilder(item)}
                onMouseOver={onOpen}
                {...baseStyle.listMenuTriggerLink}
                {...{name: name + ' __'}}
                {...(isOpen ? baseStyle.listMenuTriggerLinkActive : {})}
            >
                {name}
            </Link>

            <PopoverTrigger>
                <Link
                    as={RouteLink}
                    to={'#'}
                    onMouseOver={onOpen}
                    onKeyDown={(e) => {
                        keyMap[e.key]?.(e)
                    }}
                    {...baseStyle.listMenuTriggerLinkIcon}
                >
                    <ChevronIconTrigger {...baseStyle.selectedButtonIcon} />
                </Link>
            </PopoverTrigger>
        </Box>
    )
}

ListMenuTrigger.propTypes = {
    item: PropTypes.object,
    name: PropTypes.string,
    isOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func
}

export {ListMenuTrigger}
