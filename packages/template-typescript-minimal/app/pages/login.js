/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

Login.propTypes = {}

function Login(props) {
    const [user, setUser] = React.useState({})
    return (
        <div>
            <input
                type="text"
                value={user.email}
                onChange={(e) => {
                    setUser({
                        ...user,
                        email: e.target.value
                    })
                }}
            />
            <input
                type="text"
                value={user.pw}
                onChange={(e) => {
                    setUser({
                        ...user,
                        pw: e.target.value
                    })
                }}
            />
        </div>
    )
}

export default Login
