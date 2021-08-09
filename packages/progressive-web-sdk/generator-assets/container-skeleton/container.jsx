/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import Immutable from 'immutable'

// import * as <%= context.name %>Actions from './actions'

class <%= context.Name %> extends React.Component {
    shouldComponentUpdate(newProps) {
        return !Immutable.is(this.props.<%= context.name %>, newProps.<%= context.name %>)
    }

    render() {
        const {
            testText
        } = this.props.<%= context.name %>.toJS()

        return (
            <div className="t-<%= context.dirname %>">
                {testText}
            </div>
        )
    }
}

<%= context.Name %>.propTypes = {
    <%= context.name %>: PropTypes.instanceOf(Immutable.Map)
}

const mapStateToProps = (state) => {
    return {
        <%= context.name %>: state.<%= context.name %>
    }
}

const mapDispatchToProps = {}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(<%= context.Name %>)
