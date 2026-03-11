/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import CreditCardFields from '@salesforce/retail-react-app/app/components/forms/credit-card-fields'
import Field from '@salesforce/retail-react-app/app/components/field'

/**
 * AccountPaymentForm
 * A minimal payment form for the Account > Payment Methods page.
 * Renders only the credit card fields and any provided children (e.g., action buttons).
 */
const AccountPaymentForm = ({form, onSubmit, children}) => {
    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Stack spacing={6}>
                <Box>
                    <Stack spacing={6}>
                        <CreditCardFields form={form} />
                        <Field
                            name="default"
                            label={
                                <FormattedMessage
                                    defaultMessage="Set as default"
                                    id="account.payments.checkbox.make_default"
                                />
                            }
                            type="checkbox"
                            defaultValue={false}
                            control={form.control}
                        />
                        {children && <Box pt={2}>{children}</Box>}
                    </Stack>
                </Box>
            </Stack>
        </form>
    )
}

AccountPaymentForm.propTypes = {
    form: PropTypes.object,
    onSubmit: PropTypes.func,
    children: PropTypes.node
}

export default AccountPaymentForm
