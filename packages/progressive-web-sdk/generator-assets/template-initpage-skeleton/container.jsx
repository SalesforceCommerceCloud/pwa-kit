/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'

import template from '../../template'
import {getTitle} from './selectors'
import {initialize} from './actions'

const <%= context.Name %> = ({title}) => (
    <div className="t-<%= context.dirname %>">
        <h1 className="t-<%= context.dirname %>__title">{title}</h1>
        <div>This is a newly generated page called: <%= context.Name %></div>
    </div>
)

<%= context.Name %>.propTypes = {
    title: PropTypes.string
}

<%= context.Name %>.initAction = initialize

const mapStateToProps = createPropsSelector({
    title: getTitle
})

const mapDispatchToProps = {}

export default template(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(<%= context.Name %>)
)
