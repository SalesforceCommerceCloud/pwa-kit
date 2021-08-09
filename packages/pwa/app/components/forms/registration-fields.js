import React from 'react'
import PropTypes from 'prop-types'
import {Flex, Stack, Text} from '@chakra-ui/react'
import {FormattedMessage} from 'react-intl'
import {validatePassword} from '../../utils/password-utils'
import useRegistrationFields from './useRegistrationFields'
import Field from '../field'
import {CheckCircleIcon} from '../icons'

const RegistrationFields = ({form, prefix = ''}) => {
    const fields = useRegistrationFields({form, prefix})
    const pwValidations = validatePassword(form.watch('password'))

    return (
        <Stack spacing={5}>
            <Field {...fields.firstName} />
            <Field {...fields.lastName} />
            <Field {...fields.email} />

            <Stack spacing={3} pb={2}>
                <Field {...fields.password} />

                <Stack spacing={2}>
                    <PasswordRequirement isValid={pwValidations.hasMinChars}>
                        <FormattedMessage
                            defaultMessage="8 characters minimum"
                            description="Password requirement"
                        />
                    </PasswordRequirement>
                    <PasswordRequirement isValid={pwValidations.hasUppercase}>
                        <FormattedMessage
                            defaultMessage="1 uppercase letter"
                            description="Password requirement"
                        />
                    </PasswordRequirement>
                    <PasswordRequirement isValid={pwValidations.hasLowercase}>
                        <FormattedMessage
                            defaultMessage="1 lowercase letter"
                            description="Password requirement"
                        />
                    </PasswordRequirement>
                    <PasswordRequirement isValid={pwValidations.hasNumber}>
                        <FormattedMessage
                            defaultMessage="1 number"
                            description="Password requirement"
                        />
                    </PasswordRequirement>
                    <PasswordRequirement isValid={pwValidations.hasSpecialChar}>
                        <FormattedMessage
                            defaultMessage="1 special character (example: , S ! % #)"
                            description="Password requirement"
                        />
                    </PasswordRequirement>
                </Stack>
            </Stack>

            <Field {...fields.acceptsMarketing} inputProps={{alignItems: 'flex-start'}} />
        </Stack>
    )
}

RegistrationFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

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
    isValid: PropTypes.bool,
    children: PropTypes.any
}

export default RegistrationFields
