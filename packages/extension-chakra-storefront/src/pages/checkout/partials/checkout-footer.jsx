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
    Flex,
    HStack,
    Spacer,
    Separator,
    Text,

    // hooks
    useSlotRecipe
} from '@chakra-ui/react'
import LinksList from '../../../components/links-list'
import {VisaIcon, MastercardIcon, AmexIcon, DiscoverIcon} from '../../../components/icons'
import {HideOnDesktop, HideOnMobile} from '../../../components/responsive'

const CheckoutFooter = ({...otherProps}) => {
    const recipe = useSlotRecipe({key: 'checkoutFooter'})
    const styles = recipe()
    const intl = useIntl()

    return (
        <Box as="footer" css={styles.container} {...otherProps}>
            <Box css={styles.content}>
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
                    css={styles.customerService}
                />

                <HideOnDesktop>
                    <CreditCardIcons marginTop={4} marginBottom={4} />
                </HideOnDesktop>

                <Separator css={styles.horizontalRule} />

                <Box css={styles.legalSection}>
                    <Text css={styles.copyright}>
                        &copy; {new Date().getFullYear()}{' '}
                        {intl.formatMessage({
                            id: 'checkout_footer.message.copyright',
                            defaultMessage:
                                'Salesforce or its affiliates. All rights reserved. This is a demo store only. Orders made WILL NOT be processed.'
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
    const recipe = useSlotRecipe({key: 'checkoutFooter'})
    const styles = recipe()
    return (
        <HStack sizing={2} {...props}>
            <VisaIcon css={styles.creditCardIcon} />
            <MastercardIcon css={styles.creditCardIcon} />
            <AmexIcon css={styles.creditCardIcon} />
            <DiscoverIcon css={styles.creditCardIcon} />
        </HStack>
    )
}
