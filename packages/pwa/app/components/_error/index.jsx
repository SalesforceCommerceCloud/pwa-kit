/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'

// <Error> is rendered when:
//
// 1. A user requests a page that is not routable from `app/routes.jsx`.
// 2. A routed component throws an error in `getProps()`.
// 3. A routed component throws an error in `render()`.
//
// It must not throw an error. Keep it as simple as possible.

const Error = (props) => {
    const {message, stack} = props

    const title = "This page isn't working"
    return (
        <div>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <h1>{message}</h1>
            {stack && <p>{stack}</p>}
        </div>
    )
}

Error.propTypes = {
    // JavaScript error stack trace: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
    stack: PropTypes.string,
    // HTTP status code: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    status: PropTypes.number,
    // A description of the error, if available
    message: PropTypes.string
}

export default Error
