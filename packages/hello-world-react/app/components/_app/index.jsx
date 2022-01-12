/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'


const App = ({children}) => {
    return (
        <div>
            {children}
        </div>
    )
}

App.shouldGetProps = () => {}

App.getProps = async () => {}

App.propTypes = {
    children: PropTypes.node
}

export default App
