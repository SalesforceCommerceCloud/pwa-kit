/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {Router as ReactRouter, browserHistory, applyRouterMiddleware} from 'react-router'
import useScroll from 'react-router-scroll/lib/useScroll'

import recordRoutes from './record-routes'
import {setRouteList, setBlacklist} from './is-react-route'

const Router = ({history, children, blacklist}) => {
    if (blacklist) {
        setBlacklist(blacklist)
    }
    return (
        <ReactRouter history={history} render={applyRouterMiddleware(useScroll())}>
            {recordRoutes(setRouteList, children)}
        </ReactRouter>
    )
}

Router.defaultProps = {
    history: browserHistory
}

Router.propTypes = {
    children: PropTypes.node.isRequired,
    blacklist: PropTypes.array,
    history: PropTypes.object
}

export default Router
