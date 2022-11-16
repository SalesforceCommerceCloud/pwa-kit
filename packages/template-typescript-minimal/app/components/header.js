/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useAuth} from '../hooks/useAuth'
import {Link} from 'react-router-dom'
import {useCart} from '../hooks/useFetch'

Header.propTypes = {}

function Header(props) {
    const {token} = useAuth()
    const {data: cart} = useCart()

    return (
        <div>
            <Link to={'/'}>Home</Link>
            <div>
                {token ? <h2>Logged in as alex.vuong </h2> : <h2>Logging in as alex.vuong</h2>}
            </div>
            <Link to={'/cart'}>
                Cart {parseInt(cart?.totalProductCount) > 0 ? `(${cart?.totalProductCount})` : null}
            </Link>
            <hr />
        </div>
    )
}

export default Header
