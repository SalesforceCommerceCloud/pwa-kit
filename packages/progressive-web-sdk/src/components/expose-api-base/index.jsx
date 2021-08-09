/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {Component} from 'react'
import PropTypes from 'prop-types'
import {browserHistory} from '../../routing'
import isReactRoute from '../../routing/is-react-route'

/**
 * Base PWA methods exposed to **window.Progressive.api** namescope
 *
 * 1. **navigate(pathOrUrl)**
 *
 *      Invokes PWA navigation
 *
 *      **Usage example:**
 *
 *          window.Progressive.api.navigate('/');
 **/
class ExposeApiBase extends Component {
    componentDidMount() {
        if (window.Progressive && window.Progressive.api) {
            return
        }

        window.Progressive = window.Progressive || {}
        window.Progressive.api = this.buildProgressiveApi()
    }

    buildProgressiveApi() {
        return {
            navigate: (url) => {
                /* istanbul ignore next */
                if (isReactRoute(url)) {
                    browserHistory.push({pathname: url})
                } else {
                    window.location.href = url
                }
            }
        }
    }

    render() {
        return null
    }
}

// This is defined so that styleguidist can auto generate doc for this component
ExposeApiBase.propTypes = {
    /**
     * This component doesn't take any props
     */
    none: PropTypes.node
}

export default ExposeApiBase
