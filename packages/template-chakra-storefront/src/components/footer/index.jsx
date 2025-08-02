/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo, useState} from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    Flex,
    GridItem,
    Heading,
    Input,
    NativeSelect,
    Separator,
    SimpleGrid,
    Text,
    useSlotRecipe
} from '@chakra-ui/react'
import {useIntl} from 'react-intl'

import LinksList from '../../components/links-list'
import SocialIcons from '../../components/social-icons'
import {getPathWithLocale} from '../../utils/url'
import LocaleText from '../../components/locale-text'
import useMultiSite from '../../hooks/use-multi-site'
import {useMarketingConsent} from '../../hooks'
import {CONSENT_CHANNELS, CONSENT_STATUS, CONSENT_TAGS} from '../../constants/marketing-consent'

const Footer = ({...otherProps}) => {
    const recipe = useSlotRecipe({key: 'footer'})
    const styles = recipe()
    const intl = useIntl()
    const {formatMessage} = intl
    const [locale, setLocale] = useState(intl.locale)
    const {site, buildUrl} = useMultiSite()
    const {l10n} = site
    const supportedLocaleIds = l10n?.supportedLocales.map((locale) => locale.id)
    const showLocaleSelector = supportedLocaleIds?.length > 1

    const messages = useMemo(
        () => ({
            columns: {
                customerSupport: formatMessage({
                    id: 'footer.column.customer_support',
                    defaultMessage: 'Customer Support'
                }),
                account: formatMessage({
                    id: 'footer.column.account',
                    defaultMessage: 'Account'
                }),
                ourCompany: formatMessage({
                    id: 'footer.column.our_company',
                    defaultMessage: 'Our Company'
                })
            },
            links: {
                aboutUs: formatMessage({
                    id: 'footer.link.about_us',
                    defaultMessage: 'About Us'
                }),
                contactUs: formatMessage({
                    id: 'footer.link.contact_us',
                    defaultMessage: 'Contact Us'
                }),
                shipping: formatMessage({
                    id: 'footer.link.shipping',
                    defaultMessage: 'Shipping'
                }),
                orderStatus: formatMessage({
                    id: 'footer.link.order_status',
                    defaultMessage: 'Order Status'
                }),
                signinCreateAccount: formatMessage({
                    id: 'footer.link.signin_create_account',
                    defaultMessage: 'Sign in or create account'
                })
            },
            localeSelector: formatMessage({
                id: 'footer.locale_selector.assistive_msg',
                defaultMessage: 'Select Language'
            }),
            copyright: formatMessage({
                id: 'footer.message.copyright',
                defaultMessage:
                    'Salesforce or its affiliates. All rights reserved. This is a demo store only. Orders made WILL NOT be processed.'
            })
        }),
        [intl]
    )

    const makeOurCompanyLinks = () => {
        const links = []
        links.push({
            href: '/',
            text: messages.links.aboutUs
        })
        return links
    }

    return (
        <Box asChild css={styles.container} {...otherProps}>
            <footer>
                <Box css={styles.content} asChild>
                    <section>
                        <SimpleGrid columns={{base: 1, lg: 4}} gap={{base: 0, lg: 3}}>
                            <GridItem colSpan={{base: 1, md: 3}}>
                                <SimpleGrid
                                    columns={{base: 1, lg: 3}}
                                    gap={{base: 0, lg: 3}}
                                    display={{base: 'none', lg: 'grid'}}
                                >
                                    <LinksList
                                        heading={messages.columns.customerSupport}
                                        links={[
                                            {
                                                href: '/',
                                                text: messages.links.contactUs
                                            },
                                            {
                                                href: '/',
                                                text: messages.links.shipping
                                            }
                                        ]}
                                    />
                                    <LinksList
                                        heading={messages.columns.account}
                                        links={[
                                            {
                                                href: '/',
                                                text: messages.links.orderStatus
                                            },
                                            {
                                                href: '/',
                                                text: messages.links.signinCreateAccount
                                            }
                                        ]}
                                    />
                                    <LinksList
                                        heading={messages.columns.ourCompany}
                                        links={makeOurCompanyLinks()}
                                    />
                                </SimpleGrid>
                            </GridItem>
                            <GridItem colSpan={{base: 1, md: 1}}>
                                <Subscribe />
                            </GridItem>
                        </SimpleGrid>
                        {showLocaleSelector && (
                            <Box
                                data-testid="sf-footer-locale-selector"
                                id="locale_selector"
                                css={styles.localeSelectorWrapper}
                                {...otherProps}
                            >
                                <NativeSelect.Root css={styles.localeSelectorRoot} variant="filled">
                                    <NativeSelect.Field
                                        css={styles.localeSelectorField}
                                        defaultValue={locale}
                                        aria-label={messages.localeSelector}
                                        onChange={(e) => {
                                            const newLocale = e.currentTarget.value
                                            setLocale(newLocale)
                                            // Update the `locale` in the URL.
                                            window.location = getPathWithLocale(
                                                newLocale,
                                                buildUrl,
                                                {
                                                    disallowParams: ['refine']
                                                }
                                            )
                                        }}
                                    >
                                        {supportedLocaleIds.map((locale) => (
                                            <option key={locale} value={locale}>
                                                <LocaleText shortCode={locale} />
                                            </option>
                                        ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Box>
                        )}
                        <Separator css={styles.horizontalRule} />
                        <Box css={styles.legalSection}>
                            <Text css={styles.copyright}>
                                &copy; {new Date().getFullYear()} {messages.copyright}
                            </Text>

                            <LegalLinks variant={{base: 'vertical', lg: 'horizontal'}} />
                        </Box>
                    </section>
                </Box>
            </footer>
        </Box>
    )
}

export default Footer

const Subscribe = ({...otherProps}) => {
    const recipe = useSlotRecipe({key: 'footer'})
    const styles = recipe()
    const intl = useIntl()
    const {formatMessage} = intl
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')
    const {fetchConsentItems, submitConsent, isLoading} = useMarketingConsent()
    const PAGE_TAG = CONSENT_TAGS.HOMEPAGE_BANNER
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/

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
                status: CONSENT_STATUS.OPT_IN
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

    const messages = useMemo(
        () => ({
            heading: formatMessage({
                id: 'footer.subscribe.heading.first_to_know',
                defaultMessage: 'Be the first to know'
            }),
            description: formatMessage({
                id: 'footer.subscribe.description.sign_up',
                defaultMessage: 'Sign up to stay in the loop about the hottest deals'
            }),
            emailAriaLabel: formatMessage({
                id: 'footer.subscribe.email.assistive_msg',
                defaultMessage: 'Email address for newsletter'
            }),
            buttonSignUp: formatMessage({
                id: 'footer.subscribe.button.sign_up',
                defaultMessage: 'Sign Up'
            })
        }),
        [intl]
    )

    return (
        <Box css={styles.subscribe} {...otherProps}>
            <Heading as="h1" css={styles.subscribeHeading}>
                {messages.heading}
            </Heading>
            <Text css={styles.subscribeMessage}>{messages.description}</Text>

            {message && (
                <Alert.Root status={messageType} mb={4} borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Description>{message}</Alert.Description>
                </Alert.Root>
            )}

            <Box>
                <Flex w="full" maxW="sm">
                    <Input
                        type="email"
                        placeholder="you@email.com"
                        aria-label={messages.emailAriaLabel}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isLoading) {
                                handleSignUp()
                            }
                        }}
                        disabled={isLoading}
                        id="subscribe-email"
                        css={styles.subscribeField}
                        borderEndEndRadius={0}
                        borderStartEndRadius={0}
                        bg="white"
                        _focus={{bg: 'white'}}
                        _hover={{bg: 'white'}}
                        _filled={{bg: 'white'}}
                    />
                    <Button
                        variant="footer"
                        onClick={handleSignUp}
                        loading={isLoading}
                        borderEndStartRadius={0}
                        borderStartStartRadius={0}
                    >
                        {messages.buttonSignUp}
                    </Button>
                </Flex>
            </Box>

            <SocialIcons variant="flex-start" pinterestInnerColor="black" />
        </Box>
    )
}

const LegalLinks = ({variant}) => {
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            termsConditions: formatMessage({
                id: 'footer.link.terms_conditions',
                defaultMessage: 'Terms & Conditions'
            }),
            privacyPolicy: formatMessage({
                id: 'footer.link.privacy_policy',
                defaultMessage: 'Privacy Policy'
            }),
            siteMap: formatMessage({
                id: 'footer.link.site_map',
                defaultMessage: 'Site Map'
            })
        }),
        [intl]
    )

    return (
        <LinksList
            links={[
                {
                    href: '/',
                    text: messages.termsConditions
                },
                {
                    href: '/',
                    text: messages.privacyPolicy
                },
                {
                    href: '/',
                    text: messages.siteMap
                }
            ]}
            color="gray.200"
            variant={variant}
        />
    )
}
LegalLinks.propTypes = {
    variant: PropTypes.oneOfType([PropTypes.oneOf(['vertical', 'horizontal']), PropTypes.object])
}
