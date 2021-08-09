/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * INSERT_DESCRIPTION_HERE
 */
<% if (context.stateful) {%>
class <%= context.Name %> extends React.Component {

    render() {
        const {
            className,
            text
        } = this.props

        const classes = classNames('<%= context.COMPONENT_NAMESPACE %>-<%= context.dirname %>', {
            // '<%= context.COMPONENT_NAMESPACE %>--modifier': bool ? true : false
        }, className)

        return (
            <div className={classes}>
                I am an example! {text}
            </div>
        )
    }
}
<% } else { %>
const <%= context.Name %> = ({
    className,
    text
}) => {
    const classes = classNames('<%= context.COMPONENT_NAMESPACE %>-<%= context.dirname %>', {
        // '<%= context.COMPONENT_NAMESPACE %>--modifier': bool ? true : false
    }, className)

    return (
        <div className={classes}>
            I am an example! {text}
        </div>
    )
}
<% } %>

<%= context.Name %>.propTypes = {
    /**
     * PropTypes comments are REQUIRED for components to be included
     * in the styleguide
     */
    text: PropTypes.string.isRequired,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

}

export default <%= context.Name %>
