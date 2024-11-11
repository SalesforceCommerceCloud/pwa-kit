/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Local Imports
import {CurrencyProvider} from '../../contexts'
import useMultiSite from '../../hooks/use-multi-site'

// Define a type for the HOC props
type WithCurrencyProps = React.ComponentPropsWithoutRef<any>

// Define the HOC function
const withCurrency = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithCurrency: React.FC<P> = (props: WithCurrencyProps) => {
        const {site} = useMultiSite()
        const currency = site.l10n.defaultCurrency

        return (
            <CurrencyProvider currency={currency}>
                <WrappedComponent {...(props as P)} />
            </CurrencyProvider>
        )
    }

    return WithCurrency
}

export default withCurrency
