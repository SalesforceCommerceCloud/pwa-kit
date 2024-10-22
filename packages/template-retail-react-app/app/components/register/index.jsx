/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import useIdpAuth from '@salesforce/retail-react-app/app/hooks/use-idp-auth'
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Alert,
    Button,
    Stack,
    Text,
    Link as ChakraLink
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    AlertIcon,
    BrandLogo,
    SocialFacebookIcon
} from '@salesforce/retail-react-app/app/components/icons'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import RegistrationFields from '@salesforce/retail-react-app/app/components/forms/registration-fields'
import Link from '@salesforce/retail-react-app/app/components/link'

const RegisterForm = ({submitForm, clickSignIn = noop, form}) => {
    const idpAuth = useIdpAuth()

    return (
        <Fragment>
            <Stack justify="center" align="center" spacing={8}>
                <BrandLogo width="60px" height="auto" />
                <Stack spacing={2}>
                    <Text align="center" fontSize="xl" fontWeight="semibold">
                        <FormattedMessage
                            defaultMessage="Let's get started!"
                            id="register_form.heading.lets_get_started"
                        />
                    </Text>
                    <Text fontSize="sm" align="center" color="gray.700">
                        <FormattedMessage
                            defaultMessage="Create an account and get first access to the very best products, inspiration and community."
                            id="register_form.message.create_an_account"
                        />
                    </Text>
                </Stack>
            </Stack>
            <Stack justify="center" align="center" spacing={4} marginTop={8}>
                <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<SocialFacebookIcon />}
                    onClick={async () => {
                        await idpAuth.loginRedirect('facebook')
                    }}
                >
                    <FormattedMessage
                        defaultMessage="Sign up with Facebook"
                        id="register_form.button.sign_up_with_facebook"
                    />
                </Button>
                <Text fontSize="x-large" align="center">
                    <FormattedMessage defaultMessage="or" id="register_form.message.or" />
                </Text>
            </Stack>
            <form
                onSubmit={form.handleSubmit(submitForm)}
                data-testid="sf-auth-modal-form-register"
            >
                <Stack paddingTop={8} spacing={8} paddingLeft={4} paddingRight={4}>
                    {form.formState.errors?.global && (
                        <Alert status="error">
                            <AlertIcon color="red.500" boxSize={4} />
                            <Text fontSize="sm" ml={3}>
                                {form.formState.errors.global.message}
                            </Text>
                        </Alert>
                    )}
                    <RegistrationFields form={form} />
                    <Stack spacing={6}>
                        <Button
                            type="submit"
                            onClick={() => form.clearErrors('global')}
                            isLoading={form.formState.isSubmitting}
                        >
                            <FormattedMessage
                                defaultMessage="Create Account"
                                id="register_form.button.create_account"
                            />
                        </Button>

                        <Stack direction="row" spacing={1} justify="center">
                            <Text fontSize="sm">
                                <FormattedMessage
                                    defaultMessage="Already have an account?"
                                    id="register_form.message.already_have_account"
                                />
                            </Text>
                            <Button variant="link" size="sm" onClick={clickSignIn}>
                                <FormattedMessage
                                    defaultMessage="Sign in"
                                    id="register_form.action.sign_in"
                                />
                            </Button>
                        </Stack>

                        <Text fontSize="sm" align="center">
                            <FormattedMessage
                                id="register_form.message.agree_to_policy_terms"
                                defaultMessage="By creating an account, you agree to Salesforce <policy>Privacy Policy</policy> and <terms>Terms & Conditions</terms>"
                                values={{
                                    policy: (chunks) => (
                                        <ChakraLink as={Link} to="/privacy-policy" color="blue.600">
                                            {chunks}
                                        </ChakraLink>
                                    ),

                                    terms: (chunks) => (
                                        <ChakraLink
                                            as={Link}
                                            to="/terms-conditions"
                                            color="blue.600"
                                        >
                                            {chunks}
                                        </ChakraLink>
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
