export default function useLoginFields({control, errors, prefix = ''}) {
    const fields = {
        email: {
            name: `${prefix}email`,
            label: 'Email',
            type: 'email',
            rules: {required: 'Please enter a valid email address'},
            error: errors[`${prefix}email`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: 'Password',
            type: 'password',
            rules: {required: 'Please enter your password'},
            error: errors[`${prefix}password`],
            control
        }
    }

    return fields
}
