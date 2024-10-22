/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    useMultiStyleConfig,
    Box,
    Flex,
    IconButton,
    Badge,
    Button,
    Popover,
    PopoverHeader,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    Stack,
    Text,
    Divider,
    useDisclosure,
    useMediaQuery
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AuthHelpers, useAuthHelper, useCustomerType} from '@salesforce/commerce-sdk-react'

import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

import Link from '@salesforce/retail-react-app/app/components/link'
import Search from '@salesforce/retail-react-app/app/components/search'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import {
    AccountIcon,
    BrandLogo,
    BasketIcon,
    HamburgerIcon,
    ChevronDownIcon,
    HeartIcon,
    SignoutIcon,
    StoreIcon
} from '@salesforce/retail-react-app/app/components/icons'

import {navLinks, messages} from '@salesforce/retail-react-app/app/pages/account/constant'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import {isHydrated, noop} from '@salesforce/retail-react-app/app/utils/utils'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
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
    const styles = useMultiStyleConfig('Header')
    const intl = useIntl()
    const placeholder = intl.formatMessage({
        id: 'header.field.placeholder.search_for_products',
        defaultMessage: 'Search for products...'
    })
    return (
        <Box {...styles.searchContainer}>
            <Search
                aria-label={placeholder}
                placeholder={placeholder}
                {...styles.search}
                {...props}
            />
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
 * @return  {React.ReactElement} - Header component
 */
const Header = ({
    children,
    onMenuClick = noop,
    onMyAccountClick = noop,
    onLogoClick = noop,
    onMyCartClick = noop,
    onWishlistClick = noop,
    onStoreLocatorClick = noop,
    ...props
}) => {
    const intl = useIntl()
    const popoverTriggerRef = useRef(null)
    const {
        derivedData: {totalItems},
        data: basket
    } = useCurrentBasket()
    const {isRegistered} = useCustomerType()
    const logout = useAuthHelper(AuthHelpers.Logout)
    const navigate = useNavigation()
    const {
        getButtonProps: getAccountMenuButtonProps,
        getDisclosureProps: getAccountMenuDisclosureProps,
        isOpen: isAccountMenuOpen,
        onClose: onAccountMenuClose,
        onOpen: onAccountMenuOpen
    } = useDisclosure()
    const [isDesktop] = useMediaQuery('(min-width: 992px)')

    const [showLoading, setShowLoading] = useState(false)
    // tracking if users enter the popover Content,
    // so we can decide whether to close the menu when users leave account icons
    const hasEnterPopoverContent = useRef()

    const styles = useMultiStyleConfig('Header')

    const onSignoutClick = async () => {
        setShowLoading(true)
        await logout.mutateAsync()
        navigate('/login')
        setShowLoading(false)
    }

    const handleIconsMouseLeave = () => {
        // don't close the menu if users enter the popover content
        setTimeout(() => {
            if (!hasEnterPopoverContent.current) onAccountMenuClose()
        }, 100)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Tab' && event.shiftKey && isAccountMenuOpen) {
            // Prevent default behavior to keep focus on the popup trigger
            event.preventDefault()
            popoverTriggerRef.current.focus()
        }
    }

    return (
        <Box {...styles.container} {...props}>
            <Box {...styles.content}>
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
                        icon={<HamburgerIcon />}
                        variant="unstyled"
                        display={{lg: 'none'}}
                        {...styles.icons}
                        onClick={onMenuClick}
                    />
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.logo',
                            defaultMessage: 'Logo'
                        })}
                        icon={<BrandLogo {...styles.logo} />}
                        {...styles.icons}
                        variant="unstyled"
                        onClick={onLogoClick}
                    />
                    <Box {...styles.bodyContainer}>{children}</Box>
                    <HideOnMobile>
                        <SearchBar />
                    </HideOnMobile>
                    <IconButtonWithRegistration
                        icon={<AccountIcon />}
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.my_account',
                            defaultMessage: 'My Account'
                        })}
                        variant="unstyled"
                        {...styles.icons}
                        {...styles.accountIcon}
                        onClick={onMyAccountClick}
                        onMouseOver={isDesktop ? onAccountMenuOpen : noop}
                    />

                    {isRegistered && isHydrated() && (
                        <Popover
                            isLazy
                            arrowSize={15}
                            isOpen={isAccountMenuOpen}
                            placement="bottom-end"
                            onClose={onAccountMenuClose}
                            onOpen={onAccountMenuOpen}
                        >
                            <PopoverTrigger>
                                <IconButton
                                    aria-label={intl.formatMessage({
                                        id: 'header.button.assistive_msg.my_account_menu',
                                        defaultMessage: 'Open account menu'
                                    })}
                                    icon={<ChevronDownIcon />}
                                    variant="unstyled"
                                    {...styles.icons}
                                    {...styles.arrowDown}
                                    {...getAccountMenuButtonProps()}
                                    onMouseOver={onAccountMenuOpen}
                                    onMouseLeave={handleIconsMouseLeave}
                                    ref={popoverTriggerRef}
                                    onKeyDown={handleKeyDown}
                                />
                            </PopoverTrigger>

                            <PopoverContent
                                {...styles.popoverContent}
                                onMouseLeave={() => {
                                    hasEnterPopoverContent.current = false
                                    onAccountMenuClose()
                                }}
                                onMouseOver={() => {
                                    hasEnterPopoverContent.current = true
                                }}
                                {...getAccountMenuDisclosureProps()}
                            >
                                <PopoverArrow />
                                <PopoverHeader>
                                    <Text as="h2" fontSize="l" fontFamily="body" fontWeight="700">
                                        {intl.formatMessage({
                                            defaultMessage: 'My Account',
                                            id: 'header.popover.title.my_account'
                                        })}
                                    </Text>
                                </PopoverHeader>
                                <PopoverBody>
                                    <Box as="nav">
                                        <Stack spacing={0} as="ul" data-testid="account-detail-nav">
                                            {navLinks.map((link) => {
                                                const LinkIcon = link.icon
                                                return (
                                                    <Box
                                                        key={link.name}
                                                        position="relative"
                                                        as="li"
                                                        listStyleType="none"
                                                    >
                                                        <Button
                                                            as={Link}
                                                            to={`/account${link.path}`}
                                                            useNavLink={true}
                                                            variant="menu-link"
                                                            leftIcon={<LinkIcon boxSize={5} />}
                                                            width="100%"
                                                        >
                                                            {intl.formatMessage(
                                                                messages[link.name]
                                                            )}
                                                        </Button>
                                                    </Box>
                                                )
                                            })}
                                        </Stack>
                                    </Box>
                                </PopoverBody>
                                <PopoverFooter onClick={onSignoutClick} cursor="pointer">
                                    <Divider colorScheme="gray" />
                                    <Button variant="unstyled" {...styles.signout}>
                                        <Flex>
                                            <SignoutIcon
                                                aria-hidden={true}
                                                boxSize={5}
                                                {...styles.signoutIcon}
                                            />
                                            <Text as="span" {...styles.signoutText}>
                                                {intl.formatMessage({
                                                    defaultMessage: 'Log out',
                                                    id: 'header.popover.action.log_out'
                                                })}
                                            </Text>
                                        </Flex>
                                    </Button>
                                </PopoverFooter>
                            </PopoverContent>
                        </Popover>
                    )}
                    <IconButtonWithRegistration
                        aria-label={intl.formatMessage({
                            defaultMessage: 'Wishlist',
                            id: 'header.button.assistive_msg.wishlist'
                        })}
                        icon={<HeartIcon />}
                        variant="unstyled"
                        {...styles.icons}
                        {...styles.wishlistIcon}
                        onClick={onWishlistClick}
                    />
                    {STORE_LOCATOR_IS_ENABLED && (
                        <IconButton
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Store Locator',
                                id: 'header.button.assistive_msg.store_locator'
                            })}
                            icon={<StoreIcon />}
                            {...styles.icons}
                            variant="unstyled"
                            onClick={onStoreLocatorClick}
                        />
                    )}
                    <IconButton
                        aria-label={intl.formatMessage(
                            {
                                id: 'header.button.assistive_msg.my_cart_with_num_items',
                                defaultMessage: 'My cart, number of items: {numItems}'
                            },
                            {numItems: totalItems}
                        )}
                        icon={
                            <>
                                <BasketIcon />
                                {basket && totalItems > 0 && (
                                    <Badge variant="notification">{totalItems}</Badge>
                                )}
                            </>
                        }
                        variant="unstyled"
                        {...styles.icons}
                        onClick={onMyCartClick}
                    />
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
    onStoreLocatorClick: PropTypes.func,
    searchInputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ])
}

export default Header
