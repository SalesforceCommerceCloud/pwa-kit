/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Redirect, useLocation, useRouteMatch} from 'react-router-dom'
import {Route, Switch} from 'react-router-dom'
import {
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    Stack,
    Text
} from '@chakra-ui/react'
import Seo from '../../components/seo'
import Link from '../../components/link'
import AccountAddresses from '../../pages/account/addresses'
import {messages, navLinks} from '../../pages/account/constant'
import useNavigation from '../../hooks/use-navigation'
import useMultiSite from '../../hooks/use-multi-site'
import useEinstein from '../../hooks/use-einstein'
import useDataCloud from '../../hooks/use-datacloud'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import {isHydrated} from '../../utils/utils'

const onClient = typeof window !== 'undefined'
const LogoutButton = ({onClick}) => {
    const {formatMessage} = useIntl()
    return (
        <>
            <Divider colorScheme={'gray'} marginTop={3} />
            <Button
                fontWeight="500"
                onClick={onClick}
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
                    <SignoutIcon boxSize={5} mr={2} aria-hidden={true} />
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
}

LogoutButton.propTypes = {
    onClick: PropTypes.func.isRequired
}
const Account = () => {
    const {path} = useRouteMatch()
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerType} = customer
    const {buildUrl} = useMultiSite()
    
    const logout = useAuthHelper(AuthHelpers.Logout)
    const location = useLocation()
    const navigate = useNavigation()

    const [mobileNavIndex, setMobileNavIndex] = useState(-1)
    const [showLoading, setShowLoading] = useState(false)

    const einstein = useEinstein()
    const dataCloud = useDataCloud()

    React.useEffect(() => {
        einstein.sendViewPage(location.pathname)
        dataCloud.sendViewPage(location.pathname)
    }, [location])

    const onSignoutClick = async () => {
        setShowLoading(true)
        // await logout.mutateAsync()
        // navigate('/login')
    }

    // If we have customer data and they are not registered, push to login page
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
                {/* Navigation Sidebar */}
                <Stack display={{base: 'none', lg: 'flex'}} spacing={4}>
                    <Heading as="h2" fontSize="18px">
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
                    </Flex>
                    <Button onClick={onSignoutClick}>Logout</Button>
                </Stack>

                {/* Main Content */}
                <Box>
                    <Heading>Account Page</Heading>
                    <Text>Path: {path}</Text>
                    <Text>Registered: {isRegistered ? 'Yes' : 'No'}</Text>
                    <Text>Customer Type: {customerType}</Text>

                    <Switch>
                        <Route path={`${path}/addresses`} component={AccountAddresses} />
                        <Route exact path={path}>
                            <Box>
                                <Heading>Account Profile</Heading>
                                <Text>This is the account profile page</Text>
                            </Box>
                        </Route>
                    </Switch>
                </Box>
            </Grid>
        </Box>
    )
}

Account.getTemplateName = () => 'account'

Account.propTypes = {
    match: PropTypes.object
}

export default Account