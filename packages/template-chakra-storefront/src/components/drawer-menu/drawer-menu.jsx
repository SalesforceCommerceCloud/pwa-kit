/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Project Components
import LocaleSelector from '../../components/locale-selector'
import NestedAccordion from '../../components/nested-accordion'
import SocialIcons from '../../components/social-icons'

// Components
import {
    Box,
    Accordion,
    Button,
    Center,
    CloseButton,
    Dialog,
    HStack,
    IconButton,
    Separator,
    Spinner,
    Text,
    VStack,

    // Hooks
    useBreakpointValue,
    useSlotRecipe
} from '@chakra-ui/react'
import {AuthHelpers, useAuthHelper, useCustomerType} from '@salesforce/commerce-sdk-react'
import Link from '../../components/link'
// Icons
import {BrandLogo, SignoutIcon, UserIcon} from '../../components/icons'

// Others
import {noop} from '../../utils/utils'
import {getPathWithLocale, categoryUrlBuilder} from '../../utils/url'
import LoadingSpinner from '../../components/loading-spinner'

import useNavigation from '../../hooks/use-navigation'
import useMultiSite from '../../hooks/use-multi-site'

// Project Components
import Fade from '../../components/fade'

// The FONT_SIZES and FONT_WEIGHTS constants are used to control the styling for
// the accordion buttons as their current depth. In the below definition we assign
// values for depths 0 - 3, any depth deeper than that will use the default styling.
const FONT_SIZES = ['lg', 'md', 'md']
const FONT_WEIGHTS = ['semibold', 'semibold', 'regular']
const PHONE_DRAWER_SIZE = 'xs'
const TABLET_DRAWER_SIZE = 'lg'

const DrawerSeparator = () => (
    <Box paddingTop="6" paddingBottom="6">
        <Separator />
    </Box>
)

// CUSTOMIZE YOUR NAVIGATION BY ALTERING THESE VALUES
const SIGN_IN_HREF = '/login'

/**
 * This is the navigation component used for mobile devices (phone and tablet). It's
 * main usage is to navigate from one category to the next, but also homes links to
 * support, log in and out actions, as support links.
 */
