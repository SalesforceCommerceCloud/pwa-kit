/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * @module progressive-web-sdk/ssr/universal/components/_error
 */

import React from 'react'
import PropTypes from 'prop-types'

/**
 * This is a special component that can be overridden in a project. We recommend
 * doing this in your project in order to cutomize its behaviour. You can accomplish
 * things such as, making the error page brand specific, redirecting when errors
 * occur, or adding reporting.
 *
 * The default Error component provides a basic layout for displaying errors
 * that have occured during server-side rendering or client-side execution.
 *
 * @param {string} props.message - The errors message.
 * @param {string} props.stack - The errors stack trace.
 *      <br/>
 *      <br/>
 *      <i>This property is only defined in non-production environments.</i>
 * @param {number} props.status - The errors HTTP status code.
 *      <br/>
 *      <br/>
 *      <i>This property is typically used to distinguish 404 errors from other types.</i>
 * @param {string} props.correlationId
 */
const Error = ({message, stack, status, correlationId}) => {
    return (
        <div>
            <h1>Error Status: {status}</h1>
            <div>CorrelationId: {correlationId}</div>
            <pre>{stack}</pre>
            <pre>{message}</pre>
        </div>
    )
}

Error.propTypes = {
    message: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired,
    stack: PropTypes.string,
    correlationId: PropTypes.string
}

export default Error
