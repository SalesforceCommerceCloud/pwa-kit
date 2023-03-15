/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Route, Switch, useRouteMatch, Redirect} from 'react-router'
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
    Text,
    Divider
} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Seo from '../../components/seo'
import Link from '../../components/link'
import {ChevronDownIcon, ChevronUpIcon, SignoutIcon} from '../../components/icons'
import AccountDetail from './profile'
import AccountAddresses from './addresses'
import AccountOrders from './orders'
import AccountPaymentMethods from './payments'
import AccountWishlist from './wishlist/index'
import {useLocation} from 'react-router-dom'

import {messages, navLinks} from './constant'
import useNavigation from '../../hooks/use-navigation'
import LoadingSpinner from '../../components/loading-spinner'
import useMultiSite from '../../hooks/use-multi-site'
import useEinstein from '../../commerce-api/hooks/useEinstein'

const Account = () => {
    const {path} = useRouteMatch()
    const {formatMessage} = useIntl()
    const customer = useCustomer()
    const location = useLocation()
    const navigate = useNavigation()

    const [mobileNavIndex, setMobileNavIndex] = useState(-1)
    const [showLoading, setShowLoading] = useState(false)

    const einstein = useEinstein()

    const {buildUrl} = useMultiSite()

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(location.pathname)
    }, [location])

    const onSignoutClick = async () => {
        setShowLoading(true)
        await customer.logout()
        navigate('/login')
    }

    const LogoutButton = () => (
        <>
            <Divider colorScheme={'gray'} marginTop={3} />
            <Button
                fontWeight="500"
                onClick={onSignoutClick}
                padding={4}
                py={0}
                variant="unstyled"
                _hover={{background: 'gray.50'}}
                marginTop={1}
                borderRadius="4px"
                cursor={'pointer'}
                height={11}
            >
                <Flex justify={{base: 'center', lg: 'flex-start'}}>
                    <SignoutIcon boxSize={5} mr={2} />
                    <Text as="span" fontSize={['md', 'md', 'md', 'sm']} fontWeight="normal">
                        {formatMessage({
                            defaultMessage: 'Log Out',
                            id: 'account.logout_button.button.log_out'
                        })}
                    </Text>
                </Flex>
            </Button>
        </>
    )

    // If we have customer data and they are not registered, push to login page
    // Using Redirect allows us to store the directed page to location
    // so we can direct users back after they are successfully log in
    if (customer.authType != null && !customer.isRegistered) {
        const path = buildUrl('/login')
        return <Redirect to={{pathname: path, state: {directedFrom: location.pathname}}} />
    }

    return (
        <Box
            data-testid={customer.isRegistered ? 'account-page' : 'account-page-skeleton'}
            layerStyle="page"
            paddingTop={[4, 4, 12, 12, 16]}
        >
            <Seo title="My Account" description="Customer Account Page" />
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
                                            <FormattedMessage
                                                defaultMessage="My Account"
                                                id="account.accordion.button.my_account"
                                            />
                                        </Text>
                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </Flex>
                                </AccordionButton>
                                <AccordionPanel px={4} paddingBottom={4}>
                                    <Flex as="nav" spacing={0} direction="column">
                                        {navLinks.map((link) => (
                                            <Button
                                                key={link.name}
                                                as={Link}
                                                to={`/account${link.path}`}
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

                                        <LogoutButton justify="center" />
                                    </Flex>
                                </AccordionPanel>
                            </>
                        )}
                    </AccordionItem>
                </Accordion>

                {/* large screen nav sidebar */}
                <Stack display={{base: 'none', lg: 'flex'}} spacing={4}>
                    {showLoading && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}

                    <Heading as="h6" fontSize="18px">
                        <FormattedMessage
                            defaultMessage="My Account"
                            id="account.heading.my_account"
                        />
                    </Heading>

                    <Flex spacing={0} as="nav" data-testid="account-detail-nav" direction="column">
                        {navLinks.map((link) => {
                            const LinkIcon = link.icon
                            return (
                                <Button
                                    key={link.name}
                                    as={Link}
                                    to={`/account${link.path}`}
                                    useNavLink={true}
                                    variant="menu-link"
                                    leftIcon={<LinkIcon boxSize={5} />}
                                >
                                    {formatMessage(messages[link.name])}
                                </Button>
                            )
                        })}
                        <LogoutButton />
                    </Flex>
                </Stack>

                <Switch>
                    <Route exact path={path}>
                        <AccountDetail />
                    </Route>
                    <Route exact path={`${path}/wishlist`}>
                        <AccountWishlist />
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
        </Box>
    )
}

Account.getTemplateName = () => 'account'

Account.propTypes = {
    match: PropTypes.object
}

export default Account
