/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Badge, Box, Button, Flex, Center, IconButton, useMultiStyleConfig} from '@chakra-ui/react'
import useBasket from '../../../commerce-api/hooks/useBasket'
import Link from '../../../components/link'
import {BasketIcon, BrandLogo} from '../../../components/icons'
import {noop} from '../../../utils/utils'

const CheckoutHeader = ({onLogoClick = noop()}) => {
    const basket = useBasket()
    const intl = useIntl()
    const styles = useMultiStyleConfig('Header')

    return (
        <Box px={[4, 4, 8]} bg="white" borderBottom="1px" borderColor="gray.100">
            <Box maxWidth="container.xxxl" marginLeft="auto" marginRight="auto">
                <Flex h={{base: '52px', md: '80px'}} align="center" justify="space-between">
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.logo',
                            defaultMessage: 'Logo'
                        })}
                        icon={<BrandLogo {...styles.logo} />}
                        {...styles.icons}
                        variant="unstyled"
                        onClick={onLogoClick}
                    />

                    <Button
                        as={Link}
                        href="/cart"
                        display="inline-flex"
                        variant="unstyled"
                        color="gray.900"
                        rightIcon={
                            <Center position="relative" width={11} height={11}>
                                <BasketIcon position="absolute" left="0px" />
                                <Badge variant="notification">{basket.itemAccumulatedCount}</Badge>
                            </Center>
                        }
                    >
                        <FormattedMessage
                            defaultMessage="Back to cart"
                            id="checkout_header.link.cart"
                        />
                    </Button>
                </Flex>
            </Box>
        </Box>
    )
}

CheckoutHeader.propTypes = {
    onLogoClick: PropTypes.func
}

export default CheckoutHeader
