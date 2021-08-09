/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {useIntl} from 'react-intl'

export default function usePromoCodeFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        code: {
            name: `${prefix}code`,
            label: formatMessage({defaultMessage: 'Promo Code'}),
            type: 'text',
            defaultValue: '',
            rules: {required: formatMessage({defaultMessage: 'Please provide a valid promo code'})},
            error: errors[`${prefix}code`],
            control
        }
    }

    return fields
}
