import React from 'react'
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
 * Dev Canvas Header component
 * A simplified version of the main header without categories
 */
const DevCanvasHeader = ({
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
    const popoverTriggerRef = React.useRef(null)
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

    const [showLoading, setShowLoading] = React.useState(false)
    const hasEnterPopoverContent = React.useRef()

    const styles = useMultiStyleConfig('Header')

    const onSignoutClick = async () => {
        setShowLoading(true)
        await logout.mutateAsync()
        navigate('/login')
        setShowLoading(false)
    }

    const handleIconsMouseLeave = () => {
        setTimeout(() => {
            if (!hasEnterPopoverContent.current) onAccountMenuClose()
        }, 100)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Tab' && event.shiftKey && isAccountMenuOpen) {
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
                    <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color="blue.600"
                        position="absolute"
                        left="50%"
                        transform="translateX(-50%)"
                        display={{base: 'none', md: 'block'}}
                    >
                        PWA Kit Developer Canvas
                    </Text>
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
                                <Box
                                    ref={popoverTriggerRef}
                                    onMouseLeave={handleIconsMouseLeave}
                                    onKeyDown={handleKeyDown}
                                >
                                    <IconButton
                                        aria-label={intl.formatMessage({
                                            id: 'header.button.assistive_msg.my_account',
                                            defaultMessage: 'My Account'
                                        })}
                                        icon={<AccountIcon />}
                                        variant="unstyled"
                                        {...styles.icons}
                                        {...styles.accountIcon}
                                    />
                                </Box>
                            </PopoverTrigger>
                            <PopoverContent
                                onMouseEnter={() => {
                                    hasEnterPopoverContent.current = true
                                }}
                                onMouseLeave={() => {
                                    hasEnterPopoverContent.current = false
                                    onAccountMenuClose()
                                }}
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
                                <PopoverFooter>
                                    <Button
                                        variant="menu-link"
                                        leftIcon={<SignoutIcon boxSize={5} />}
                                        width="100%"
                                        onClick={onSignoutClick}
                                    >
                                        {intl.formatMessage({
                                            defaultMessage: 'Sign Out',
                                            id: 'header.button.sign_out'
                                        })}
                                    </Button>
                                </PopoverFooter>
                            </PopoverContent>
                        </Popover>
                    )}

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

DevCanvasHeader.propTypes = {
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

export default DevCanvasHeader 