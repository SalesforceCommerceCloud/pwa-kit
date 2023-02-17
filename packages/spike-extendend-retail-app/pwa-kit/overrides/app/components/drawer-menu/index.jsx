/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
// import {useIntl} from 'react-intl'

// Project Components
import LocaleSelector from '^retail-react-app/app/components/locale-selector'
import NestedAccordion from '^retail-react-app/app/components/nested-accordion'
import SocialIcons from '^retail-react-app/app/components/social-icons'

// Components
import {
    Box,
    AccordionButton,
    AccordionItem,
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
    useMultiStyleConfig,
} from '@chakra-ui/react'
import Link from '^retail-react-app/app/components/link'
// Icons
import {
    BrandLogo,
    LocationIcon,
    SignoutIcon,
    UserIcon,
} from '^retail-react-app/app/components/icons'

// Others
import {noop} from '^retail-react-app/app/utils/utils'
import {getPathWithLocale, categoryUrlBuilder} from '^retail-react-app/app/utils/url'
import useCustomer from '^retail-react-app/app/commerce-api/hooks/useCustomer'
import LoadingSpinner from '^retail-react-app/app/components/loading-spinner'

import useNavigation from '^retail-react-app/app/hooks/use-navigation'
import useMultiSite from '^retail-react-app/app/hooks/use-multi-site'

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
const DrawerMenu = ({isOpen, onClose = noop, onLogoClick = noop, root}) => {
    // const intl = useIntl()
    const customer = useCustomer()
    const navigate = useNavigation()
    const styles = useMultiStyleConfig('DrawerMenu')
    const drawerSize = useBreakpointValue({sm: PHONE_DRAWER_SIZE, md: TABLET_DRAWER_SIZE})
    const socialIconVariant = useBreakpointValue({base: 'flex', md: 'flex-start'})
    const {site, buildUrl} = useMultiSite()
    const {l10n} = site
    const [showLoading, setShowLoading] = useState(false)
    const onSignoutClick = async () => {
        setShowLoading(true)
        await customer.logout()
        navigate('/login')
        setShowLoading(false)
    }

    const supportedLocaleIds = l10n?.supportedLocales.map((locale) => locale.id)
    const showLocaleSelector = supportedLocaleIds?.length > 1

    return (
        <Drawer isOpen={isOpen} onClose={onClose} placement="left" size={drawerSize}>
            <DrawerOverlay>
                <DrawerContent>
                    {/* Header Content */}
                    <DrawerHeader>
                        <IconButton
                            icon={<BrandLogo {...styles.logo} />}
                            variant="unstyled"
                            onClick={onLogoClick}
                        />

                        <DrawerCloseButton />
                    </DrawerHeader>

                    {/* Main Content */}
                    <DrawerBody>
                        {showLoading && <LoadingSpinner />}

                        {/* Category Navigation */}
                        {root ? (
                            <Fade in={true}>
                                <NestedAccordion
                                    allowMultiple={true}
                                    item={root}
                                    itemsKey="categories"
                                    itemsFilter="c_showInMenu"
                                    fontSizes={FONT_SIZES}
                                    fontWeights={FONT_WEIGHTS}
                                    itemsBefore={({depth, item}) =>
                                        depth > 0 ? (
                                            [
                                                <AccordionItem border="none" key="show-all">
                                                    <AccordionButton
                                                        paddingLeft={8}
                                                        as={Link}
                                                        to={categoryUrlBuilder(item)}
                                                        fontSize={FONT_SIZES[depth]}
                                                        fontWeight={FONT_WEIGHTS[depth]}
                                                        color="black"
                                                    >
                                                        {/* {intl.formatMessage({
                                                            id: 'drawer_menu.link.shop_all',
                                                            defaultMessage: 'Shop All'
                                                        })} */}
                                                        Shop All
                                                    </AccordionButton>
                                                </AccordionItem>,
                                            ]
                                        ) : (
                                            <></>
                                        )
                                    }
                                    urlBuilder={categoryUrlBuilder}
                                />
                            </Fade>
                        ) : (
                            <Center p="8">
                                <Spinner size="xl" />
                            </Center>
                        )}

                        <DrawerSeparator />

                        {/* Application Actions */}
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
                                                            {/* {intl.formatMessage({
                                                                id: 'drawer_menu.button.log_out',
                                                                defaultMessage: 'Log Out',
                                                            })} */}
                                                            Log Out
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
                                                    name: 'My Account',
                                                    //  intl.formatMessage({
                                                    //     id: 'drawer_menu.button.my_account',
                                                    //     defaultMessage: 'My Account',
                                                    // })
                                                    items: [
                                                        {
                                                            id: 'profile',
                                                            path: '',
                                                            name: 'Account Details',
                                                            // intl.formatMessage({
                                                            //     id: 'drawer_menu.button.account_details',
                                                            //     defaultMessage: 'Account Details',
                                                            // })
                                                        },
                                                        {
                                                            id: 'orders',
                                                            path: '/orders',
                                                            name: 'Order History',
                                                            // intl.formatMessage({
                                                            //     id: 'drawer_menu.button.order_history',
                                                            //     defaultMessage: 'Order History',
                                                            // })
                                                        },
                                                        {
                                                            id: 'addresses',
                                                            path: '/addresses',
                                                            name: 'Addresses',
                                                            // intl.formatMessage({
                                                            //     id: 'drawer_menu.button.addresses',
                                                            //     defaultMessage: 'Addresses',
                                                            // })
                                                        },
                                                        {
                                                            id: 'payments',
                                                            path: '/payments',
                                                            name: 'Payment Methods',
                                                            // intl.formatMessage({
                                                            //     id: 'drawer_menu.button.payment_methods',
                                                            //     defaultMessage: 'Payment Methods',
                                                            // })
                                                        },
                                                    ],
                                                },
                                            ],
                                        }}
                                    />
                                ) : (
                                    <Link to={SIGN_IN_HREF}>
                                        <HStack>
                                            <UserIcon {...styles.icon} />{' '}
                                            <Text>
                                                {/* {intl.formatMessage({
                                                    id: 'drawer_menu.link.sign_in',
                                                    defaultMessage: 'Sign In',
                                                })} */}
                                                Sign In
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
                                            {/* {intl.formatMessage({
                                                id: 'drawer_menu.link.store_locator',
                                                defaultMessage: 'Store Locator',
                                            })} */}
                                            Store Locator
                                        </Text>
                                    </HStack>
                                </Link>
                            </Box>
                            {showLocaleSelector && (
                                <Box>
                                    {/* <LocaleSelector
                                        {...styles.localeSelector}
                                        selectedLocale={intl.locale}
                                        locales={supportedLocaleIds}
                                        onSelect={(newLocale) => {
                                            // Update the `locale` in the URL.
                                            const newUrl = getPathWithLocale(newLocale, buildUrl, {
                                                disallowParams: ['refine'],
                                            })
                                            window.location = newUrl
                                        }}
                                    /> */}
                                </Box>
                            )}
                        </VStack>

                        <DrawerSeparator />

                        {/* Support Links */}
                        <NestedAccordion
                            allowMultiple={true}
                            // NOTE: Modify this content and builder as you see fit.
                            urlBuilder={() => '/'}
                            item={{
                                id: 'links-root',
                                items: [
                                    {
                                        id: 'customersupport',
                                        items: [
                                            {
                                                id: 'contactus',
                                                name: 'Contact Us',
                                                // intl.formatMessage({
                                                //     id: 'drawer_menu.link.customer_support.contact_us',
                                                //     defaultMessage: 'Contact Us',
                                                // })
                                            },
                                            {
                                                id: 'shippingandreturns',
                                                name: 'Shipping & Returns',
                                                // intl.formatMessage({
                                                //     id: 'drawer_menu.link.customer_support.shipping_and_returns',
                                                //     defaultMessage: 'Shipping & Returns',
                                                // })
                                            },
                                        ],
                                        name: 'Customer Support',
                                        // intl.formatMessage({
                                        //     id: 'drawer_menu.link.customer_support',
                                        //     defaultMessage: 'Customer Support',
                                        // })
                                    },
                                    {
                                        id: 'ourcompany',
                                        items: [
                                            {
                                                id: 'aboutus',
                                                name: 'About Us',
                                                // intl.formatMessage({
                                                //     id: 'drawer_menu.link.about_us',
                                                //     defaultMessage: 'About Us',
                                                // })
                                            },
                                        ],
                                        name: 'Out Company',
                                        // intl.formatMessage({
                                        //     id: 'drawer_menu.link.our_company',
                                        //     defaultMessage: 'Our Company',
                                        // })
                                    },
                                    {
                                        id: 'privacyandsecurity',
                                        items: [
                                            {
                                                id: 'termsandconditions',
                                                name: 'Terms & Conditions',
                                                // intl.formatMessage({
                                                //     id: 'drawer_menu.link.terms_and_conditions',
                                                //     defaultMessage: 'Terms & Conditions',
                                                // })
                                            },
                                            {
                                                id: 'privacypolicy',
                                                name: 'Privacy Policy',
                                                // intl.formatMessage({
                                                //     id: 'drawer_menu.link.privacy_policy',
                                                //     defaultMessage: 'Privacy Policy',
                                                // })
                                            },
                                            {
                                                id: 'sitemap',
                                                name: 'Site Map',
                                                // intl.formatMessage({
                                                //     id: 'drawer_menu.link.site_map',
                                                //     defaultMessage: 'Site Map',
                                                // })
                                            },
                                        ],
                                        name: 'Privacy & Security',
                                        // intl.formatMessage({
                                        //     id: 'drawer_menu.link.privacy_and_security',
                                        //     defaultMessage: 'Privacy & Security',
                                        // })
                                    },
                                ],
                            }}
                        />

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
}

export default DrawerMenu
