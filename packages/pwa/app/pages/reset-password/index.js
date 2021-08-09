/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Box, Container, Stack, Heading} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Seo from '../../components/seo'

// This page is a placeholder for resetting password. We'll be suggesting that
// this page be built out with the reset password form. By having a page, rather
// than just a modal, we allow for more flexibility in the nav flow, as well as
// providing a deep-linkable route. See `hooks/useAuthModal for implementation.

const ResetPassword = () => {
    // eslint-disable-next-line no-unused-vars
    const customer = useCustomer()

    return (
        <Box data-testid="reset-password-page" layerStyle="page">
            <Seo title="Reset password" description="Reset customer password" />

            <Container>
                <Stack>
                    <Heading>
                        <FormattedMessage defaultMessage="Reset password" />
                    </Heading>
                </Stack>
            </Container>
        </Box>
    )
}

ResetPassword.getTemplateName = () => 'reset-password'

export default ResetPassword
