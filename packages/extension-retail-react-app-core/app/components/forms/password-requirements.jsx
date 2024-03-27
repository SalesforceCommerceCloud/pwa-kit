/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Flex, Text, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import {CheckCircleIcon} from '@salesforce/retail-react-app/app/components/icons'
import {validatePassword} from '@salesforce/retail-react-app/app/utils/password-utils'

/**
 * UI component for styling password requirement line
 */
const PasswordRequirement = ({isValid, children}) => {
    const iconStyles = {
        display: 'block',
        ml: isValid ? '-2px' : '-1px',
        mr: isValid ? '9px' : '10px',
        boxSize: isValid ? 4 : '14px',
        color: isValid ? 'green.500' : 'white',
        border: !isValid ? '1px solid' : 'none',
        borderColor: 'gray.200',
        borderRadius: 'full'
    }
    return (
        <Flex align="center">
            <CheckCircleIcon {...iconStyles} />
            <Text fontSize="sm" lineHeight={4}>
                {children}
            </Text>
        </Flex>
    )
}

PasswordRequirement.propTypes = {
    /** Should it render in valid state */
    isValid: PropTypes.bool,

    /** The requirement text */
    children: PropTypes.any
}

/**
 * Renders a list of password requirments. Each requirement line toggles to its `isValid`
 * state when the given password value meets the associated critieria.
 */
const PasswordRequirements = ({value}) => {
    const pwValidations = validatePassword(value)

    return (
        <Stack spacing={2}>
            <PasswordRequirement isValid={pwValidations.hasMinChars}>
                <FormattedMessage
                    id="password_requirements.error.eight_letter_minimum"
                    defaultMessage="8 characters minimum"
                    description="Password requirement"
                />
            </PasswordRequirement>
            <PasswordRequirement isValid={pwValidations.hasUppercase}>
                <FormattedMessage
                    id="password_requirements.error.one_uppercase_letter"
                    defaultMessage="1 uppercase letter"
                    description="Password requirement"
                />
            </PasswordRequirement>
            <PasswordRequirement isValid={pwValidations.hasLowercase}>
                <FormattedMessage
                    id="password_requirements.error.one_lowercase_letter"
                    defaultMessage="1 lowercase letter"
                    description="Password requirement"
                />
            </PasswordRequirement>
            <PasswordRequirement isValid={pwValidations.hasNumber}>
                <FormattedMessage
                    defaultMessage="1 number"
                    description="Password requirement"
                    id="password_requirements.error.one_number"
                />
            </PasswordRequirement>
            <PasswordRequirement isValid={pwValidations.hasSpecialChar}>
                <FormattedMessage
                    id="password_requirements.error.one_special_character"
                    defaultMessage="1 special character (example: , S ! % #)"
                    description="Password requirement"
                />
            </PasswordRequirement>
        </Stack>
    )
}

PasswordRequirements.propTypes = {
    /** The password to check against */
    value: PropTypes.string
}

export default PasswordRequirements
