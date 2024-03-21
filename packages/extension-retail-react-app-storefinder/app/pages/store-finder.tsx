/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

interface Props {
    value: number
}

const StoreFinder = ({value}: Props) => {
    return (
        <div>
            <h1>Store Finder</h1>
        </div>
    )
}

StoreFinder.getTemplateName = () => 'store-finder'

export default StoreFinder
