/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {Box, Container} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Seo from '../../components/seo'
import {useForm} from 'react-hook-form'
import RegisterForm from '../../components/register'
import useNavigation from '../../hooks/use-navigation'

const Registration = () => {
    const navigate = useNavigation()
    const customer = useCustomer()
    const form = useForm()

    const submitForm = async (data) => {
        try {
            await customer.registerCustomer(data)
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    // If customer is registered push to account page
    useEffect(() => {
        if (customer.authType != null && customer.isRegistered) {
            navigate('/account')
        }
    }, [customer])

    return (
        <Box data-testid="registration-page" bg="gray.50" py={[8, 16]}>
            <Seo title="Registration" description="Customer sign up" />
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                <RegisterForm
                    submitForm={submitForm}
                    form={form}
                    clickSignIn={() => navigate('/login')}
                />
            </Container>
        </Box>
    )
}

Registration.getTemplateName = () => 'registration'

Registration.propTypes = {
    match: PropTypes.object
}

export default Registration
