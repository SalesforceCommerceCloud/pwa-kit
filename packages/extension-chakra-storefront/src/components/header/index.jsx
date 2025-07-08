/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Badge,
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    List,
    Popover,
    Text,
    Separator,
    // hooks
    useSlotRecipe
} from '@chakra-ui/react'
import {AuthHelpers, useAuthHelper, useCustomerType} from '@salesforce/commerce-sdk-react'
import {
    useApplicationExtension,
    useApplicationExtensionsStore
} from '@salesforce/pwa-kit-extension-sdk/react'

import {useCurrentBasket} from '../../hooks'

import Link from '../../components/link'
import Search from '../../components/search'
import withRegistration from '../../components/with-registration'
import {
    AccountIcon,
    BrandLogo,
    BasketIcon,
    HamburgerIcon,
    ChevronDownIcon,
    HeartIcon,
    SignoutIcon,
    StoreIcon
} from '../icons'

import {navLinks, messages} from '../../pages/account/constant'
import useNavigation from '../../hooks/use-navigation'
import LoadingSpinner from '../../components/loading-spinner'
import {HideOnDesktop, HideOnMobile} from '../responsive'
import {noop} from '../../utils/utils'

const IconButtonWithRegistration = withRegistration(IconButton)

/**
 * Search bar for the header.
 *
 * The search bar is a simple input field with a search icon.
 * It can be used to search for products or navigate to a
 * specific page.
 *
 * @param props {object} the component props
 * @returns {Element} the search bar element
 */
const SearchBar = (props) => {
    const recipe = useSlotRecipe({key: 'header'})
    const styles = recipe()
    const intl = useIntl()
    const placeholder = intl.formatMessage({
        id: 'header.field.placeholder.search_for_products',
        defaultMessage: 'Search for products...'
    })
    return (
        <Box css={styles.searchContainer}>
            <Search aria-label={placeholder} placeholder={placeholder} {...props} />
        </Box>
    )
}
/**
 * The header is the main source for accessing
 * navigation, search, basket, and other
 * important information and actions. It persists
 * on the top of your application and will
 * respond to changes in device size.
 *
 * To customize the styles, update the themes
 * in theme/components/project/header.js
 * @param  props
 * @param   {func} props.onMenuClick click event handler for menu button
 * @param   {func} props.onLogoClick click event handler for menu button
 * @param   {object} props.searchInputRef reference of the search input
 * @param   {func} props.onMyAccountClick click event handler for my account button
 * @param   {func} props.onMyCartClick click event handler for my cart button
 * @param   {func} props.onWishlistClick click event handler for with list button
 * @param   {React.ReactElement} props.children - React Node to be rendered inside Header
 * @return  {React.ReactElement} - Header component
 */
