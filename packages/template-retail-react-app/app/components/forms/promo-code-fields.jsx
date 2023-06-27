/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import usePromoCodeFields from '@salesforce/retail-react-app/app/components/forms/usePromoCodeFields'
import Field from '@salesforce/retail-react-app/app/components/field'

const PromoCodeFields = ({form, prefix = '', ...props}) => {
    const fields = usePromoCodeFields({form, prefix})

    const code = form.watch('code')

    return (
        <Box {...props}>
            <Field inputProps={{flex: 1, mr: 2}} {...fields.code}>
                <Button
                    type="submit"
                    fontSize="sm"
                    isLoading={form.formState.isSubmitting}
                    disabled={code?.length < 3}
                >
                    <FormattedMessage defaultMessage="Apply" id="promo_code_fields.button.apply" />
                </Button>
            </Field>
        </Box>
    )
}

PromoCodeFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default PromoCodeFields
