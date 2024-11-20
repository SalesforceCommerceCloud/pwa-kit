/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Platform Imports
import {StorefrontPreview} from '@salesforce/commerce-sdk-react/components'
import {useAccessToken} from '@salesforce/commerce-sdk-react'

// Define a type for the HOC props
// TODO: update the type to have site, locale, and buildUrl
type WithStorefrontPreviewProps = React.ComponentPropsWithoutRef<any>

// Define the HOC function
const withStorefrontPreview = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithStorefrontPreview: React.FC<P> = (props: WithStorefrontPreviewProps) => {
        const {getTokenWhenReady} = useAccessToken()
        return (
            <StorefrontPreview getToken={getTokenWhenReady}>
                <WrappedComponent {...(props as P)} />
            </StorefrontPreview>
        )
    }

    return WithStorefrontPreview
}

export default withStorefrontPreview