const Header = ({
    children,
    onMenuClick = noop,
    onMyAccountClick = noop,
    onLogoClick = noop,
    onMyCartClick = noop,
    onWishlistClick = noop,
    ...props
}) => {
    const intl = useIntl()
    const {
        derivedData: {totalItems},
        data: basket
    } = useCurrentBasket()
    const {isRegistered} = useCustomerType()
    const logout = useAuthHelper(AuthHelpers.Logout)
    const navigate = useNavigation()
    const storeLocatorExtension = useApplicationExtension(
        '@salesforce/extension-chakra-store-locator'
    )
    const isStoreLocatorEnabled = !!storeLocatorExtension && storeLocatorExtension.isEnabled
    const openModal = useApplicationExtensionsStore((state) => {
        return state.state['@salesforce/extension-chakra-store-locator']?.openModal || noop
    })

    const [showLoading, setShowLoading] = useState(false)

    const recipe = useSlotRecipe({key: 'header'})
    const styles = recipe()
    const onSignoutClick = async () => {
        setShowLoading(true)
        await logout.mutateAsync()
        navigate('/login')
        setShowLoading(false)
    }

    return (
        <Box css={styles.container} {...props}>
            <Box css={styles.content}>
                {showLoading && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}
                <Flex wrap="wrap" alignItems={['baseline', 'baseline', 'baseline', 'center']}>
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.menu',
                            defaultMessage: 'Menu'
                        })}
                        title={intl.formatMessage({
                            id: 'header.button.assistive_msg.menu.open_dialog',
                            defaultMessage: 'Opens a dialog'
                        })}
                        css={styles.iconButton}
                        variant="unstyled"
                        display={{lg: 'none'}}
                        onClick={onMenuClick}
                    >
                        <HamburgerIcon />
                    </IconButton>
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.logo',
                            defaultMessage: 'Logo'
                        })}
                        css={styles.iconButton}
                        variant="unstyled"
                        onClick={onLogoClick}
                    >
                        <BrandLogo css={styles.logo} />
                    </IconButton>
                    <Box css={styles.bodyContainer}>{children}</Box>
                    <HideOnMobile>
                        <SearchBar />
                    </HideOnMobile>

                    <IconButtonWithRegistration
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.my_account',
                            defaultMessage: 'My Account'
                        })}
                        variant="unstyled"
                        css={{...styles.iconButton, ...styles.accountIconButton}}
                        onClick={onMyAccountClick}
                    >
                        <AccountIcon boxSize="6" />
                    </IconButtonWithRegistration>

                    {isRegistered && (
                        <Popover.Root
                            lazyMount
                            unmountOnExit
                            positioning={{placement: 'bottom-end'}}
                        >
                            <Popover.Trigger asChild>
                                <IconButton
                                    gap={0}
                                    variant="unstyled"
                                    aria-label={intl.formatMessage({
                                        id: 'header.button.assistive_msg.my_account_menu',
                                        defaultMessage: 'Open account menu'
                                    })}
                                    css={{...styles.iconButton, ...styles.arrowDownButton}}
                                >
                                    <HideOnMobile>
                                        <ChevronDownIcon />
                                    </HideOnMobile>
                                </IconButton>
                            </Popover.Trigger>

                            <Popover.Positioner>
                                <Popover.Content>
                                    <Popover.Arrow />
                                    <Popover.Body css={styles.dropdownMenuBody}>
                                        <Popover.Header pb={1}>
                                            <Popover.Title>
                                                <Heading as="h2" size="lg">
                                                    {intl.formatMessage({
                                                        defaultMessage: 'My Account',
                                                        id: 'header.popover.title.my_account'
                                                    })}
                                                </Heading>
                                            </Popover.Title>
                                        </Popover.Header>
                                        <Box asChild px="3">
                                            <nav>
                                                <List.Root
                                                    variant="plain"
                                                    as="ul"
                                                    data-testid="account-detail-nav"
                                                >
                                                    {navLinks.map((link, index) => {
                                                        const LinkIcon = link.icon
                                                        return (
                                                            <List.Item key={link.name}>
                                                                <Button
                                                                    asChild
                                                                    variant="menu-link"
                                                                    css={styles.menuAccountLink}
                                                                >
                                                                    <Link
                                                                        to={`/account${link.path}`}
                                                                        useNavLink={true}
                                                                    >
                                                                        <LinkIcon
                                                                            boxSize="5"
                                                                            mr="2"
                                                                        />
                                                                        {intl.formatMessage(
                                                                            messages[link.name]
                                                                        )}
                                                                    </Link>
                                                                </Button>
                                                            </List.Item>
                                                        )
                                                    })}
                                                </List.Root>
                                            </nav>
                                        </Box>
                                        <Separator mx="3" my="2" />

                                        <Popover.Footer px="3" py="0">
                                            <Button
                                                variant="ghost"
                                                css={styles.signoutButton}
                                                onClick={onSignoutClick}
                                            >
                                                <SignoutIcon
                                                    aria-hidden={true}
                                                    boxSize="5"
                                                    css={styles.signoutIcon}
                                                />
                                                <Text as="span" css={styles.signoutText}>
                                                    {intl.formatMessage({
                                                        defaultMessage: 'Log out',
                                                        id: 'header.popover.action.log_out'
                                                    })}
                                                </Text>
                                            </Button>
                                        </Popover.Footer>
                                    </Popover.Body>
                                </Popover.Content>
                            </Popover.Positioner>
                        </Popover.Root>
                    )}
                    <IconButtonWithRegistration
                        aria-label={intl.formatMessage({
                            defaultMessage: 'Wishlist',
                            id: 'header.button.assistive_msg.wishlist'
                        })}
                        variant="unstyled"
                        css={{...styles.iconButton, ...styles.wishlistIconButton}}
                        // uncomment when we fix wishlist
                        // onClick={onWishlistClick}
                    >
                        <HeartIcon boxSize="6" />
                    </IconButtonWithRegistration>
                    {isStoreLocatorEnabled && (
                        <IconButton
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Store Locator',
                                id: 'header.button.assistive_msg.store_locator'
                            })}
                            css={styles.iconButton}
                            variant="unstyled"
                            onClick={() => {
                                openModal()
                            }}
                        >
                            <StoreIcon boxSize="6" />
                        </IconButton>
                    )}
                    <IconButton
                        aria-label={intl.formatMessage(
                            {
                                id: 'header.button.assistive_msg.my_cart_with_num_items',
                                defaultMessage: 'My cart, number of items: {numItems}'
                            },
                            {numItems: totalItems}
                        )}
                        variant="unstyled"
                        css={styles.iconButton}
                        onClick={onMyCartClick}
                    >
                        <>
                            <BasketIcon boxSize="6" />
                            {basket && totalItems > 0 && (
                                <Badge variant="notification">{totalItems}</Badge>
                            )}
                        </>
                    </IconButton>
                    <HideOnDesktop display={{base: 'contents', lg: 'none'}}>
                        <SearchBar />
                    </HideOnDesktop>
                </Flex>
            </Box>
        </Box>
    )
}

Header.propTypes = {
    children: PropTypes.node,
    onMenuClick: PropTypes.func,
    onLogoClick: PropTypes.func,
    onMyAccountClick: PropTypes.func,
    onWishlistClick: PropTypes.func,
    onMyCartClick: PropTypes.func,
    searchInputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ])
}

export default Header