const DrawerMenu = ({
    root,
    itemsKey,
    itemsCountKey,
    isOpen,
    onClose = noop,
    onLogoClick = noop,
    itemComponent
}) => {
    const intl = useIntl()
    const {formatMessage} = intl
    const {isRegistered} = useCustomerType()
    const navigate = useNavigation()
    const drawerSize = useBreakpointValue({sm: PHONE_DRAWER_SIZE, md: TABLET_DRAWER_SIZE})
    const socialIconVariant = useBreakpointValue({base: 'flex', md: 'flex-start'})
    const {site, buildUrl} = useMultiSite()
    const {l10n} = site
    const [showLoading, setShowLoading] = useState(false)
    const [ariaBusy, setAriaBusy] = useState('true')
    const logout = useAuthHelper(AuthHelpers.Logout)
    const recipe = useSlotRecipe({key: 'drawerMenu'})
    const styles = recipe()

    const messages = useMemo(
        () => ({
            header: {
                title: intl.formatMessage({
                    id: 'drawer_menu.header.assistive_msg.title',
                    defaultMessage: 'Menu Drawer'
                })
            },
            links: {
                shopAll: intl.formatMessage({
                    id: 'drawer_menu.link.shop_all',
                    defaultMessage: 'Shop All'
                }),
                signIn: intl.formatMessage({
                    id: 'drawer_menu.link.sign_in',
                    defaultMessage: 'Sign In'
                })
            },
            buttons: {
                logOut: intl.formatMessage({
                    id: 'drawer_menu.button.log_out',
                    defaultMessage: 'Log Out'
                }),
                myAccount: intl.formatMessage({
                    id: 'drawer_menu.button.my_account',
                    defaultMessage: 'My Account'
                }),
                accountDetails: intl.formatMessage({
                    id: 'drawer_menu.button.account_details',
                    defaultMessage: 'Account Details'
                }),
                orderHistory: intl.formatMessage({
                    id: 'drawer_menu.button.order_history',
                    defaultMessage: 'Order History'
                }),
                addresses: intl.formatMessage({
                    id: 'drawer_menu.button.addresses',
                    defaultMessage: 'Addresses'
                })
            },
            customerSupport: {
                title: intl.formatMessage({
                    id: 'drawer_menu.link.customer_support',
                    defaultMessage: 'Customer Support'
                }),
                contactUs: intl.formatMessage({
                    id: 'drawer_menu.link.customer_support.contact_us',
                    defaultMessage: 'Contact Us'
                }),
                shippingAndReturns: intl.formatMessage({
                    id: 'drawer_menu.link.customer_support.shipping_and_returns',
                    defaultMessage: 'Shipping & Returns'
                })
            },
            ourCompany: {
                title: intl.formatMessage({
                    id: 'drawer_menu.link.our_company',
                    defaultMessage: 'Our Company'
                }),
                aboutUs: intl.formatMessage({
                    id: 'drawer_menu.link.about_us',
                    defaultMessage: 'About Us'
                })
            },
            privacyAndSecurity: {
                title: intl.formatMessage({
                    id: 'drawer_menu.link.privacy_and_security',
                    defaultMessage: 'Privacy & Security'
                }),
                termsAndConditions: intl.formatMessage({
                    id: 'drawer_menu.link.terms_and_conditions',
                    defaultMessage: 'Terms & Conditions'
                }),
                privacyPolicy: intl.formatMessage({
                    id: 'drawer_menu.link.privacy_policy',
                    defaultMessage: 'Privacy Policy'
                }),
                siteMap: intl.formatMessage({
                    id: 'drawer_menu.link.site_map',
                    defaultMessage: 'Site Map'
                })
            }
        }),
        [intl]
    )

    const onSignoutClick = async () => {
        setShowLoading(true)
        await logout.mutateAsync()
        navigate('/login')
        setShowLoading(false)
    }

    const supportedLocaleIds = l10n?.supportedLocales.map((locale) => locale.id)
    const showLocaleSelector = supportedLocaleIds?.length > 1

    useEffect(() => {
        setAriaBusy('false')
    }, [])

    return (
        <Dialog.Root
            css={styles.root}
            open={isOpen}
            onOpenChange={onClose}
            placement="left"
            motionPreset="slide-in-left"
            size={drawerSize}
            scrollBehavior="inside"
        >
            <Dialog.Backdrop css={styles.backdrop} />
            <Dialog.Positioner style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
                <Dialog.Content css={styles.content}>
                    {/* Header Content */}
                    <Dialog.Header css={styles.header} aria-label={messages.header.title}>
                        <IconButton variant="unstyled" onClick={onLogoClick}>
                            <BrandLogo css={styles.logo} />
                        </IconButton>
                    </Dialog.Header>

                    {/* Main Content */}
                    <Dialog.Body css={styles.body}>
                        <Box
                            id="category-nav"
                            aria-live="polite"
                            aria-busy={ariaBusy}
                            aria-atomic="true"
                        >
                            {showLoading && <LoadingSpinner />}

                            {/* Category Navigation */}
                            {root?.[itemsKey] ? (
                                <Fade in={true}>
                                    <NestedAccordion
                                        multiple={true}
                                        item={root}
                                        itemsCountKey={itemsCountKey}
                                        itemsKey={itemsKey}
                                        itemsFilter="c_showInMenu"
                                        fontSizes={FONT_SIZES}
                                        fontWeights={FONT_WEIGHTS}
                                        itemsBefore={({depth, item}) =>
                                            depth > 0
                                                ? [
                                                      <Accordion.Item border="none" key="show-all">
                                                          <Accordion.ItemTrigger
                                                              paddingLeft={8}
                                                              as={Link}
                                                              to={categoryUrlBuilder(item)}
                                                              fontSize={FONT_SIZES[depth]}
                                                              fontWeight={FONT_WEIGHTS[depth]}
                                                              color="black"
                                                          >
                                                              {messages.links.shopAll}
                                                          </Accordion.ItemTrigger>
                                                      </Accordion.Item>
                                                  ]
                                                : []
                                        }
                                        urlBuilder={categoryUrlBuilder}
                                        itemComponent={itemComponent}
                                    />
                                </Fade>
                            ) : (
                                <Center p="8">
                                    <Spinner size="xl" />
                                </Center>
                            )}
                        </Box>

                        <DrawerSeparator />

                        {/* Application Actions */}
                        <VStack align="stretch" gap={0} px={4}>
                            <Box>
                                {isRegistered ? (
                                    <NestedAccordion
                                        urlBuilder={(item, locale) =>
                                            `/${locale}/account${item.path}`
                                        }
                                        itemsAfter={({depth}) =>
                                            depth === 1 && (
                                                <Button
                                                    variant="ghost"
                                                    css={styles.signoutButton}
                                                    onClick={onSignoutClick}
                                                >
                                                    <SignoutIcon
                                                        aria-hidden={true}
                                                        boxSize={5}
                                                        css={styles.signoutIcon}
                                                    />
                                                    <Text css={styles.signoutText} as="span">
                                                        {messages.buttons.logOut}
                                                    </Text>
                                                </Button>
                                            )
                                        }
                                        item={{
                                            id: 'root',
                                            items: [
                                                {
                                                    id: 'my-account',
                                                    name: messages.buttons.myAccount,
                                                    items: [
                                                        {
                                                            id: 'profile',
                                                            path: '',
                                                            name: messages.buttons.accountDetails
                                                        },
                                                        {
                                                            id: 'orders',
                                                            path: '/orders',
                                                            name: messages.buttons.orderHistory
                                                        },
                                                        {
                                                            id: 'addresses',
                                                            path: '/addresses',
                                                            name: messages.buttons.addresses
                                                        }
                                                    ]
                                                }
                                            ]
                                        }}
                                    />
                                ) : (
                                    <Link to={SIGN_IN_HREF}>
                                        <HStack>
                                            <UserIcon css={styles.icon} />{' '}
                                            <Text>{messages.links.signIn}</Text>
                                        </HStack>
                                    </Link>
                                )}
                            </Box>
                            {showLocaleSelector && (
                                <Box>
                                    <LocaleSelector
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

                        <DrawerSeparator />

                        {/* Support Links */}
                        <NestedAccordion
                            multiple={true}
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
                                                name: messages.customerSupport.contactUs
                                            },
                                            {
                                                id: 'shippingandreturns',
                                                name: messages.customerSupport.shippingAndReturns
                                            }
                                        ],
                                        name: messages.customerSupport.title
                                    },
                                    {
                                        id: 'ourcompany',
                                        items: [
                                            {
                                                id: 'aboutus',
                                                name: messages.ourCompany.aboutUs
                                            }
                                        ],
                                        name: messages.ourCompany.title
                                    },
                                    {
                                        id: 'privacyandsecurity',
                                        items: [
                                            {
                                                id: 'termsandconditions',
                                                name: messages.privacyAndSecurity.termsAndConditions
                                            },
                                            {
                                                id: 'privacypolicy',
                                                name: messages.privacyAndSecurity.privacyPolicy
                                            },
                                            {
                                                id: 'sitemap',
                                                name: messages.privacyAndSecurity.siteMap
                                            }
                                        ],
                                        name: messages.privacyAndSecurity.title
                                    }
                                ]
                            }}
                        />

                        <DrawerSeparator />
                    </Dialog.Body>

                    <Dialog.Footer css={styles.footer}>
                        <SocialIcons variant={socialIconVariant} />
                    </Dialog.Footer>

                    <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" css={styles.closeButton} />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}

DrawerMenu.displayName = 'DrawerMenu'

DrawerMenu.propTypes = {
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
    /**
     * Customize the property representing the items.
     */
    itemsKey: PropTypes.string,
    /**
     * Cusomtize the property representing the items count.
     */
    itemsCountKey: PropTypes.string,
    /**
     * Component to be rendered for each individual menu item.
     */
    itemComponent: PropTypes.elementType
}

export {DrawerMenu}
