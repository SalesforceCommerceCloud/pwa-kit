/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Button} from '@chakra-ui/react'
import usePromoCodeFields from './usePromoCodeFields'
import Field from '../field'

const PromoCodeFields = ({form, prefix = '', ...props}) => {
    const intl = useIntl()
    const fields = usePromoCodeFields({form, prefix})

    const code = form.watch('code')

    const messages = useMemo(
        () => ({
            apply: intl.formatMessage({
                id: 'promo_code_fields.button.apply',
                defaultMessage: 'Apply'
            })
        }),
        [intl]
    )

    return (
        <Box aria-labelledby="code-feedback" {...props}>
            <Field inputProps={{flex: 1, display: 'flex'}} {...fields.code}>
                <Button
                    type="submit"
                    fontSize="sm"
                    loading={form.formState.isSubmitting}
                    disabled={code?.length < 3}
                >
                    {messages.apply}
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
