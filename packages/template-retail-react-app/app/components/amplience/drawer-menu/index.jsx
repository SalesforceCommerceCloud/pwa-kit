import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Project Components
import LocaleSelector from '../../locale-selector'
import NestedAccordion from '../nested-accordion'
import SocialIcons from '../../social-icons'

// Components
import {
    Box,
    Button,
    Center,
    Divider,
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Fade,
    HStack,
    IconButton,
    Flex,
    Spinner,
    Text,
    VStack,

    // Hooks
    useBreakpointValue,
    useMultiStyleConfig
} from '@chakra-ui/react'
import Link from '../link'
// Icons
import {LocationIcon, SignoutIcon, UserIcon} from '../../icons'

// Others
import {noop} from '../../../utils/utils'
import {getPathWithLocale} from '../../../utils/url'
import useCustomer from '../../../commerce-api/hooks/useCustomer'
import LoadingSpinner from '../../loading-spinner'
import {getLinkUrl} from '../../../utils/amplience/link'

import useNavigation from '../../../hooks/use-navigation'
import useMultiSite from '../../../hooks/use-multi-site'
import {getImageUrl} from '../../../utils/amplience/image'

// The FONT_SIZES and FONT_WEIGHTS constants are used to control the styling for
// the accordion buttons as their current depth. In the below definition we assign
// values for depths 0 - 3, any depth deeper than that will use the default styling.
const FONT_SIZES = ['lg', 'md', 'md']
const FONT_WEIGHTS = ['semibold', 'semibold', 'regular']
const PHONE_DRAWER_SIZE = 'xs'
const TABLET_DRAWER_SIZE = 'lg'

const DrawerSeparator = () => (
    <Box paddingTop="6" paddingBottom="6">
        <Divider />
    </Box>
)

// CUSTOMIZE YOUR NAVIGATION BY ALTERING THESE VALUES
const SIGN_IN_HREF = '/login'
const STORE_LOCATOR_HREF = '/store-locator'

/**
 * This is the navigation component used for mobile devices (phone and tablet). It's
 * main usage is to navigate from one category to the next, but also homes links to
 * support, log in and out actions, as support links.
 */
