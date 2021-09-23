/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Text,
    Divider,
    SimpleGrid,
    useMultiStyleConfig,
    StylesProvider,
    Select,
    useStyles,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Button,
    FormControl
} from '@chakra-ui/react'
import {useIntl} from 'react-intl'

import LinksList from '../links-list'
import SocialIcons from '../social-icons'
import {HideOnDesktop, HideOnMobile} from '../responsive'
import {defaultLocaleMessages} from '../_app'
import {SUPPORTED_LOCALES} from '../../constants'
import {buildUrlLocale} from '../../utils/url'

const Footer = ({...otherProps}) => {
    const styles = useMultiStyleConfig('Footer')
    const intl = useIntl()

    return (
        <Box as="footer" {...styles.container} {...otherProps}>
            <Box {...styles.content}>
                <StylesProvider value={styles}>
                    <HideOnMobile>
                        <SimpleGrid columns={4} spacing={3}>
                            <LinksList
                                heading={intl.formatMessage({
                                    defaultMessage: 'Customer Support',
                                    description: 'footer.column.customer_support'
                                })}
                                links={[
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            defaultMessage: 'Contact Us',
                                            description: 'footer.link.contact_us'
                                        })
                                    },
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            defaultMessage: 'Shipping',
                                            description: 'footer.link.shipping'
                                        })
                                    }
                                ]}
                            />
                            <LinksList
                                heading={intl.formatMessage({
                                    defaultMessage: 'Account',
                                    description: 'footer.column.account'
                                })}
                                links={[
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            defaultMessage: 'Order Status',
                                            description: 'footer.link.order_status'
                                        })
                                    },
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            defaultMessage: 'Sign in or Create Account',
                                            description: 'footer.link.sign_in_or_create_account'
                                        })
                                    }
                                ]}
                            />
                            <LinksList
                                heading={intl.formatMessage({
                                    defaultMessage: 'Our Company',
                                    description: 'footer.column.our_company'
                                })}
                                links={[
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            defaultMessage: 'Store Locator',
                                            description: 'footer.link.store_locator'
                                        })
                                    },
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            defaultMessage: 'About Us',
                                            description: 'footer.link.about_us'
                                        })
                                    }
                                ]}
                            />
                            <Box>
                                <Subscribe />
                            </Box>
                        </SimpleGrid>
                    </HideOnMobile>

                    <HideOnDesktop>
                        <Subscribe />
                    </HideOnDesktop>

                    <Box {...styles.localeSelector}>
                        <FormControl
                            data-testid="sf-footer-locale-selector"
                            id="locale_selector"
                            width="auto"
                            {...otherProps}
                        >
                            <Select
                                value={intl.locale}
                                onChange={({target}) => {
                                    // Update the `locale` in the URL.
                                    const newUrl = buildUrlLocale(intl.locale, target.value)
                                    window.location = newUrl
                                }}
                                variant="filled"
                                {...styles.localeDropdown}
                            >
                                {SUPPORTED_LOCALES.map((locale) => (
                                    <option key={locale} value={locale}>
                                        {intl.formatMessage(defaultLocaleMessages[locale])}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider {...styles.horizontalRule} />

                    <Box {...styles.bottomHalf}>
                        <Text {...styles.copyright}>
                            &copy;{' '}
                            {intl.formatMessage({
                                defaultMessage:
                                    '2021 Salesforce or its affiliates. All rights reserved. This is a demo store only. Orders made WILL NOT be processed.',
                                description: 'footer.message.copyright'
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

    return (
        <Box {...styles.subscribe} {...otherProps}>
            <Heading {...styles.subscribeHeading}>
                {intl.formatMessage({
                    defaultMessage: 'Be the first to know',
                    description: 'footer.subscribe.heading.first_to_know'
                })}
            </Heading>
            <Text {...styles.subscribeMessage}>
                {intl.formatMessage({
                    defaultMessage: 'Sign up to stay in the loop about the hottest deals',
                    description: 'footer.subscribe.description.sign_up'
                })}
            </Text>

            <Box>
                <InputGroup>
                    <Input type="email" placeholder="you@email.com" {...styles.subscribeField} />
                    <InputRightElement {...styles.subscribeButtonContainer}>
                        <Button variant="footer">
                            {intl.formatMessage({
                                defaultMessage: 'Sign Up',
                                description: 'footer.subscribe.button.sign_up'
                            })}
                        </Button>
                    </InputRightElement>
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
                        defaultMessage: 'Terms & Conditions',
                        description: 'footer.link.terms_conditions'
                    })
                },
                {
                    href: '/',
                    text: intl.formatMessage({
                        defaultMessage: 'Privacy Policy',
                        description: 'footer.link.privacy_policy'
                    })
                },
                {
                    href: '/',
                    text: intl.formatMessage({
                        defaultMessage: 'Site Map',
                        description: 'footer.link.site_map'
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
