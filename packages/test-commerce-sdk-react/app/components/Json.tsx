/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

const Json = React.memo(({data}: {data: any}) => (
    <div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
))

Json.displayName = 'Json'

export default Json
