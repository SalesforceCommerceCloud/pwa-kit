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

import LinksList from 'retail-react-app/app/components/links-list'
import SocialIcons from 'retail-react-app/app/components/social-icons'
import {HideOnDesktop, HideOnMobile} from 'retail-react-app/app/components/responsive'
import {getPathWithLocale} from 'retail-react-app/app/utils/url'
import LocaleText from 'retail-react-app/app/components/locale-text'
import useMultiSite from 'retail-react-app/app/hooks/use-multi-site'
import {useCategory} from 'commerce-sdk-react-preview'
// NOTE: IDE didn't add the carrot sign
import {CAT_MENU_DEFAULT_NAV_SSR_DEPTH, CAT_MENU_DEFAULT_ROOT_CATEGORY} from "retail-react-app/app/constants"

const Footer = ({...otherProps}) => {
    const styles = useMultiStyleConfig('Footer')
    const intl = useIntl()
    const [locale, setLocale] = useState(intl.locale)
    const {site, buildUrl} = useMultiSite()
    const {l10n} = site

    const supportedLocaleIds = l10n?.supportedLocales.map((locale) => locale.id)
    const showLocaleSelector = supportedLocaleIds?.length > 1

    const levelZeroCategoriesQuery = useCategory({
        parameters: {id: CAT_MENU_DEFAULT_ROOT_CATEGORY, levels: CAT_MENU_DEFAULT_NAV_SSR_DEPTH}
    })

    // NOTE: translations??
    // https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/template-retail-react-app/app/translations/README.md
    // npm run extract-default-translations
    // Generates an empty file: my-extended-retail-app/app/translations/en-US.json

    // NOTE: Styles

    return (
        <Box as="footer" {...styles.container} {...otherProps}>
            <Box {...styles.content}>
                <StylesProvider value={styles}>
                    <HideOnMobile>
                        <SimpleGrid columns={4} spacing={3}>
                            <Box>
                                <Heading color="red" >Address</Heading>
                                <p>333 Seymour St #700, <br /> Vancouver, BC V6B 5A7</p>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2602.527798867028!2d-123.11504478721618!3d49.285344171273785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5486717870700001%3A0xbc718dec90ce4017!2s333%20Seymour%20St%20%23700%2C%20Vancouver%2C%20BC%20V6B%205A7!5e0!3m2!1sen!2sca!4v1682025355986!5m2!1sen!2sca"
                                    width="600" height="450"  allowFullScreen="" loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"></iframe>
                            </Box>
                            <LinksList
                                heading={intl.formatMessage({
                                    id: 'footer.column.account',
                                    defaultMessage: 'Account'
                                })}
                                links={[]}
                            /><LinksList
                            heading={intl.formatMessage({
                                id: 'footer.column.categories_but_in_blue',
                                defaultMessage: 'Categories but in blue'
                            })}
                            links={levelZeroCategoriesQuery?.data.categories.map(
                                ({id, name}) => {return {href:'/', text:name}})
                            }
                            color="blue.600"
                        />
                            <LinksList
                                heading={intl.formatMessage({
                                    id: 'footer.column.our_company',
                                    defaultMessage: 'Our Company'
                                })}
                                links={[
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            id: 'footer.link.store_locator',
                                            defaultMessage: 'Store Locator'
                                        })
                                    },
                                    {
                                        href: '/',
                                        text: intl.formatMessage({
                                            id: 'footer.link.about_us',
                                            defaultMessage: 'About Us'
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

                    {showLocaleSelector && (
                        <Box {...styles.localeSelector}>
                            <FormControl
                                data-testid="sf-footer-locale-selector"
                                id="locale_selector"
                                width="auto"
                                {...otherProps}
                            >
                                <Select
                                    value={locale}
                                    onChange={({target}) => {
                                        setLocale(target.value)

                                        // Update the `locale` in the URL.
                                        const newUrl = getPathWithLocale(target.value, buildUrl, {
                                            disallowParams: ['refine']
                                        })

                                        window.location = newUrl
                                    }}
                                    variant="filled"
                                    {...styles.localeDropdown}
                                >
                                    {supportedLocaleIds.map((locale) => (
                                        <LocaleText
                                            as="option"
                                            value={locale}
                                            shortCode={locale}
                                            key={locale}
                                            {...styles.localeDropdownOption}
                                        />
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

    return (
        <Box {...styles.subscribe} {...otherProps}>
            <Heading {...styles.subscribeHeading}>
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

            <Box>
                <InputGroup>
                    <Input type="email" placeholder="you@email.com" {...styles.subscribeField} />
                    <InputRightElement {...styles.subscribeButtonContainer}>
                        <Button variant="footer">
                            {intl.formatMessage({
                                id: 'footer.subscribe.button.sign_up',
                                defaultMessage: 'Sign Up'
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
