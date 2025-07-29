/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Alert, Button, Stack, Text} from '@chakra-ui/react'
import {AlertIcon, BrandLogo} from '../../components/icons'
import {noop} from '../../utils/utils'
import RegistrationFields from '../../components/forms/registration-fields'
import Link from '../../components/link'

const RegisterForm = ({submitForm, clickSignIn = noop, form}) => {
    const {formatMessage} = useIntl()

    const messages = {
        heading: formatMessage({
            id: 'register_form.heading.lets_get_started',
            defaultMessage: "Let's get started!"
        }),
        description: formatMessage({
            id: 'register_form.message.create_an_account',
            defaultMessage:
                'Create an account and get first access to the very best products, inspiration and community.'
        }),
        createAccount: formatMessage({
            id: 'register_form.button.create_account',
            defaultMessage: 'Create Account'
        }),
        alreadyHaveAccount: formatMessage({
            id: 'register_form.message.already_have_account',
            defaultMessage: 'Already have an account?'
        }),
        signIn: formatMessage({
            id: 'register_form.action.sign_in',
            defaultMessage: 'Sign in'
        }),
        agreeToPolicy: (policy, terms) =>
            formatMessage(
                {
                    id: 'register_form.message.agree_to_policy_terms',
                    defaultMessage:
                        'By creating an account, you agree to Salesforce <policy>Privacy Policy</policy> and <terms>Terms & Conditions</terms>'
                },
                {policy, terms}
            )
    }
    return (
        <Fragment>
            <Stack justifyContent="center" alignItems="center" gap={8}>
                <BrandLogo width="60px" height="auto" />
                <Stack gap={2}>
                    <Text textAlign="center" fontSize="xl" fontWeight="semibold">
                        {messages.heading}
                    </Text>
                    <Text fontSize="sm" textAlign="center" color="gray.700">
                        {messages.description}
                    </Text>
                </Stack>
            </Stack>
            <form
                onSubmit={form.handleSubmit(submitForm)}
                data-testid="sf-auth-modal-form-register"
            >
                <Stack paddingTop={8} gap={8} paddingLeft={4} paddingRight={4}>
                    {form.formState.errors?.global && (
                        <Alert.Root status="error">
                            <Alert.Indicator>
                                <AlertIcon color="red.500" boxSize={4} />
                            </Alert.Indicator>
                            <Alert.Description>
                                {form.formState.errors.global.message}
                            </Alert.Description>
                        </Alert.Root>
                    )}
                    <RegistrationFields form={form} />
                    <Stack gap={6}>
                        <Button
                            type="submit"
                            onClick={() => form.clearErrors('global')}
                            loading={form.formState.isSubmitting}
                        >
                            {messages.createAccount}
                        </Button>

                        <Stack direction="row" gap={1} justifyContent="center">
                            <Text fontSize="sm">{messages.alreadyHaveAccount}</Text>
                            <Button
                                variant="link-blue"
                                size="sm"
                                lineHeight="1"
                                onClick={clickSignIn}
                            >
                                {messages.signIn}
                            </Button>
                        </Stack>

                        <Text fontSize="sm" textAlign="center">
                            {messages.agreeToPolicy(
                                (chunks) => (
                                    <Link to="/privacy-policy" color="blue.600">
                                        {chunks}
                                    </Link>
                                ),
                                (chunks) => (
                                    <Link to="/terms-conditions" color="blue.600">
                                        {chunks}
                                    </Link>
                                )
                            )}
                        </Text>
                    </Stack>
                </Stack>
            </form>
        </Fragment>
    )
}

RegisterForm.propTypes = {
    submitForm: PropTypes.func,
    clickSignIn: PropTypes.func,
    form: PropTypes.object
}

export default RegisterForm
