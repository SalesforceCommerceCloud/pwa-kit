/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Project Components
import LocaleSelector from '../locale-selector'
import NestedAccordion from '../nested-accordion'
import SocialIcons from '../social-icons'

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
    useMultiStyleConfig
} from '@chakra-ui/react'
import Link from '../../components/link'
// Icons
import {BrandLogo, LocationIcon, SignoutIcon, UserIcon} from '../icons'

// Others
import {noop} from '../../utils/utils'
import {buildUrlLocale, categoryUrlBuilder} from '../../utils/url'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import LoadingSpinner from '../loading-spinner'

import useNavigation from '../../hooks/use-navigation'
import {SUPPORTED_LOCALES} from '../../constants'

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
    const intl = useIntl()
    const customer = useCustomer()
    const navigate = useNavigation()
    const styles = useMultiStyleConfig('DrawerMenu')
    const drawerSize = useBreakpointValue({sm: PHONE_DRAWER_SIZE, md: TABLET_DRAWER_SIZE})
    const socialIconVariant = useBreakpointValue({base: 'flex', md: 'flex-start'})

    const [showLoading, setShowLoading] = useState(false)
    const onSignoutClick = async () => {
        setShowLoading(true)
        await customer.logout()
        navigate('/login')
        setShowLoading(false)
    }
    const {locale} = useIntl()

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
                                                        {intl.formatMessage({
                                                            defaultMessage: 'Shop All',
                                                            description:
                                                                'drawer_menu.button.shop_all'
                                                        })}
                                                    </AccordionButton>
                                                </AccordionItem>
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
                                                            {intl.formatMessage({
                                                                defaultMessage: 'Log out',
                                                                description:
                                                                    'drawer_menu.button.log_out'
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
                                                    name: intl.formatMessage({
                                                        defaultMessage: 'My Account',
                                                        description: 'drawer_menu.link.my_account'
                                                    }),
                                                    items: [
                                                        {
                                                            id: 'profile',
                                                            path: '',
                                                            name: intl.formatMessage({
                                                                defaultMessage: 'Account Details',
                                                                description:
                                                                    'drawer_menu.link.account_details'
                                                            })
                                                        },
                                                        {
                                                            id: 'orders',
                                                            path: '/orders',
                                                            name: intl.formatMessage({
                                                                defaultMessage: 'Order History',
                                                                description:
                                                                    'drawer_menu.link.order_history'
                                                            })
                                                        },
                                                        {
                                                            id: 'addresses',
                                                            path: '/addresses',
                                                            name: intl.formatMessage({
                                                                defaultMessage: 'Addresses',
                                                                description:
                                                                    'drawer_menu.link.addresses'
                                                            })
                                                        },
                                                        {
                                                            id: 'payments',
                                                            path: '/payments',
                                                            name: intl.formatMessage({
                                                                defaultMessage: 'Payment Methods',
                                                                description:
                                                                    'drawer_menu.link.payment_methods'
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
                                                    defaultMessage: 'Sign In',
                                                    description: 'drawer_menu.link.sign_in'
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
                                                defaultMessage: 'Store Locator',
                                                description: 'drawer_menu.link.store_locator'
                                            })}
                                        </Text>
                                    </HStack>
                                </Link>
                            </Box>
                            <Box>
                                <LocaleSelector
                                    {...styles.localeSelector}
                                    selectedLocale={intl.locale}
                                    locales={SUPPORTED_LOCALES}
                                    onSelect={(newLocale) => {
                                        // Update the `locale` in the URL.
                                        const newUrl = buildUrlLocale(locale, newLocale)
                                        window.location = newUrl
                                    }}
                                />
                            </Box>
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
                                                name: intl.formatMessage({
                                                    defaultMessage: 'Contact Us',
                                                    description: 'drawer_menu.link.contact_us'
                                                })
                                            },
                                            {
                                                id: 'shippingandreturns',
                                                name: intl.formatMessage({
                                                    defaultMessage: 'Shipping & Returns',
                                                    description:
                                                        'drawer_menu.link.shipping_and_return'
                                                })
                                            }
                                        ],
                                        name: intl.formatMessage({
                                            defaultMessage: 'Customer Support',
                                            description: 'drawer_menu.link.customer_support'
                                        })
                                    },
                                    {
                                        id: 'ourcompany',
                                        items: [
                                            {
                                                id: 'aboutus',
                                                name: intl.formatMessage({
                                                    defaultMessage: 'About Us',
                                                    description: 'drawer_menu.link.about_us'
                                                })
                                            }
                                        ],
                                        name: intl.formatMessage({
                                            defaultMessage: 'Our Company',
                                            description: 'drawer_menu.link.our_company'
                                        })
                                    },
                                    {
                                        id: 'privacyandsecurity',
                                        items: [
                                            {
                                                id: 'termsandconditions',
                                                name: intl.formatMessage({
                                                    defaultMessage: 'Terms & Conditions',
                                                    description:
                                                        'drawer_menu.link.terms_and_conditions'
                                                })
                                            },
                                            {
                                                id: 'privacypolicy',
                                                name: intl.formatMessage({
                                                    defaultMessage: 'Privacy Policy',
                                                    description: 'drawer_menu.link.privacy_policy'
                                                })
                                            },
                                            {
                                                id: 'sitemap',
                                                name: intl.formatMessage({
                                                    defaultMessage: 'Site Map',
                                                    description: 'drawer_menu.link.site_map'
                                                })
                                            }
                                        ],
                                        name: intl.formatMessage({
                                            defaultMessage: 'Privacy & Security',
                                            description: 'drawer_menu.link.privacy_and_security'
                                        })
                                    }
                                ]
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
    onLogoClick: PropTypes.func
}

export default DrawerMenu
