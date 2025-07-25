/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Text,
    Divider,
    SimpleGrid,
    useMultiStyleConfig,
    Select as ChakraSelect,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    createStylesContext,
    Button,
    FormControl,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react'
import {useIntl} from 'react-intl'

import LinksList from '../links-list'
import SocialIcons from '../social-icons'
import {HideOnDesktop, HideOnMobile} from '../responsive'
import {getPathWithLocale} from '../../utils/url'
import LocaleText from '../locale-text'
import useMultiSite from '../../hooks/use-multi-site'
import {useMarketingConsent} from '../../hooks/use-marketing-consent'
import {CONSENT_STATUS, CONSENT_CHANNELS, CONSENT_TAGS} from '../../constants/marketing-consent'
import styled from '@emotion/styled'

const [StylesProvider, useStyles] = createStylesContext('Footer')
const Footer = ({...otherProps}) => {
    const styles = useMultiStyleConfig('Footer')
    const intl = useIntl()
    const [locale, setLocale] = useState(intl.locale)
    const {site, buildUrl} = useMultiSite()
    const {l10n} = site
    const supportedLocaleIds = l10n?.supportedLocales.map((locale) => locale.id)
    const showLocaleSelector = supportedLocaleIds?.length > 1

    // NOTE: this is a workaround to fix hydration error, by making sure that the `option.selected` property is set.
    // For some reason, adding some styles prop (to the option element) prevented `selected` from being set.
    // So now we add the styling to the parent element instead.
    const Select = styled(ChakraSelect)({
        // Targeting the child element
        option: styles.localeDropdownOption
    })
    const makeOurCompanyLinks = () => {
        const links = []
        links.push({
            href: '/',
            text: intl.formatMessage({
                id: 'footer.link.about_us',
                defaultMessage: 'About Us'
            })
        })
        return links
    }

    return (
        <Box as="footer" {...styles.container} {...otherProps}>
            <Box {...styles.content} as="section">
                <StylesProvider value={styles}>
                    <HideOnMobile>
                        <SimpleGrid columns={4} spacing={3}>
                            <LinksList
                                heading={intl.formatMessage({
                                    id: 'footer.column.customer_support',
                                    defaultMessage: 'Customer Support'
                                })}
                                links={[
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            id: 'footer.link.contact_us',
                                            defaultMessage: 'Contact Us'
                                        })
                                    },
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            id: 'footer.link.shipping',
                                            defaultMessage: 'Shipping'
                                        })
                                    }
                                ]}
                            />
                            <LinksList
                                heading={intl.formatMessage({
                                    id: 'footer.column.account',
                                    defaultMessage: 'Account'
                                })}
                                links={[
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            id: 'footer.link.order_status',
                                            defaultMessage: 'Order Status'
                                        })
                                    },
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            id: 'footer.link.signin_create_account',
                                            defaultMessage: 'Sign in or create account'
                                        })
                                    }
                                ]}
                            />
                            <LinksList
                                heading={intl.formatMessage({
                                    id: 'footer.column.our_company',
                                    defaultMessage: 'Our Company'
                                })}
                                links={makeOurCompanyLinks()}
                            />
                            <Box>
                                <Subscribe />
                            </Box>
                        </SimpleGrid>
                    </HideOnMobile>

                    <HideOnDesktop>
                        <Subscribe />
                    </HideOnDesktop>

                    {showLocaleSelector && (
                        <Box {...styles.localeSelector}>
                            <FormControl
                                data-testid="sf-footer-locale-selector"
                                id="locale_selector"
                                width="auto"
                                {...otherProps}
                            >
                                <Select
                                    defaultValue={locale}
                                    onChange={({target}) => {
                                        setLocale(target.value)

                                        // Update the `locale` in the URL.
                                        const newUrl = getPathWithLocale(target.value, buildUrl, {
                                            disallowParams: ['refine']
                                        })

                                        window.location = newUrl
                                    }}
                                    variant="filled"
                                    aria-label={intl.formatMessage({
                                        id: 'footer.locale_selector.assistive_msg',
                                        defaultMessage: 'Select Language'
                                    })}
                                    {...styles.localeDropdown}
                                >
                                    {supportedLocaleIds.map((locale) => (
                                        <option key={locale} value={locale}>
                                            <LocaleText shortCode={locale} />
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    <Divider {...styles.horizontalRule} />

                    <Box {...styles.bottomHalf}>
                        <Text {...styles.copyright}>
                            &copy; {new Date().getFullYear()}{' '}
                            {intl.formatMessage({
                                id: 'footer.message.copyright',
                                defaultMessage:
                                    'Salesforce or its affiliates. All rights reserved. This is a demo store only. Orders made WILL NOT be processed.'
                            })}
                        </Text>

                        <HideOnDesktop>
                            <LegalLinks variant="vertical" />
                        </HideOnDesktop>
                        <HideOnMobile>
                            <LegalLinks variant="horizontal" />
                        </HideOnMobile>
                    </Box>
                </StylesProvider>
            </Box>
        </Box>
    )
}

export default Footer

const Subscribe = ({...otherProps}) => {
    const styles = useStyles()
    const intl = useIntl()
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')
    const {fetchConsentItems, submitConsent, isLoading} = useMarketingConsent()
    const PAGE_TAG = CONSENT_TAGS.HOMEPAGE_BANNER
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const handleSignUp = async () => {
        if (!email) {
            setMessage('Please enter your email address')
            setMessageType('error')
            return
        }

        // Basic email validation
        if (!EMAIL_REGEX.test(email)) {
            setMessage('Please enter a valid email address')
            setMessageType('error')
            return
        }

        try {
            setMessage(null)

            // Fetch consent items with HOMEPAGE_BANNER tag
            const consentData = await fetchConsentItems(PAGE_TAG)

            // Filter items that have HOMEPAGE_BANNER in their tags
            const homepageBannerItems =
                consentData.data?.filter((item) => item.tags?.includes(PAGE_TAG)) || []

            if (homepageBannerItems.length === 0) {
                setMessage('No subscription options available at this time')
                setMessageType('error')
                return
            }

            // Use the first available consent item for submission
            // (There may be one or more subscriptionIds available for a single channel.)
            const firstConsentItem = homepageBannerItems[0]
            const consentItem = {
                subscriptionId: firstConsentItem.subscriptionId,
                contactPointValue: email,
                channel: CONSENT_CHANNELS.EMAIL,
                consent: CONSENT_STATUS.OPT_IN
            }

            // Submit the consent
            const result = await submitConsent(consentItem)

            // Check if the submission was successful
            if (result?.status === CONSENT_STATUS.OPT_IN) {
                setMessage('Thank you for subscribing! You will receive our latest updates.')
                setMessageType('success')
                setEmail('')
            } else {
                setMessage('Subscription failed. Please try again later.')
                setMessageType('error')
            }
        } catch (error) {
            console.error('Subscription error:', error)
            setMessage('Something went wrong. Please try again later.')
            setMessageType('error')
        }
    }

    return (
        <Box {...styles.subscribe} {...otherProps}>
            <Heading as="h1" {...styles.subscribeHeading}>
                {intl.formatMessage({
                    id: 'footer.subscribe.heading.first_to_know',
                    defaultMessage: 'Be the first to know'
                })}
            </Heading>
            <Text {...styles.subscribeMessage}>
                {intl.formatMessage({
                    id: 'footer.subscribe.description.sign_up',
                    defaultMessage: 'Sign up to stay in the loop about the hottest deals'
                })}
            </Text>

            {message && (
                <Alert status={messageType} mb={4} borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            )}

            <Box>
                <InputGroup>
                    {/* Had to swap the following InputRightElement and Input
                        to avoid the hydration error due to mismatched html between server and client side.
                        This is a workaround for Lastpass plugin that automatically injects its icon for input fields.
                    */}
                    <InputRightElement {...styles.subscribeButtonContainer}>
                        <Button
                            variant="footer"
                            onClick={handleSignUp}
                            isLoading={isLoading}
                            loadingText="Signing Up"
                        >
                            {intl.formatMessage({
                                id: 'footer.subscribe.button.sign_up',
                                defaultMessage: 'Sign Up'
                            })}
                        </Button>
                    </InputRightElement>
                    <Input
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSignUp()
                            }
                        }}
                        aria-label={intl.formatMessage({
                            id: 'footer.subscribe.email.assistive_msg',
                            defaultMessage: 'Email address for newsletter'
                        })}
                        id="subscribe-email"
                        {...styles.subscribeField}
                    />
                </InputGroup>
            </Box>

            <SocialIcons variant="flex-start" pinterestInnerColor="black" {...styles.socialIcons} />
        </Box>
    )
}

const LegalLinks = ({variant}) => {
    const intl = useIntl()
    return (
        <LinksList
            links={[
                {
                    href: '/',
                    text: intl.formatMessage({
                        id: 'footer.link.terms_conditions',
                        defaultMessage: 'Terms & Conditions'
                    })
                },
                {
                    href: '/',
                    text: intl.formatMessage({
                        id: 'footer.link.privacy_policy',
                        defaultMessage: 'Privacy Policy'
                    })
                },
                {
                    href: '/',
                    text: intl.formatMessage({
                        id: 'footer.link.site_map',
                        defaultMessage: 'Site Map'
                    })
                }
            ]}
            color="gray.200"
            variant={variant}
        />
    )
}
LegalLinks.propTypes = {
    variant: PropTypes.oneOf(['vertical', 'horizontal'])
}
