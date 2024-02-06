/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {forwardRef, useEffect, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Link as RouteLink} from 'react-router-dom'

// Components
import {
    Box,
    Flex,
    Popover,
    PopoverContent,
    PopoverBody,
    PopoverTrigger,
    Stack,

    // Hooks
    useDisclosure,
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Link from '@salesforce/retail-react-app/app/components/link'
import {ListMenuItem} from '@salesforce/retail-react-app/app/components/list-menu/list-menu-item'

// Others
import {categoryUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import {ChevronDownIcon} from '@salesforce/retail-react-app/app/components/icons'

const MAXIMUM_NUMBER_COLUMNS = 5

const ChevronIconTrigger = forwardRef(function ChevronIconTrigger(props, ref) {
    return (
        <Box {...props} ref={ref}>
            <ChevronDownIcon />
        </Box>
    )
})

/**
 * This is the navigation component used for desktop devices. Holds the site navigation,
 * providing users with a way to access all product categories and other important pages.
 * The submenus are open when the user moves the mouse over the trigger and for A11y when
 * users use the keyboard Tab key to focus over the chevron icon and press Enter.
 *
 * @param maxColumns The maximum number of columns that we want to use per row inside the ListMenu.
 * @param root
 */
const ListMenu = ({root, itemComponent, itemsKey, maxColumns = MAXIMUM_NUMBER_COLUMNS}) => {
    const theme = useTheme()
    const [ariaBusy, setAriaBusy] = useState(true)
    const intl = useIntl()
    const initialFocusRef = useRef()

    const ItemComponent = itemComponent || ListMenuItem
    const items = root?.[itemsKey]
    const hasItems = !!items
    const {baseStyle} = theme.components.ListMenu

    useEffect(() => {
        setAriaBusy(false)
    }, [])

    return (
        <nav
            id="list-menu"
            aria-label={intl.formatMessage({
                id: 'list_menu.nav.assistive_msg',
                defaultMessage: 'Main navigation'
            })}
            aria-live="polite"
            aria-busy={ariaBusy}
            aria-atomic="true"
        >
            <Flex {...baseStyle.container}>
                {items && (
                    <Stack direction={'row'} spacing={0} {...baseStyle.stackContainer}>
                        {items?.map?.((item) => {
                            const {id, name} = item
                            // TODO: Figure out how to use a single disclousure for multiple popovers,
                            // might have to make my own.
                            const {isOpen, onClose, onOpen} = useDisclosure()
                            const keyMap = {
                                Escape: () => onClose(),
                                Enter: () => onOpen()
                            }

                            return (
                                <Box key={id} onMouseLeave={onClose}>
                                    <Popover
                                        isLazy
                                        placement={'bottom-start'}
                                        initialFocusRef={initialFocusRef}
                                        onOpen={onOpen}
                                        onClose={onClose}
                                        isOpen={isOpen}
                                        variant="fullWidth"
                                    >
                                        <Box {...baseStyle.listMenuTriggerContainer}>
                                            <Link
                                                as={RouteLink}
                                                to={item && categoryUrlBuilder(item)}
                                                onMouseOver={onOpen}
                                                {...baseStyle.listMenuTriggerLink}
                                                {...(hasItems
                                                    ? {name: name + ' __'}
                                                    : {name: name})}
                                                {...(isOpen
                                                    ? baseStyle.listMenuTriggerLinkActive
                                                    : {})}
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
                                                    <ChevronIconTrigger
                                                        {...baseStyle.selectedButtonIcon}
                                                    />
                                                </Link>
                                            </PopoverTrigger>
                                        </Box>

                                        <PopoverContent
                                            data-testid="popover-menu"
                                            {...baseStyle.popoverContent}
                                        >
                                            <PopoverBody>
                                                <ItemComponent
                                                    key={id}
                                                    maxColumns={maxColumns}
                                                    item={item}
                                                    name={name}
                                                    items={item?.[itemsKey]}
                                                    itemsKey={itemsKey}
                                                    defaultItemComponent={ListMenuItem}
                                                    isOpen={isOpen}
                                                />
                                            </PopoverBody>
                                        </PopoverContent>
                                    </Popover>
                                </Box>
                            )
                        })}
                    </Stack>
                )}
            </Flex>
        </nav>
    )
}

ListMenu.displayName = 'ListMenu'

ListMenu.propTypes = {
    root: PropTypes.object,
    /**
     * The maximum number of columns that we want to use per row in the menu.
     */
    maxColumns: PropTypes.number,
    /**
     * .
     */
    itemsKey: PropTypes.string,
    /**
     * Customize the component used to render the list menu item
     */
    itemComponent: PropTypes.func
}

export {ListMenu}
