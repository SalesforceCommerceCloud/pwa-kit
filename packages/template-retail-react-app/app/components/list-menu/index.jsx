/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Components
import {
    Box,
    Flex,
    Stack,
    Center,
    Spinner,

    // Hooks
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'
import ListMenuPopover from '@salesforce/retail-react-app/app/components/list-menu/popover'

const MAXIMUM_NUMBER_COLUMNS = 5

/**
 * This is the navigation component used for desktop devices. Holds the site navigation,
 * providing users with a way to access all product categories and other important pages.
 * The submenus are open when the user moves the mouse over the trigger and for A11y when
 * users use the keyboard Tab key to focus over the chevron icon and press Enter.
 *
 * @param maxColumns The maximum number of columns that we want to use per row inside the ListMenu.
 * @param root
 */
const ListMenu = ({items, maxColumns = MAXIMUM_NUMBER_COLUMNS, onMenuOpen, onMenuClose, itemComponent}) => {
    const itemsKey = 'categories'
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu
    const [ariaBusy, setAriaBusy] = useState(true)
    const intl = useIntl()

    useEffect(() => {
        setAriaBusy(false)
    }, [])

    const ItemComponent = itemComponent || ListMenuPopover
    
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
                {items ? (
                    <Stack direction={'row'} spacing={0} {...baseStyle.stackContainer}>
                        {items?.map?.((item) => {
                            const {id, name} = item
                            return (
                                <Box key={id}>
                                    <ItemComponent
                                        key={id}
                                        maxColumns={maxColumns}
                                        item={item}
                                        name={name}
                                        items={item?.[itemsKey]}
                                        itemsKey={itemsKey}
                                        onOpen={onMenuOpen}
                                        onClose={onMenuClose}
                                        defaultItemComponent={ListMenuPopover}
                                    />
                                </Box>
                            )
                        })}
                    </Stack>
                ) : (
                    <Center p="2">
                        <Spinner size="lg" />
                    </Center>
                )}
            </Flex>
        </nav>
    )
}

ListMenu.displayName = 'ListMenu'

ListMenu.propTypes = {
    items: PropTypes.array,
    /**
     * The maximum number of columns that we want to use per row in the menu.
     */
    maxColumns: PropTypes.number,
    /**
     * Is called when a sub-menu is opened.
     */
    onMenuOpen: PropTypes.func,
    /**
     * Is called when a sub-menu is closed.
     */
    onMenuClose: PropTypes.func,
    /**
     * Customize the component used to render the list menu item
     */
    itemComponent: PropTypes.func
}

export default ListMenu
