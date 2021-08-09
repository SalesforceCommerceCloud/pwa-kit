/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

const AMPDocument = (props) => {
    const {head, html, beforeBodyEnd} = props
    return (
        <html amp="">
            <head>
                <meta charSet="utf-8" />
                <script async src="https://cdn.ampproject.org/v0.js" />
                <link rel="canonical" href="<% canonical %>" />
                <meta
                    name="viewport"
                    content="width=device-width,minimum-scale=1,initial-scale=1"
                />
                <style
                    amp-custom=""
                    dangerouslySetInnerHTML={{
                        __html: `h1 {color: red;}`
                    }}
                />
                <style
                    amp-boilerplate=""
                    dangerouslySetInnerHTML={{
                        __html: `body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`
                    }}
                />
                <noscript>
                    <style
                        amp-boilerplate=""
                        dangerouslySetInnerHTML={{
                            __html: `body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`
                        }}
                    />
                </noscript>
                {head.map((child) => child)}
            </head>
            <body>
                <div dangerouslySetInnerHTML={{__html: html}} />
                {beforeBodyEnd.map((child) => child)}
            </body>
        </html>
    )
}

AMPDocument.propTypes = {
    beforeBodyEnd: PropTypes.array.isRequired,
    head: PropTypes.array.isRequired,
    html: PropTypes.string.isRequired
}

AMPDocument.defaultProps = {
    beforeBodyEnd: [],
    head: [],
    html: ''
}

export default AMPDocument
