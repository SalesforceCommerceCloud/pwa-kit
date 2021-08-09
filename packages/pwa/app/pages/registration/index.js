/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {useHistory} from 'react-router-dom'
import {Box, Container, Stack, Heading} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Seo from '../../components/seo'

// This page is a placeholder for registration. We'll be suggesting that this page
// be built out with the registration form. By having a page, rather than just a
// modal, we allow for more flexibility in the auth flow, as well as providing a
// deep-linkable route. See `hooks/useAuthModal for implementation.

const Registration = ({match}) => {
    const history = useHistory()
    const customer = useCustomer()

    // If customer is registered push to account page
    useEffect(() => {
        if (customer.authType != null && customer.authType === 'registered') {
            history.push(`${match.params.locale}/account`)
        }
    }, [customer])

    return (
        <Box data-testid="registration-page" layerStyle="page">
            <Seo title="Registration" description="Customer sign up" />

            <Container>
                <Stack>
                    <Heading>
                        <FormattedMessage defaultMessage="Sign up" />
                    </Heading>
                </Stack>
            </Container>
        </Box>
    )
}

Registration.getTemplateName = () => 'registration'

Registration.propTypes = {
    match: PropTypes.object
}

export default Registration
