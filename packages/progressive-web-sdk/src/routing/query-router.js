/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Route} from 'react-router'
import qs from 'query-string'

class QueryRouter extends Route {}
class QueryRoute {}

// This is a major hack to work around the limitations of
// react-router@3. Since the Route components are not rendered, we
// hijack the dynamic routing capability of the Router itself by
// providing our own `default` implementation of the `getComponent`
// prop. I believe that react-router@4 will let us do this better, but
// it completely revises the full API and will cause breaking changes
// to projects.

QueryRouter.defaultProps = {
    getComponent(nextState, cb) {
        const search = qs.parse(nextState.location.search)

        let matchedRoute = {}
        for (const childRoute of this.childRoutes) {
            const {param, value} = childRoute
            if (
                (typeof value === 'undefined' && param in search) ||
                (typeof value !== 'undefined' && search[param] === value)
            ) {
                matchedRoute = childRoute
                break
            }
        }

        matchedRoute.onEnter && matchedRoute.onEnter()

        // We need to copy the component from the child route into this component
        // As we reference it directly within the app container and template.jsx
        this.component = matchedRoute.component || this.defaultComponent
        this.routeName = matchedRoute.routeName || this.defaultRouteName

        cb(null, this.component)
    }
}

QueryRouter.propTypes = {
    defaultComponent: PropTypes.func.isRequired,
    defaultRouteName: PropTypes.string.isRequired
}

QueryRoute.propTypes = {
    routeName: PropTypes.string.isRequired
}

export {QueryRouter, QueryRoute}

// EXAMPLE USAGE IN <Router>
// <QueryRouter path="details" defaultComponent={ErrorPage} defaultRouteName="error">
//     <QueryRoute param="account" component={Account} routeName="account" />
//     <QueryRoute param="category" value="contact" component={ContactInfo} routeName="contactInfo" />
//     <QueryRoute param="category" value="purchases" component={PurchaseDetails} routeName="purchaseDetails" />
// </QueryRouter>
