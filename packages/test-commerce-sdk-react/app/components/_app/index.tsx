/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {ReactElement} from 'react'
import {Link} from 'react-router-dom'
interface AppProps {
    children: React.ReactNode
}
function App(props: AppProps): ReactElement {
    return (
        <div>
            <div>
                <Link to={'/'}>Home</Link>
            </div>
            {props.children}
        </div>
    )
}

export default App
