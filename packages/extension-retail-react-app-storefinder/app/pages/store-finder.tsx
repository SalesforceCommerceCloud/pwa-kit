/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useQuery} from '@tanstack/react-query'

const getStores = async () => {
    const response = await fetch('/get-stores')
    return response.json()
}

const StoreFinder = () => {
    const {data} = useQuery({
        queryKey: ['app', 'stores'],
        queryFn: getStores
    })

    return (
        <div>
            <h1>Store Finder</h1>
            <p>This page was provided by the `extension-retail-react-app-storefinder` package.</p>
            {data && <code>{JSON.stringify(data)}</code>}
        </div>
    )
}

StoreFinder.getTemplateName = () => 'store-finder'

export default StoreFinder
