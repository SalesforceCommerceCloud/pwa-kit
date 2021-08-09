/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'

// Project Components
import LinksList from '../links-list'

// Components
import {
    Box,
    Container,
    SimpleGrid,
    Flex,
    Link,
    Stack,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Center,
    Spinner,

    // Hooks
    useTheme
} from '@chakra-ui/react'

// Others
import {categoryUrlBuilder} from '../../utils/url'

const ListMenuTrigger = ({item, name, isOpen, onClose}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu

    return (
        <PopoverTrigger>
            <Link
                as={RouteLink}
                name={name}
                to={categoryUrlBuilder(item)}
                onClick={onClose}
                {...baseStyle.listMenuTrigger}
                {...(isOpen ? baseStyle.listMenuTriggerActive : {})}
            >
                {name}
            </Link>
        </PopoverTrigger>
    )
}
ListMenuTrigger.propTypes = {
    item: PropTypes.object,
    name: PropTypes.string,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
}

const ListMenuContent = ({maxColumns, items, itemsKey, onClose}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu

    return (
        <PopoverContent data-testid="popover-menu" {...baseStyle.popoverContent}>
            <PopoverBody {...baseStyle.popoverBody}>
                <Container as={Stack} {...baseStyle.popoverContainer}>
                    <SimpleGrid
                        spacing={8}
                        justifyContent={'left'}
                        gridTemplateColumns={`repeat(${
                            items.length > maxColumns ? maxColumns : items.length
                        }, minmax(0, 21%))`}
                        marginInlineStart={{lg: '68px', xl: '96px'}}
                    >
                        {items.map((item) => {
                            const {id, name} = item
                            const items = item[itemsKey]

                            const heading = {
                                href: categoryUrlBuilder(item),
                                text: name,
                                styles: {
                                    fontSize: 'md',
                                    marginBottom: 5
                                }
                            }

                            const links = items
                                ? items.map((item) => {
                                      const {name} = item
                                      return {
                                          href: categoryUrlBuilder(item),
                                          text: name,
                                          styles: {
                                              fontSize: 'md'
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
    itemsKey: PropTypes.string,
    onClose: PropTypes.func
}

const MAXIMUM_NUMBER_COLUMNS = 5

/**
 * This is the navigation component used for desktop devices. Holds the site navigation,
 * providing users with a way to access all product categories and other important pages.
 * The submenus are open when the user hovers over the ListMenu items.
 *
 * @param root The root category in your commerce cloud back-end.
 * @param maxColumns The maximum number of columns that we want to use per row inside the ListMenu.
 */
const ListMenu = ({root, maxColumns = MAXIMUM_NUMBER_COLUMNS}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu

    const itemsKey = 'categories'
    const items = root ? root[itemsKey] : false

    return (
        <nav aria-label="main">
            <Flex {...baseStyle.container}>
                {items ? (
                    <Stack direction={'row'} spacing={0} {...baseStyle.stackContainer}>
                        {items.map((item) => {
                            const {id, name} = item
                            const items = item[itemsKey]
                            const initialFocusRef = React.useRef()

                            return (
                                <Box key={id} {...baseStyle.stackElement}>
                                    <Popover
                                        trigger={'hover'}
                                        placement={'bottom-start'}
                                        gutter={17}
                                        initialFocusRef={initialFocusRef}
                                        {...baseStyle.popover}
                                    >
                                        {({isOpen, onClose}) => (
                                            <Fragment>
                                                <ListMenuTrigger
                                                    item={item}
                                                    name={name}
                                                    isOpen={isOpen}
                                                    onClose={onClose}
                                                />
                                                {items && (
                                                    <ListMenuContent
                                                        maxColumns={maxColumns}
                                                        items={items}
                                                        itemsKey={itemsKey}
                                                        onClose={onClose}
                                                    />
                                                )}
                                            </Fragment>
                                        )}
                                    </Popover>
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
     * The root category in your commerce cloud back-end.
     */
    root: PropTypes.object,
    /**
     * The maximum number of columns that we want to use per row in the menu.
     */
    maxColumns: PropTypes.number
}

export default ListMenu
