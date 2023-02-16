/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment, useRef, forwardRef, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Link as RouteLink} from 'react-router-dom'
import {useCategories} from '../../hooks/use-categories'

// Project Components
import LinksList from '../links-list'

// Components
import {
    Box,
    Container,
    SimpleGrid,
    Fade,
    Flex,
    Stack,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Center,
    Spinner,

    // Hooks
    useTheme,
    useDisclosure
} from '@chakra-ui/react'
import Link from '../link'
// Others
import {categoryUrlBuilder} from '../../utils/url'
import {ChevronDownIcon} from '../icons'

const MAXIMUM_NUMBER_COLUMNS = 5

const ChevronIconTrigger = forwardRef(function ChevronIconTrigger(props, ref) {
    return (
        <Box {...props} ref={ref}>
            <ChevronDownIcon />
        </Box>
    )
})

const ListMenuTrigger = ({item, name, isOpen, onOpen, onClose, hasItems}) => {
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
                {...(hasItems ? {name: name + ' __'} : {name: name})}
                {...(isOpen ? baseStyle.listMenuTriggerLinkActive : {})}
            >
                {name}
            </Link>

            <Link
                as={RouteLink}
                to={'#'}
                onMouseOver={onOpen}
                onKeyDown={(e) => {
                    keyMap[e.key]?.(e)
                }}
                {...baseStyle.listMenuTriggerLinkIcon}
            >
                <PopoverTrigger>
                    <Fade in={hasItems && item.loaded}>
                        <ChevronIconTrigger {...baseStyle.selectedButtonIcon} />
                    </Fade>
                </PopoverTrigger>
            </Link>
        </Box>
    )
}
ListMenuTrigger.propTypes = {
    item: PropTypes.object,
    name: PropTypes.string,
    isOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    hasItems: PropTypes.bool
}

const ListMenuContent = ({maxColumns, items, itemsKey, onClose, initialFocusRef}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu
    const {locale} = useIntl()

    return (
        <PopoverContent data-testid="popover-menu" {...baseStyle.popoverContent}>
            <PopoverBody>
                <Container as={Stack} {...baseStyle.popoverContainer}>
                    <SimpleGrid
                        spacing={8}
                        justifyContent={'left'}
                        gridTemplateColumns={`repeat(${
                            items.length > maxColumns ? maxColumns : items.length
                        }, minmax(0, 21%))`}
                        marginInlineStart={{lg: '68px', xl: '96px'}}
                    >
                        {items.map((item, index) => {
                            const {id, name} = item
                            const items = item[itemsKey]

                            const heading = {
                                href: categoryUrlBuilder(item, locale),
                                text: name,
                                styles: {
                                    fontSize: 'md',
                                    marginBottom: 2
                                }
                            }

                            const links = items
                                ? items.map((item) => {
                                      const {name} = item
                                      return {
                                          href: categoryUrlBuilder(item, locale),
                                          text: name,
                                          styles: {
                                              fontSize: 'md',
                                              paddingTop: 3,
                                              paddingBottom: 3
                                          }
                                      }
                                  })
                                : []
                            return (
                                <LinksList
                                    key={id}
                                    heading={heading}
                                    links={links}
                                    color={'gray.900'}
                                    onLinkClick={onClose}
                                    {...(index === 0 ? {headingLinkRef: initialFocusRef} : {})}
                                />
                            )
                        })}
                    </SimpleGrid>
                </Container>
            </PopoverBody>
        </PopoverContent>
    )
}
ListMenuContent.propTypes = {
    items: PropTypes.array,
    maxColumns: PropTypes.number,
    onClose: PropTypes.func,
    initialFocusRef: PropTypes.object,
    itemsKey: PropTypes.string
}

const ListMenuPopover = ({items, item, name, itemsKey, maxColumns}) => {
    const initialFocusRef = useRef()
    const {isOpen, onClose, onOpen} = useDisclosure()
    return (
        <Box onMouseLeave={onClose}>
            <Popover
                isLazy
                placement={'bottom-start'}
                initialFocusRef={initialFocusRef}
                onOpen={onOpen}
                onClose={onClose}
                isOpen={isOpen}
                variant="fullWidth"
            >
                <Fragment>
                    <ListMenuTrigger
                        item={item}
                        name={name}
                        isOpen={isOpen}
                        onOpen={onOpen}
                        onClose={onClose}
                        hasItems={!!items}
                    />
                    {items && (
                        <ListMenuContent
                            items={items}
                            itemsKey={itemsKey}
                            initialFocusRef={initialFocusRef}
                            onClose={onClose}
                            maxColumns={maxColumns}
                        />
                    )}
                </Fragment>
            </Popover>
        </Box>
    )
}

ListMenuPopover.propTypes = {
    items: PropTypes.array,
    item: PropTypes.object,
    name: PropTypes.string,
    maxColumns: PropTypes.number,
    itemsKey: PropTypes.string
}

/**
 * This is the navigation component used for desktop devices. Holds the site navigation,
 * providing users with a way to access all product categories and other important pages.
 * The submenus are open when the user moves the mouse over the trigger and for A11y when
 * users use the keyboard Tab key to focus over the chevron icon and press Enter.
 *
 * @param maxColumns The maximum number of columns that we want to use per row inside the ListMenu.
 */
const ListMenu = ({maxColumns = MAXIMUM_NUMBER_COLUMNS}) => {
    const {root, itemsKey} = useCategories()
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu
    const [ariaBusy, setAriaBusy] = useState('true')

    useEffect(() => {
        setAriaBusy('false')
    }, [])

    return (
        <nav
            id="list-menu"
            aria-label="main"
            aria-live="polite"
            aria-busy={ariaBusy}
            aria-atomic="true"
        >
            <Flex {...baseStyle.container}>
                {root?.[itemsKey] ? (
                    <Stack direction={'row'} spacing={0} {...baseStyle.stackContainer}>
                        {root?.[itemsKey]?.map?.((item) => {
                            const {id, name} = item
                            return (
                                <Box key={id}>
                                    <ListMenuPopover
                                        key={id}
                                        maxColumns={maxColumns}
                                        item={item}
                                        name={name}
                                        items={item?.[itemsKey]}
                                        itemsKey={itemsKey}
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
    /**
     * The maximum number of columns that we want to use per row in the menu.
     */
    maxColumns: PropTypes.number
}

export default ListMenu
