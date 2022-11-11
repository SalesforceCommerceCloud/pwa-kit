/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useAuth} from '../../hooks/useAuth'
import Header from '../header'
App.propTypes = {}

function App({children}) {
    return (
        <div>
            <Header />
            <div>{children}</div>
        </div>
    )
}

export default App
