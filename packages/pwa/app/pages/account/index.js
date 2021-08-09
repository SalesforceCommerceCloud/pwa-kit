/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect} from 'react'
import {FormattedMessage} from 'react-intl'
import {useHistory} from 'react-router-dom'
import {Box, Button, Container, Heading, Stack, Text} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Seo from '../../components/seo'
import Link from '../../components/link'

// This page is a placeholder for upcoming the customer account work.

const Account = () => {
    const history = useHistory()
    const customer = useCustomer()

    const logout = () => {
        customer.logout()
    }

    // If we have customer data and they are not registred, push to homepage
    useEffect(() => {
        if (customer.authType != null && customer.authType !== 'registered') {
            history.push('/')
        }
    }, [customer])

    return (
        <Box data-testid="account-page" layerStyle="page">
            <Seo title="My Account" description="Customer Account Page" />

            {/* TODO: Render loading skeleton while waiting for customer data */}
            {!customer?.authType && <Text>Loading...</Text>}

            {customer.authType === 'registered' && (
                <Container>
                    <Stack spacing={6}>
                        <Heading>
                            <FormattedMessage defaultMessage="My Account" />
                        </Heading>

                        <Stack spacing={2}>
                            <Text>Welcome, {customer.firstName}!</Text>
                            <Box>
                                <Button as={Link} to="/" variant="link" onClick={logout}>
                                    <FormattedMessage defaultMessage="Sign out" />
                                </Button>
                            </Box>
                        </Stack>
                    </Stack>
                </Container>
            )}
        </Box>
    )
}

Account.getTemplateName = () => 'account'

export default Account
