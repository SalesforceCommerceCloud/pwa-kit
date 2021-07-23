import {useIntl} from 'react-intl'

export default function useLoginFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        email: {
            name: `${prefix}email`,
            label: formatMessage({defaultMessage: 'Email'}),
            placeholder: 'you@email.com',
            defaultValue: '',
            type: 'email',
            rules: {
                required: formatMessage({defaultMessage: 'Please enter your email address'})
            },
            error: errors[`${prefix}email`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: formatMessage({defaultMessage: 'Password'}),
            defaultValue: '',
            type: 'password',
            rules: {required: formatMessage({defaultMessage: 'Please enter your password'})},
            error: errors[`${prefix}password`],
            control
        }
    }

    return fields
}
