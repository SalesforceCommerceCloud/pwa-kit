/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {trackPageLoad} from '../../page-actions'
import {createPropsSelector} from 'reselect-immutable-helpers'

import * as actions from './actions'
import * as selectors from './selectors'

class <%= context.Name %> extends React.Component {

    constructor(props) {
        super(props)
        this.pageType = '<%= context.name %>'
    }

    componentDidMount() {
        const {initialize<%= context.Name %>, trackPageLoad} = this.props
        trackPageLoad(initialize<%= context.Name %>(this.props.params.productId))
    }

    componentDidUpdate(prevProps) {
        const {initialize<%= context.Name %>, trackPageLoad} = this.props
        const previousProductId = prevProps.params.productId
        const currentProductId = this.props.params.productId
        if (previousProductId !== currentProductId) {
            trackPageLoad(initialize<%= context.Name %>(currentProductId))
        }
    }

    render() {
        const {<%= context.name %>} = this.props
        return (
            <div className="t-<%= context.dirname %>">
                <pre>{JSON.stringify(<%= context.name %>, null, 4)}</pre>
            </div>
        )
    }
}

<%= context.Name %>.propTypes = {
    initialize<%= context.Name %>: PropTypes.func,
    trackPageLoad: PropTypes.func,
    <%= context.name %>: PropTypes.object
}

const mapStateToProps = createPropsSelector({
    <%= context.name %>: selectors.get<%= context.Name %>
})

const mapDispatchToProps = {
    initialize<%= context.Name %>: actions.initialize<%= context.Name %>,
    trackPageLoad
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(<%= context.Name %>)
