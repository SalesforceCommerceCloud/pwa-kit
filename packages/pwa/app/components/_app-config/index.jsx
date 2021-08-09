import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {getConnector} from '../../connector'

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */
const AppConfig = (props) => {
    return <Fragment>{props.children}</Fragment>
}

AppConfig.restore = () => undefined

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = () => {
    return {
        connector: getConnector()
    }
}

AppConfig.propTypes = {
    children: PropTypes.node
}

export default AppConfig
