/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useServerContext} from 'pwa-kit-react-sdk/ssr/universal/hooks'

interface Props {
    message: string
}

const HelloTS = ({message}: Props) => {
    // Unlike `getProps`, React hook like this can be called anywhere in the component tree
    useServerContext(({res: pageRes}) => {
        // This inner component would override the status code that was set in the <Home> page component
        pageRes.status(202)

        pageRes.set('Some-Header', 'FOOBAR')
    })

    return <span>And this is a TS component (it takes a prop: &quot;{message}&quot;).</span>
}

export default HelloTS
