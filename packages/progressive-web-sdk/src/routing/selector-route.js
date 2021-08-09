/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {jqueryResponse} from '../jquery-response'
import {makeRequest} from '../utils/fetch-utils'
import {Route} from 'react-router'

class SelectorRouter extends Route {}

class SelectorRoute {}

SelectorRouter.defaultProps = {
    onChange(prevState, nextState, replace, cb) {
        // Manually call getComponent,
        // as it isn't always called when the route changes
        this.getComponent(nextState, (_, comp) => {
            this.component = comp
            cb()
        })
    },
    onLeave() {
        delete this.component
        delete this.routeName
    },
    getComponent(nextState, cb) {
        const {pathname, search} = nextState.location

        const url = `${pathname}${search}`
        const request = this.makeRequest ? this.makeRequest(url) : makeRequest(url)
        return request
            .catch(() => {
                this.handleFetchError && this.handleFetchError()
            })
            .then(jqueryResponse)
            .then(
                // eslint-disable-next-line no-unused-vars
                ([$, $doc]) => {
                    for (const childRoute of this.childRoutes) {
                        if ($doc.find(childRoute.selector).length) {
                            return childRoute
                        }
                    }
                    throw Error('no selector matched')
                }
            )
            .catch(() => ({
                component: this.defaultComponent,
                routeName: this.defaultRouteName
            }))
            .then((matchedRoute) => {
                matchedRoute.onEnter && matchedRoute.onEnter()
                return matchedRoute
            })
            .then((matchedRoute) => {
                // We need to copy the component from the child route into this component
                // As we reference it directly within the app container and template.jsx
                this.component = matchedRoute.component
                this.routeName = matchedRoute.routeName

                return cb(null, this.component)
            })
    }
}

SelectorRouter.propTypes = {
    defaultComponent: PropTypes.func.isRequired,
    defaultRouteName: PropTypes.string.isRequired
}

SelectorRoute.propTypes = {
    routeName: PropTypes.string.isRequired
}

export {SelectorRouter, SelectorRoute}

//  EXAMPLE USAGE IN <Router>
// <SelectorRouter path="potions*" defaultComponent={PLP} defaultRouteName="productListPage">
//     <SelectorRoute selector=".category-view2" component={Example} routeName="example" />
//     <SelectorRoute selector=".pdp-content" component={Example2} routeName="example2" />
// </SelectorRouter>
