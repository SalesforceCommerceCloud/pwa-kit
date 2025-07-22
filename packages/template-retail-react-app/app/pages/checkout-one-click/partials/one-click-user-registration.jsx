/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Checkbox,
    Stack,
    Text,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'

export default function UserRegistration({enableUserRegistration, setEnableUserRegistration}) {
    const handleUserRegistrationChange = (e) => {
        setEnableUserRegistration(e.target.checked)
    }

    return (
        <Box
            border="1px solid"
            borderColor="gray.200"
            rounded="md"
            p={4}
            data-testid="sf-user-registration-content"
        >
            <Stack spacing={2}>
                <Heading fontSize="lg" lineHeight="30px" tabIndex="0">
                    <FormattedMessage
                        defaultMessage="Save for Future Use"
                        id="checkout.title.user_registration"
                    />
                </Heading>
                <Checkbox
                    name="userRegistration"
                    isChecked={enableUserRegistration}
                    onChange={handleUserRegistrationChange}
                    alignItems="flex-start"
                >
                    <Stack spacing={1}>
                        <Text>
                            <FormattedMessage
                                defaultMessage="Create an account for a faster checkout"
                                id="checkout.label.user_registration"
                            />
                        </Text>
                        {enableUserRegistration && (
                            <Text fontSize="sm" color="gray.500">
                                <FormattedMessage
                                    defaultMessage="When you place your order, we create an account for you and save your payment information and other details for future purchases. During your next checkout, confirm your account using the code we'll send to you."
                                    id="checkout.message.user_registration"
                                />
                            </Text>
                        )}
                    </Stack>
                </Checkbox>
            </Stack>
        </Box>
    )
}

UserRegistration.propTypes = {
    /** Whether user registration is enabled */
    enableUserRegistration: PropTypes.bool,
    /** Callback to set user registration state */
    setEnableUserRegistration: PropTypes.func
}
