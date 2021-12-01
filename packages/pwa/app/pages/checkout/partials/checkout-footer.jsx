/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Box,
    StylesProvider,
    useMultiStyleConfig,
    Divider,
    Text,
    HStack,
    Flex,
    Spacer,
    useStyles
} from '@chakra-ui/react'
import LinksList from '../../../components/links-list'
import {VisaIcon, MastercardIcon, AmexIcon, DiscoverIcon} from '../../../components/icons'
import {HideOnDesktop, HideOnMobile} from '../../../components/responsive'

const CheckoutFooter = ({...otherProps}) => {
    const styles = useMultiStyleConfig('CheckoutFooter')
    const intl = useIntl()

    return (
        <Box as="footer" {...styles.container} {...otherProps}>
            <Box {...styles.content}>
                <StylesProvider value={styles}>
                    <LinksList
                        links={[
                            {
                                href: '/',
                                text: intl.formatMessage({
                                    id: 'checkout_footer.link.shipping',
                                    defaultMessage: 'Shipping'
                                })
                            },
                            {
                                href: '/',
                                text: intl.formatMessage({
                                    id: 'checkout_footer.link.returns_exchanges',
                                    defaultMessage: 'Returns & Exchanges'
                                })
                            }
                        ]}
                        {...styles.customerService}
                    />

                    <HideOnDesktop>
                        <CreditCardIcons marginTop={4} marginBottom={4} />
                    </HideOnDesktop>

                    <Divider {...styles.horizontalRule} />

                    <Box {...styles.bottomHalf}>
                        <Text {...styles.copyright}>
                            &copy;{' '}
                            {intl.formatMessage({
                                id: 'checkout_footer.message.copyright',
                                defaultMessage:
                                    '2021 Salesforce or its affiliates. All rights reserved. This is a demo store only. Orders made WILL NOT be processed.'
                            })}
                        </Text>

                        <HideOnDesktop>
                            <LegalLinks variant="vertical" />
                        </HideOnDesktop>
                        <HideOnMobile>
                            <Flex>
                                <LegalLinks variant="horizontal" />
                                <Spacer />
                                <CreditCardIcons />
                            </Flex>
                        </HideOnMobile>
                    </Box>
                </StylesProvider>
            </Box>
        </Box>
    )
}

export default CheckoutFooter

const LegalLinks = ({variant}) => {
    const intl = useIntl()

    return (
        <LinksList
            links={[
                {
                    href: '/',
                    text: intl.formatMessage({
                        id: 'checkout_footer.link.terms_conditions',
                        defaultMessage: 'Terms & Conditions'
                    })
                },
                {
                    href: '/',
                    text: intl.formatMessage({
                        id: 'checkout_footer.link.privacy_policy',
                        defaultMessage: 'Privacy Policy'
                    })
                },
                {
                    href: '/',
                    text: intl.formatMessage({
                        id: 'checkout_footer.link.site_map',
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

const CreditCardIcons = (props) => {
    const styles = useStyles()
    return (
        <HStack sizing={2} {...props}>
            <VisaIcon {...styles.creditCardIcon} />
            <MastercardIcon {...styles.creditCardIcon} />
            <AmexIcon {...styles.creditCardIcon} />
            <DiscoverIcon {...styles.creditCardIcon} />
        </HStack>
    )
}
