/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'

import {Box, Button, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {expressPaymentProviderPropTypes} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract'

/**
 * Test-only provider that owns local UI state and deliberately avoids optional
 * Commerce helpers, proving they are not part of the provider contract.
 */
const MinimalProviderFixture = ({context, lifecycle}) => {
    const [attempt, setAttempt] = useState(0)

    const beginAttempt = () => {
        setAttempt((value) => value + 1)
        lifecycle.available()
    }

    return (
        <Box data-testid="minimal-provider-fixture">
            <Text>Independent provider fixture for the {context.surface} surface</Text>
            <Text role="status" aria-live="polite">
                Local attempts: {attempt}
            </Text>
            <Button size="sm" onClick={beginAttempt}>
                Begin local attempt
            </Button>
        </Box>
    )
}

MinimalProviderFixture.propTypes = expressPaymentProviderPropTypes

export default MinimalProviderFixture