const DrawerMenu = ({
    isOpen,
    onClose = noop,
    onLogoClick = noop,
    root,
    footer,
    logo,
    showVse = false
}) => {
    const intl = useIntl()
    const customer = useCustomer()
    const navigate = useNavigation()
    const styles = useMultiStyleConfig('DrawerMenu')
    const ampStyles = useMultiStyleConfig('AmplienceHeader')
    const drawerSize = useBreakpointValue({sm: PHONE_DRAWER_SIZE, md: TABLET_DRAWER_SIZE})
    const socialIconVariant = useBreakpointValue({base: 'flex', md: 'flex-start'})
    const {site, buildUrl} = useMultiSite()
    const {l10n} = site
    const [showLoading, setShowLoading] = useState(false)
    const onSignoutClick = async () => {
        setShowLoading(true)
        await customer.logout(navigate)
        setShowLoading(false)
    }
    const url = getImageUrl(logo)

    const supportedLocaleIds = l10n?.supportedLocales.map((locale) => locale.id)
    const showLocaleSelector = supportedLocaleIds?.length > 1

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            placement="left"
            size={drawerSize}
            trapFocus={!showVse}
        >
            <DrawerOverlay>
                <DrawerContent>
                    {/* Header Content */}
                    <DrawerHeader>
                        {url && (
                            <IconButton
                                icon={
                                    <img
                                        {...styles.logo}
                                        style={{...ampStyles.logo}}
                                        alt={'logo'}
                                        src={`${url}?w=192&fmt=auto`}
                                    />
                                }
                                variant="unstyled"
                                onClick={onLogoClick}
                            />
                        )}

                        <DrawerCloseButton />
                    </DrawerHeader>

                    <DrawerBody>
                        {showLoading && <LoadingSpinner />}
                        {root ? (
                            <Fade in={true}>
                                <NestedAccordion
                                    allowMultiple={true}
                                    item={root}
                                    fontSizes={FONT_SIZES}
                                    fontWeights={FONT_WEIGHTS}
                                    urlBuilder={getLinkUrl}
                                />
                            </Fade>
                        ) : (
                            <Center p="8">
                                <Spinner size="xl" />
                            </Center>
                        )}
                        <DrawerSeparator />
                        Application Actions
                        <VStack align="stretch" spacing={0} {...styles.actions} px={0}>
                            <Box {...styles.actionsItem}>
                                {customer.isRegistered ? (
                                    <NestedAccordion
                                        urlBuilder={(item, locale) =>
                                            `/${locale}/account${item.path}`
                                        }
                                        itemsAfter={({depth}) =>
                                            depth === 1 && (
                                                <Button
                                                    {...styles.signout}
                                                    variant="unstyled"
                                                    onClick={onSignoutClick}
                                                >
                                                    <Flex align={'center'}>
                                                        <SignoutIcon boxSize={5} />
                                                        <Text {...styles.signoutText} as="span">
                                                            {intl.formatMessage({
                                                                id: 'drawer_menu.button.log_out',
                                                                defaultMessage: 'Log Out'
                                                            })}
                                                        </Text>
                                                    </Flex>
                                                </Button>
                                            )
                                        }
                                        item={{
                                            id: 'root',
                                            items: [
                                                {
                                                    id: 'my-account',
                                                    title: intl.formatMessage({
                                                        id: 'drawer_menu.button.my_account',
                                                        defaultMessage: 'My Account'
                                                    }),
                                                    children: [
                                                        {
                                                            id: 'profile',
                                                            path: '',
                                                            title: intl.formatMessage({
                                                                id:
                                                                    'drawer_menu.button.account_details',
                                                                defaultMessage: 'Account Details'
                                                            })
                                                        },
                                                        {
                                                            id: 'orders',
                                                            path: '/orders',
                                                            title: intl.formatMessage({
                                                                id:
                                                                    'drawer_menu.button.order_history',
                                                                defaultMessage: 'Order History'
                                                            })
                                                        },
                                                        {
                                                            id: 'addresses',
                                                            path: '/addresses',
                                                            title: intl.formatMessage({
                                                                id: 'drawer_menu.button.addresses',
                                                                defaultMessage: 'Addresses'
                                                            })
                                                        },
                                                        {
                                                            id: 'payments',
                                                            path: '/payments',
                                                            title: intl.formatMessage({
                                                                id:
                                                                    'drawer_menu.button.payment_methods',
                                                                defaultMessage: 'Payment Methods'
                                                            })
                                                        }
                                                    ]
                                                }
                                            ]
                                        }}
                                    />
                                ) : (
                                    <Link to={SIGN_IN_HREF}>
                                        <HStack>
                                            <UserIcon {...styles.icon} />{' '}
                                            <Text>
                                                {intl.formatMessage({
                                                    id: 'drawer_menu.link.sign_in',
                                                    defaultMessage: 'Sign In'
                                                })}
                                            </Text>
                                        </HStack>
                                    </Link>
                                )}
                            </Box>
                            <Box {...styles.actionsItem}>
                                <Link to={STORE_LOCATOR_HREF}>
                                    <HStack>
                                        <LocationIcon {...styles.icon} />{' '}
                                        <Text>
                                            {intl.formatMessage({
                                                id: 'drawer_menu.link.store_locator',
                                                defaultMessage: 'Store Locator'
                                            })}
                                        </Text>
                                    </HStack>
                                </Link>
                            </Box>
                            {showLocaleSelector && (
                                <Box>
                                    <LocaleSelector
                                        {...styles.localeSelector}
                                        selectedLocale={intl.locale}
                                        locales={supportedLocaleIds}
                                        onSelect={(newLocale) => {
                                            // Update the `locale` in the URL.
                                            const newUrl = getPathWithLocale(newLocale, buildUrl, {
                                                disallowParams: ['refine']
                                            })
                                            window.location = newUrl
                                        }}
                                    />
                                </Box>
                            )}
                        </VStack>
                        {footer ? (
                            <>
                                <DrawerSeparator />
                                {footer.title || 'Support Links'}
                                <NestedAccordion
                                    allowMultiple={true}
                                    // NOTE: Modify this content and builder as you see fit.
                                    urlBuilder={getLinkUrl}
                                    item={footer}
                                />
                            </>
                        ) : null}
                        <DrawerSeparator />
                    </DrawerBody>
                    <DrawerFooter>
                        <SocialIcons variant={socialIconVariant} />
                    </DrawerFooter>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    )
}

DrawerMenu.displayName = 'DrawerMenu'

DrawerMenu.propTypes = {
    /**
     * The root category in your commerce cloud back-end.
     */
    root: PropTypes.object,
    /**
     * The footer menu
     */
    footer: PropTypes.object,
    /**
     * The opened state of the drawer.
     */
    isOpen: PropTypes.bool,
    /**
     * Function called when the drawer is dismissed.
     */
    onClose: PropTypes.func,
    /**
     * Function called when the drawer logo is clicked.
     */
    onLogoClick: PropTypes.func,
    /**
     * Logo image object
     */
    logo: PropTypes.object,
    /**
     * Show VSE toggle
     */
    showVse: PropTypes.bool
}

export default DrawerMenu
