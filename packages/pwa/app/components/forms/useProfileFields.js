import {useIntl} from 'react-intl'
import {formatPhoneNumber} from '../../utils/phone-utils'

export default function useProfileFields({form: {control, errors}, prefix = ''}) {
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
        phone: {
            name: `${prefix}phone`,
            label: formatMessage({defaultMessage: 'Phone Number'}),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage({defaultMessage: 'Please enter your phone number'})},
            error: errors[`${prefix}phone`],
            inputProps: ({onChange}) => ({
                onChange(evt) {
                    onChange(formatPhoneNumber(evt.target.value))
                }
            }),
            control
        }
    }

    return fields
}
