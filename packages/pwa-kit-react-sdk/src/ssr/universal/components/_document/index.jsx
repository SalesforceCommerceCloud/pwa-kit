/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * @module progressive-web-sdk/dist/ssr/universal/components/_document
 */

import React from 'react'
import PropTypes from 'prop-types'

/**
 * The Document is a special component that can be overridden in a project, it
 * provides the default document foundation for your PWA. This includes
 * defaults for lang, charset, viewport, theme-color, script locations, etc.
 * We do not recommend overriding this component, but if you do require fine grained control of
 * your application we recommend using this implementation as a starting point to ensure
 * the correct functionality of your PWA.
 *
 * The properties for this component will be set in the server-side rendering pipeline.
 * Failure to use all these properties will most likely result in a non-functioning
 * PWA.
 *
 * @param {Array.<Object>} props.beforeBodyEnd - The renderable elements to be placed directly before
 *      the end of the body tag.
 * @param {object} [props.bodyAttributes] - The attributes to be applied to the documents body tag.
 *      <br/>
 *      <br/>
 *      <i>These are set by using `react-helmet`. Please refer to their {@link https://github.com/nfl/react-helmet/tree/5.2.0#readme|docs}
 *      for its usage.</i>
 * @param {Array.<Object>} props.head - The elements to be placed inside the documents head tag.
 * @param {string} [props.html] - The HTML to be rendered in your documents html tag.
 * @param {object} [props.htmlAttributes] - The attributes to be applied to the documents html tag.
 *      <br/>
 *      <br/>
 *      <i>These are set by using `react-helmet`. Please refer to their {@link https://github.com/nfl/react-helmet/tree/5.2.0#readme|docs}
 *      for its usage.</i>
 */
const Document = (props) => {
    const {head, html, afterBodyStart, beforeBodyEnd, htmlAttributes, bodyAttributes} = props
    return (
        <html lang="en-US" {...htmlAttributes}>
            <head>
                <meta name="charset" content="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0"
                />
                <meta name="format-detection" content="telephone=no" />
                {head.map((child) => child)}
            </head>
            <body {...bodyAttributes}>
                {afterBodyStart.map((child) => child)}
                <div className="react-target" dangerouslySetInnerHTML={{__html: html}} />
                {beforeBodyEnd.map((child) => child)}
            </body>
        </html>
    )
}

Document.propTypes = {
    afterBodyStart: PropTypes.arrayOf(PropTypes.node).isRequired,
    beforeBodyEnd: PropTypes.arrayOf(PropTypes.node).isRequired,
    head: PropTypes.arrayOf(PropTypes.node).isRequired,
    html: PropTypes.string.isRequired,
    htmlAttributes: PropTypes.object,
    bodyAttributes: PropTypes.object
}

Document.defaultProps = {
    afterBodyStart: [],
    beforeBodyEnd: [],
    head: [],
    html: '',
    htmlAttributes: {},
    bodyAttributes: {}
}

export default Document
