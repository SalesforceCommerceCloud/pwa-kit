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
    Button,
    GridItem,
    Group,
    Heading,
    Input,
    Separator,
    SimpleGrid,
    NativeSelect,
    Text,

    // hooks
    useSlotRecipe
} from '@chakra-ui/react'
import {useIntl} from 'react-intl'

import LinksList from '../../components/links-list'
import SocialIcons from '../../components/social-icons'
import {getPathWithLocale} from '../../utils/url'
import LocaleText from '../../components/locale-text'
import useMultiSite from '../../hooks/use-multi-site'

const Footer = ({...otherProps}) => {
    const recipe = useSlotRecipe({key: 'footer'})
    const styles = recipe()
    const intl = useIntl()
    const [locale, setLocale] = useState(intl.locale)
    const {site, buildUrl} = useMultiSite()
    const {l10n} = site
    const supportedLocaleIds = l10n?.supportedLocales.map((locale) => locale.id)
    const showLocaleSelector = supportedLocaleIds?.length > 1

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
                                        aria-label={intl.formatMessage({
                                            id: 'footer.locale_selector.assistive_msg',
                                            defaultMessage: 'Select Language'
                                        })}
                                        onChange={(e) => {
                                            const newLocale = e.currentTarget.value
                                            setLocale(newLocale)
                                            // Update the `locale` in the URL.
                                            const newUrl = getPathWithLocale(newLocale, buildUrl, {
                                                disallowParams: ['refine']
                                            })
                                            window.location = newUrl
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
                                &copy; {new Date().getFullYear()}{' '}
                                {intl.formatMessage({
                                    id: 'footer.message.copyright',
                                    defaultMessage:
                                        'Salesforce or its affiliates. All rights reserved. This is a demo store only. Orders made WILL NOT be processed.'
                                })}
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
    return (
        <Box css={styles.subscribe} {...otherProps}>
            <Heading as="h1" css={styles.subscribeHeading}>
                {intl.formatMessage({
                    id: 'footer.subscribe.heading.first_to_know',
                    defaultMessage: 'Be the first to know'
                })}
            </Heading>
            <Text css={styles.subscribeMessage}>
                {intl.formatMessage({
                    id: 'footer.subscribe.description.sign_up',
                    defaultMessage: 'Sign up to stay in the loop about the hottest deals'
                })}
            </Text>

            <Box>
                <Group attached w="full" maxW="sm">
                    <Input
                        type="email"
                        placeholder="you@email.com"
                        aria-label={intl.formatMessage({
                            id: 'footer.subscribe.email.assistive_msg',
                            defaultMessage: 'Email address for newsletter'
                        })}
                        id="subscribe-email"
                        css={styles.subscribeField}
                    />
                    <Button variant="footer">
                        {intl.formatMessage({
                            id: 'footer.subscribe.button.sign_up',
                            defaultMessage: 'Sign Up'
                        })}
                    </Button>
                </Group>
            </Box>

            <SocialIcons variant="flex-start" pinterestInnerColor="black" />
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
    variant: PropTypes.oneOfType([PropTypes.oneOf(['vertical', 'horizontal']), PropTypes.object])
}
