/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Link as RouteLink} from 'react-router-dom'

// Components
import {
    Box,
    Center,
    Flex,
    Spinner,
    Stack,

    // Hooks
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import {ListMenuPopover} from '@salesforce/retail-react-app/app/components/list-menu/list-menu-popover'
import Link from '@salesforce/retail-react-app/app/components/link'

// Others
import {categoryUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'

// Constants
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
const ListMenu = ({
    root,
    contentComponent,
    itemsKey,
    itemsCountKey,
    maxColumns = MAXIMUM_NUMBER_COLUMNS
}) => {
    const theme = useTheme()
    const [ariaBusy, setAriaBusy] = useState(true)
    const [activeLink, setActiveLink] = useState()
    const intl = useIntl()

    const {baseStyle} = theme.components.ListMenu
    const items = root?.[itemsKey]

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
                {items ? (
                    <Stack direction={'row'} spacing={0} {...baseStyle.stackContainer}>
                        {items?.map?.((item) => {
                            const {id, name} = item
                            const itemsCount = item[itemsCountKey] || item[itemsKey]?.length || 0

                            return (
                                <Box key={id}>
                                    {itemsCount > 0 ? (
                                        <ListMenuPopover
                                            key={id}
                                            maxColumns={maxColumns}
                                            item={item}
                                            name={name}
                                            items={item?.[itemsKey]}
                                            itemsKey={itemsKey}
                                            contentComponent={contentComponent}
                                        />
                                    ) : (
                                        <Link
                                            as={RouteLink}
                                            to={categoryUrlBuilder(item)}
                                            onMouseOver={setActiveLink.bind(this, id)}
                                            onMouseOut={setActiveLink.bind(this)}
                                            {...baseStyle.listMenuTriggerLink}
                                            {...{name: name + ' __'}}
                                            {...(activeLink === id
                                                ? baseStyle.listMenuTriggerlessLinkActive
                                                : {})}
                                        >
                                            {name}
                                        </Link>
                                    )}
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
    root: PropTypes.object,
    /**
     * The maximum number of columns that we want to use per row in the menu.
     */
    maxColumns: PropTypes.number,
    /**
     * Customize the property representing the items.
     */
    itemsKey: PropTypes.string,
    /**
     * Cusomtize the property representing the items count.
     */
    itemsCountKey: PropTypes.string,
    /**
     * Customize the component used to render the list menu item
     */
    contentComponent: PropTypes.elementType
}

export {ListMenu}
