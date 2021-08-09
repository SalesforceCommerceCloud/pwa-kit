/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * @module progressive-web-sdk/dist/ssr/universal/components/_error
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
 */
const Error = ({message, stack, status}) => {
    return (
        <div>
            <h1>Error Status: {status}</h1>
            <pre>{stack}</pre>
            <pre>{message}</pre>
        </div>
    )
}

Error.propTypes = {
    message: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired,
    stack: PropTypes.string
}

export default Error
