/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment, ReactElement, ReactNode} from 'react'
import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/components'

interface AppProps {
    children: ReactNode
}

const App = (props: AppProps): ReactElement => {
    return <Fragment><Fragment>{JSON.stringify(props.greeting)}</Fragment><Fragment>{props.children}</Fragment></Fragment>
}

App.getProps = ({secretMessage}) => {
    console.log(`The secret message is... "${secretMessage}"`)
    return {greeting: 'Hello from the App component.'}
}

const extraGetPropsArgs = ({req}) => {
    return {
        originalUrl: typeof window !== 'undefined' ? window.location.href : req.originalUrl,
        secretMessage: 'The brown cow sleeps when the moon is full'
    }
}
export default withLegacyGetProps(App, {extraGetPropsArgs})
