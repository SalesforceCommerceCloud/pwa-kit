/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, defineMessages, useIntl} from 'react-intl'
import {Route, Switch, useRouteMatch} from 'react-router'
import {
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    Stack,
    Text
} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useNavigation from '../../hooks/use-navigation'
import Seo from '../../components/seo'
import Link from '../../components/link'
import {
    AccountIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    LocationIcon,
    PaymentIcon,
    ReceiptIcon
} from '../../components/icons'
import AccountDetail from './profile'
import AccountAddresses from './addresses'
import AccountOrders from './orders'
import AccountPaymentMethods from './payments'

const messages = defineMessages({
    profile: {defaultMessage: 'Account Details'},
    addresses: {defaultMessage: 'Addresses'},
    orders: {defaultMessage: 'Order History'},
    payments: {defaultMessage: 'Payment Methods'}
})

const navLinks = [
    {
        name: 'profile',
        path: '',
        icon: AccountIcon
    },
    {
        name: 'addresses',
        path: '/addresses',
        icon: LocationIcon
    },
    {
        name: 'orders',
        path: '/orders',
        icon: ReceiptIcon
    },
    {
        name: 'payments',
        path: '/payments',
        icon: PaymentIcon
    }
]

const Account = () => {
    const {path, url} = useRouteMatch()
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const customer = useCustomer()
    const [mobileNavIndex, setMobileNavIndex] = useState(-1)

    // If we have customer data and they are not registered, push to login page
    useEffect(() => {
        if (customer.authType != null && customer.authType !== 'registered') {
            navigate('/login')
        }
    }, [customer])

    return (
        <Box data-testid="account-page" layerStyle="page" paddingTop={[4, 4, 12, 12, 16]}>
            <Seo title="My Account" description="Customer Account Page" />

            {/* TODO: Render loading skeleton while waiting for customer data */}
            {!customer?.authType && <Text>Loading...</Text>}

            {customer.authType === 'registered' && (
                <Grid templateColumns={{base: '1fr', lg: '320px 1fr'}} gap={{base: 10, lg: 24}}>
                    {/* small screen nav accordion */}
                    <Accordion
                        display={{base: 'block', lg: 'none'}}
                        allowToggle={true}
                        reduceMotion={true}
                        index={mobileNavIndex}
                        onChange={setMobileNavIndex}
                    >
                        <AccordionItem border="none" background="gray.50" borderRadius="base">
                            {({isExpanded}) => (
                                <>
                                    <AccordionButton
                                        as={Button}
                                        height={16}
                                        variant="ghost"
                                        color="black"
                                        _active={{background: 'gray.100'}}
                                        _expanded={{background: 'transparent'}}
                                    >
                                        <Flex align="center" justify="center">
                                            <Text as="span" mr={2}>
                                                <FormattedMessage defaultMessage="My Account" />
                                            </Text>
                                            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                        </Flex>
                                    </AccordionButton>
                                    <AccordionPanel px={4} paddingBottom={4}>
                                        <Stack as="nav" spacing={0}>
                                            {navLinks.map((link) => (
                                                <Button
                                                    key={link.name}
                                                    as={Link}
                                                    to={`${url}${link.path}`}
                                                    useNavLink={true}
                                                    variant="menu-link-mobile"
                                                    justifyContent="center"
                                                    fontSize="md"
                                                    fontWeight="normal"
                                                    onClick={() => setMobileNavIndex(-1)}
                                                >
                                                    {formatMessage(messages[link.name])}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </AccordionPanel>
                                </>
                            )}
                        </AccordionItem>
                    </Accordion>

                    {/* large screen nav sidebar */}
                    <Stack display={{base: 'none', lg: 'flex'}} spacing={4}>
                        <Heading as="h6" fontSize="18px">
                            <FormattedMessage defaultMessage="My Account" />
                        </Heading>

                        <Stack spacing={0} as="nav" data-testid="account-detail-nav">
                            {navLinks.map((link) => {
                                const LinkIcon = link.icon
                                return (
                                    <Button
                                        key={link.name}
                                        as={Link}
                                        to={`${url}${link.path}`}
                                        useNavLink={true}
                                        variant="menu-link"
                                        leftIcon={<LinkIcon boxSize={5} />}
                                    >
                                        {formatMessage(messages[link.name])}
                                    </Button>
                                )
                            })}
                        </Stack>
                    </Stack>

                    <Switch>
                        <Route exact path={path}>
                            <AccountDetail />
                        </Route>
                        <Route exact path={`${path}/addresses`}>
                            <AccountAddresses />
                        </Route>
                        <Route path={`${path}/orders`}>
                            <AccountOrders />
                        </Route>
                        <Route exact path={`${path}/payments`}>
                            <AccountPaymentMethods />
                        </Route>
                    </Switch>
                </Grid>
            )}
        </Box>
    )
}

Account.getTemplateName = () => 'account'

Account.propTypes = {
    match: PropTypes.object
}

export default Account
