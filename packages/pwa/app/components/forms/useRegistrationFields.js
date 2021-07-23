import {useIntl} from 'react-intl'
import {validatePassword} from '../../utils/password-utils'

export default function useRegistrationFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        firstName: {
            name: `${prefix}firstName`,
            label: formatMessage({defaultMessage: 'First Name'}),
            type: 'text',
            defaultValue: '',
            rules: {required: formatMessage({defaultMessage: 'Please enter your first name'})},
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: formatMessage({defaultMessage: 'Last Name'}),
            type: 'text',
            defaultValue: '',
            rules: {required: formatMessage({defaultMessage: 'Please enter your last name'})},
            error: errors[`${prefix}lastName`],
            control
        },
        email: {
            name: `${prefix}email`,
            label: formatMessage({defaultMessage: 'Email'}),
            placeholder: 'you@email.com',
            type: 'email',
            defaultValue: '',
            rules: {
                required: formatMessage({defaultMessage: 'Please enter a valid email address'})
            },
            error: errors[`${prefix}email`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: formatMessage({defaultMessage: 'Password'}),
            type: 'password',
            defaultValue: '',
            rules: {
                required: formatMessage({defaultMessage: 'Please create a password'}),
                validate: {
                    hasMinChars: (val) =>
                        validatePassword(val).hasMinChars ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least 8 characters'
                        }),
                    hasUppercase: (val) =>
                        validatePassword(val).hasUppercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one uppercase letter'
                        }),
                    hasLowercase: (val) =>
                        validatePassword(val).hasLowercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one lowercase letter'
                        }),
                    hasNumber: (val) =>
                        validatePassword(val).hasNumber ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one number'
                        }),
                    hasSpecialChar: (val) =>
                        validatePassword(val).hasSpecialChar ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one special character'
                        })
                }
            },
            error: errors[`${prefix}password`],
            control
        },
        acceptsMarketing: {
            name: `${prefix}acceptsMarketing`,
            label: formatMessage({
                defaultMessage: 'Sign me up for Salesforce emails (you can unsubscribe at any time)'
            }),
            type: 'checkbox',
            defaultValue: false,
            error: errors[`${prefix}acceptsMarketing`],
            control
        }
    }

    return fields
}
