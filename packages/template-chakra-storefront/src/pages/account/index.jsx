/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Route, Switch, Redirect, useRouteMatch} from 'react-router-dom'
import {
    Accordion,
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    List,
    Separator,
    Stack,
    Text,
    // hooks
    useSlotRecipe
} from '@chakra-ui/react'
import Seo from '../../components/seo'
import Link from '../../components/link'
import {ChevronDownIcon, SignoutIcon} from '../../components/icons'
import AccountDetail from '../../pages/account/profile'
import AccountAddresses from '../../pages/account/addresses'
import AccountOrders from '../../pages/account/orders'
import AccountWishlist from '../../pages/account/wishlist/index'

import {messages, navLinks} from './constant'
import useNavigation from '../../hooks/use-navigation'
import LoadingSpinner from '../../components/loading-spinner'
import useMultiSite from '../../hooks/use-multi-site'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '../../hooks/'
import {isHydrated} from '../../utils/utils'

const onClient = typeof window !== 'undefined'
const LogoutButton = ({onClick}) => {
    const recipe = useSlotRecipe({key: 'header'})
    const styles = recipe()
    const {formatMessage} = useIntl()

    const logoutText = formatMessage({
        defaultMessage: 'Log Out',
        id: 'account.logout_button.button.log_out'
    })

    return (
        <>
            <Separator colorPalette="gray" marginTop="3" />
            <Button variant="ghost" css={styles.signoutButton} onClick={onClick} gap="5">
                <SignoutIcon aria-hidden={true} boxSize="5" css={styles.signoutIcon} />
                <Text as="span" css={styles.signoutText}>
                    {logoutText}
                </Text>
            </Button>
        </>
    )
}

LogoutButton.propTypes = {
    onClick: PropTypes.func.isRequired
}
const Account = () => {
    // reuse account menu style from header since they all shared same styles
    const recipe = useSlotRecipe({key: 'header'})
    const styles = recipe()

    const {path} = useRouteMatch()
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerType} = customer

    const logout = useAuthHelper(AuthHelpers.Logout)
    const navigate = useNavigation()

    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const [showLoading, setShowLoading] = useState(false)

    const {buildUrl} = useMultiSite()

    const accountMessages = {
        myAccount: formatMessage({
            defaultMessage: 'My Account',
            id: 'account.accordion.button.my_account'
        }),
        myAccountHeading: formatMessage({
            defaultMessage: 'My Account',
            id: 'account.heading.my_account'
        })
    }

    const onSignoutClick = async () => {
        setShowLoading(true)
        await logout.mutateAsync()
        navigate('/login')
    }

    // If we have customer data and they are not registered, push to login page
    // Using Redirect allows us to store the directed page to location
    // so we can direct users back after they are successfully log in
    if (customerType !== null && !isRegistered && onClient) {
        const path = buildUrl('/login')
        return <Redirect to={{pathname: path, state: {directedFrom: '/account'}}} />
    }

    return (
        <Box
            data-testid={isRegistered && isHydrated() ? 'account-page' : 'account-page-skeleton'}
            layerStyle="page"
            paddingTop={[4, 4, 12, 12, 16]}
        >
            <Seo title="My Account" description="Customer Account Page" />
            <Grid templateColumns={{base: '1fr', lg: '320px 1fr'}} gap={{base: 10, lg: 24}}>
                {/* small screen nav accordion */}
                <Accordion.Root
                    display={{base: 'block', lg: 'none'}}
                    collapsible
                    multiple={false}
                    value={mobileNavOpen ? ['0'] : []}
                    onValueChange={(details) => setMobileNavOpen(details.value.includes('0'))}
                >
                    <Accordion.Item
                        value="0"
                        border="none"
                        background="gray.50"
                        borderRadius="base"
                    >
                        <Accordion.ItemTrigger
                            height="16"
                            paddingLeft="8"
                            variant="ghost"
                            color="black"
                            _active={{background: 'gray.100'}}
                            _expanded={{background: 'transparent'}}
                        >
                            <Flex align="center" justify="center" width="full">
                                <Heading as="h2" fontSize="16px">
                                    {accountMessages.myAccount}
                                </Heading>
                                <Accordion.ItemIndicator asChild>
                                    <ChevronDownIcon color="inherit" />
                                </Accordion.ItemIndicator>
                            </Flex>
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent px="4" paddingBottom="4">
                            <Flex as="nav" gap="0" direction="column">
                                <Stack gap="0">
                                    <List.Root variant="plain" as="ul" data-testid="account-nav">
                                        {navLinks.map((link) => {
                                            const LinkIcon = link.icon
                                            return (
                                                <List.Item key={link.name}>
                                                    <Button
                                                        asChild
                                                        variant="menu-link-mobile"
                                                        css={styles.menuAccountLink}
                                                    >
                                                        <Link
                                                            to={`/account${link.path}`}
                                                            useNavLink={true}
                                                            onClick={() => setMobileNavOpen(false)}
                                                        >
                                                            <LinkIcon boxSize="5" mr="2" />
                                                            {formatMessage(messages[link.name])}
                                                        </Link>
                                                    </Button>
                                                </List.Item>
                                            )
                                        })}
                                    </List.Root>

                                    <LogoutButton justify="center" onClick={onSignoutClick} />
                                </Stack>
                            </Flex>
                        </Accordion.ItemContent>
                    </Accordion.Item>
                </Accordion.Root>
                {/*large screen nav sidebar*/}
                <Stack display={{base: 'none', lg: 'flex'}} gap="4">
                    {showLoading && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}

                    <Heading as="h2" fontSize="18px">
                        {accountMessages.myAccountHeading}
                    </Heading>

                    <Flex gap="0" as="nav" data-testid="account-detail-nav" direction="column">
                        <List.Root variant="plain" as="ul">
                            {navLinks.map((link) => {
                                const LinkIcon = link.icon
                                return (
                                    <List.Item key={link.name}>
                                        <Button
                                            asChild
                                            variant="menu-link"
                                            css={styles.menuAccountLink}
                                        >
                                            <Link to={`/account${link.path}`} useNavLink={true}>
                                                <LinkIcon boxSize="5" mr="2" />
                                                {formatMessage(messages[link.name])}
                                            </Link>
                                        </Button>
                                    </List.Item>
                                )
                            })}
                        </List.Root>

                        <LogoutButton onClick={onSignoutClick} />
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
