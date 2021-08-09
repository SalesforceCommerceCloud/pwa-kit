/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
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
    const {stack, status} = props

    const isNotFoundError = status === 404
    const title = isNotFoundError
        ? 'Sorry, we cannot find this page 😓'
        : 'Sorry, there is a problem with this page 😔'
    const message = 'To continue, go back home.'

    return (
        <div id="app" className="t-error">
            <Helmet>
                <title>{title}</title>
            </Helmet>

            <div className="t-error__header">
                <a href="/">
                    <img
                        src="https://www.mobify.com/wp-content/uploads/logo-mobify-white.png"
                        alt="Mobify Logo"
                        height="35"
                    />
                </a>
            </div>

            <main id="app-main" role="main">
                <div className="t-error__container">
                    <div className="t-error__container-flexbox">
                        <div className="t-error__container-cloud u-margin-top-lg u-margin-bottom-lg">
                            <svg
                                aria-hidden="true"
                                className="t-error__cloud-icon"
                                title="Error Cloud"
                                aria-labelledby="icon-1-1"
                            >
                                <title id="icon-1-1">Error Cloud</title>
                                <use role="presentation" xlinkHref="#pw-error-cloud"></use>
                            </svg>
                        </div>

                        <div className="t-error__container-content u-margin-top-lg u-margin-bottom-lg">
                            <h1 className="u-margin-bottom-md">{title}</h1>

                            <p className="u-margin-bottom-lg">{message}</p>

                            <div className="u-width-block-full">
                                <a href="/" className="pw-link pw-button pw--anchor pw--primary">
                                    <div className="pw-button__inner">Go Back Home</div>
                                </a>
                            </div>
                        </div>
                    </div>
                    {stack && (
                        <pre className="t-error__container-stack u-text-align-start u-margin-top-md u-margin-bottom-md">
                            {stack}
                        </pre>
                    )}
                </div>
            </main>
        </div>
    )
}

Error.propTypes = {
    // JavaScript error stack trace: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
    stack: PropTypes.string,
    // HTTP status code: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    status: PropTypes.number
}

export default Error
