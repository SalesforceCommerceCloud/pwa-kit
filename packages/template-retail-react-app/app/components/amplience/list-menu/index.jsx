import React, {Fragment, useRef, forwardRef} from 'react'
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
    Stack,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Center,
    Spinner,

    // Hooks
    useTheme,
    useDisclosure,
    Heading
} from '@chakra-ui/react'
import Link from '../link'
// Others
import {getLinkUrl} from '../../../utils/amplience/link'
import {ChevronDownIcon} from '../../icons'
import AmplienceWrapper from '../wrapper'
import NavigationHero from '../hero/navigationHero'

const menuComponents = {
    'https://sfcc.com/components/hero': NavigationHero
}

const MAXIMUM_NUMBER_COLUMNS = 5

const ChevronIconTrigger = forwardRef(function ChevronIconTrigger(props, ref) {
    return (
        <Box {...props} ref={ref}>
            <ChevronDownIcon />
        </Box>
    )
})

const AmplienceListMenuTrigger = ({item, name, isOpen, onOpen, onClose, hasItems}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu

    const keyMap = {
        Escape: () => onClose(),
        Enter: () => onOpen()
    }

    const link = getLinkUrl(item)

    return (
        <Box {...baseStyle.listMenuTriggerContainer}>
            {link ? (
                <Link
                    as={RouteLink}
                    to={link}
                    onMouseOver={onOpen}
                    {...baseStyle.listMenuTriggerLink}
                    {...(hasItems ? {name: name + ' __'} : {name: name})}
                    {...(!hasItems ? baseStyle.listMenuTriggerLinkWithIcon : {})}
                    {...(isOpen ? baseStyle.listMenuTriggerLinkActive : {})}
                >
                    {name}
                </Link>
            ) : (
                <Heading
                    onMouseOver={onOpen}
                    style={{cursor: 'pointer'}}
                    {...baseStyle.listMenuTriggerLink}
                    {...(hasItems ? {name: name + ' __'} : {name: name})}
                    {...(!hasItems ? baseStyle.listMenuTriggerLinkWithIcon : {})}
                    {...(isOpen ? baseStyle.listMenuTriggerLinkActive : {})}
                >
                    {name}
                </Heading>
            )}

            {hasItems && (
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
                        <ChevronIconTrigger {...baseStyle.selectedButtonIcon} />
                    </PopoverTrigger>
                </Link>
            )}
        </Box>
    )
}
AmplienceListMenuTrigger.propTypes = {
    item: PropTypes.object,
    name: PropTypes.string,
    isOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    hasItems: PropTypes.bool
}

const AmplienceListMenuContent = ({maxColumns, items, onClose, initialFocusRef, content}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu
    const limitWidth = content ? 20 : 0

    return (
        <PopoverContent data-testid="popover-menu" {...baseStyle.popoverContent}>
            <PopoverBody>
                <Container as={Stack} {...baseStyle.popoverContainer}>
                    <Flex direction={'row'}>
                        <Box width={`${100 - limitWidth}%`}>
                            <SimpleGrid
                                spacing={8}
                                justifyContent={'left'}
                                gridTemplateColumns={`repeat(${
                                    items.length > maxColumns ? maxColumns : items.length
                                }, minmax(0, 21%))`}
                                marginInlineStart={{lg: '68px', xl: '96px'}}
                            >
                                {items.map((item, index) => {
                                    const name = item.common ? item.common.title : ''
                                    const subitems = item.children

                                    const heading = {
                                        href: getLinkUrl(item),
                                        text: name,
                                        styles: {
                                            fontSize: 'md',
                                            marginBottom: 2
                                        }
                                    }

                                    const links = subitems
                                        ? subitems.map((item) => {
                                              return {
                                                  href: getLinkUrl(item),
                                                  text: item.common ? item.common.title : '',
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
                                            key={index}
                                            heading={heading}
                                            links={links}
                                            color={'gray.900'}
                                            onLinkClick={onClose}
                                            {...(index === 0
                                                ? {headingLinkRef: initialFocusRef}
                                                : {})}
                                        />
                                    )
                                })}
                            </SimpleGrid>
                        </Box>
                        <Box width={`${limitWidth}%`}>
                            {content && (
                                <AmplienceWrapper content={content} components={menuComponents} />
                            )}
                        </Box>
                    </Flex>
                </Container>
            </PopoverBody>
        </PopoverContent>
    )
}
AmplienceListMenuContent.propTypes = {
    items: PropTypes.array,
    maxColumns: PropTypes.number,
    itemsKey: PropTypes.string,
    onClose: PropTypes.func,
    initialFocusRef: PropTypes.object,
    content: PropTypes.object
}

const AmplienceListMenuPopover = ({items, item, name, itemsKey, maxColumns}) => {
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
                    <AmplienceListMenuTrigger
                        item={item}
                        name={name}
                        isOpen={isOpen}
                        onOpen={onOpen}
                        onClose={onClose}
                        hasItems={!!items}
                    />
                    {items && (
                        <AmplienceListMenuContent
                            items={items}
                            itemsKey={itemsKey}
                            initialFocusRef={initialFocusRef}
                            onClose={onClose}
                            maxColumns={maxColumns}
                            content={item.common.navcontent}
                        />
                    )}
                </Fragment>
            </Popover>
        </Box>
    )
}

AmplienceListMenuPopover.propTypes = {
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
 * @param root The root category in your commerce cloud back-end.
 * @param maxColumns The maximum number of columns that we want to use per row inside the ListMenu.
 */
const AmplienceListMenu = ({root, maxColumns = MAXIMUM_NUMBER_COLUMNS}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.AmplienceListMenu

    const items = root.children

    return (
        <nav aria-label="main">
            <Flex {...baseStyle.container}>
                {items ? (
                    <Stack direction={'row'} spacing={0} {...baseStyle.stackContainer}>
                        {items.map((item, index) => {
                            const name = item.common ? item.common.title : ''

                            return (
                                <AmplienceListMenuPopover
                                    key={index}
                                    maxColumns={maxColumns}
                                    item={item}
                                    name={name}
                                    items={item.children}
                                />
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

AmplienceListMenu.displayName = 'AmplienceListMenu'

AmplienceListMenu.propTypes = {
    /**
     * Amplience content hierarchy of navigation items.
     */
    root: PropTypes.object,
    /**
     * The maximum number of columns that we want to use per row in the menu.
     */
    maxColumns: PropTypes.number
}

export default AmplienceListMenu
