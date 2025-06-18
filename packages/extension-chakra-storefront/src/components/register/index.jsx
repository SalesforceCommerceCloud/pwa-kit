/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Alert, Button, Stack, Text, Link as ChakraLink} from '@chakra-ui/react'
import {BrandLogo} from '../../components/icons'
import {noop} from '../../utils/utils'
import RegistrationFields from '../../components/forms/registration-fields'
import Link from '../../components/link'

const RegisterForm = ({submitForm, clickSignIn = noop, form}) => {
    return (
        <Fragment>
            <Stack justifyContent="center" alignItems="center" gap={8}>
                <BrandLogo width="60px" height="auto" />
                <Stack gap={2}>
                    <Text textAlign="center" fontSize="xl" fontWeight="semibold">
                        <FormattedMessage
                            defaultMessage="Let's get started!"
                            id="register_form.heading.lets_get_started"
                        />
                    </Text>
                    <Text fontSize="sm" textAlign="center" color="gray.700">
                        <FormattedMessage
                            defaultMessage="Create an account and get first access to the very best products, inspiration and community."
                            id="register_form.message.create_an_account"
                        />
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
                            <Alert.Indicator />
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
                            <FormattedMessage
                                defaultMessage="Create Account"
                                id="register_form.button.create_account"
                            />
                        </Button>

                        <Stack direction="row" gap={1} justifyContent="center">
                            <Text fontSize="sm">
                                <FormattedMessage
                                    defaultMessage="Already have an account?"
                                    id="register_form.message.already_have_account"
                                />
                            </Text>
                            <Button
                                variant="link-blue"
                                size="sm"
                                lineHeight="1"
                                onClick={clickSignIn}
                            >
                                <FormattedMessage
                                    defaultMessage="Sign in"
                                    id="register_form.action.sign_in"
                                />
                            </Button>
                        </Stack>

                        <Text fontSize="sm" textAlign="center">
                            <FormattedMessage
                                id="register_form.message.agree_to_policy_terms"
                                defaultMessage="By creating an account, you agree to Salesforce <policy>Privacy Policy</policy> and <terms>Terms & Conditions</terms>"
                                values={{
                                    policy: (chunks) => (
                                        <Link to="/privacy-policy" color="blue.600">
                                            {chunks}
                                        </Link>
                                    ),

                                    terms: (chunks) => (
                                        <Link to="/terms-conditions" color="blue.600">
                                            {chunks}
                                        </Link>
                                    )
                                }}
                            />
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
