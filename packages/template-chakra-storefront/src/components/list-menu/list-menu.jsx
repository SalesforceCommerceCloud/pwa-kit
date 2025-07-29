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

import {Box, Center, Flex, Spinner, Stack, useSlotRecipe} from '@chakra-ui/react'

// Project Components
import {ListMenuPopover} from './list-menu-popover'
import Link from '../link'

// Others
import {categoryUrlBuilder} from '../../utils/url'

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
    const recipe = useSlotRecipe({key: 'listMenu'})
    const styles = recipe()
    const [ariaBusy, setAriaBusy] = useState(true)
    const intl = useIntl()

    const items = root?.[itemsKey]

    const messages = {
        navLabel: intl.formatMessage({
            id: 'list_menu.nav.assistive_msg',
            defaultMessage: 'Main navigation'
        })
    }

    useEffect(() => {
        setAriaBusy(false)
    }, [])

    return (
        <nav
            id="list-menu"
            aria-label={messages.navLabel}
            aria-live="polite"
            aria-busy={ariaBusy}
            aria-atomic="true"
        >
            <Flex css={styles.container}>
                {items ? (
                    <Stack direction={'row'} gap={0} css={styles.stackContainer}>
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
                                            css={styles.listMenuTriggerLink}
                                            {...{name: name + ' __'}}
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
