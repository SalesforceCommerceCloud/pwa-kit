import React from 'react'
import PropTypes from 'prop-types'
import {Context} from 'react-responsive'
import {DEVICE_SIZES} from '../../responsive-config'
import DeviceContext from 'progressive-web-sdk/dist/ssr/universal/device-context'

/**
 * Wraps react-responsive's Context component and forces a re-render on the client
 * side to fix incorrect types reported by the server. Device types are parsed from
 * user-agent headers and are not 100% accurate.
 *
 * See:
 *
 *  - https://reactjs.org/docs/react-dom.html#hydrate
 *  - https://github.com/contra/react-responsive/issues/162
 */
class ResponsiveContainer extends React.Component {
    constructor(props, context) {
        super(props, context)
        const deviceType = props.deviceType || (context && context.type)
        this.state = {
            deviceType
        }
    }

    componentDidMount() {
        // Set deviceType to undefined on the client so that react-responsive
        // uses match-media instead of the fixed deviceType passed in as a prop.
        // This causes the client to render based on the real device dimensions,
        // rather than those inferred from the user-agent on the server.
        this.setState({deviceType: undefined})
    }

    render() {
        const {children} = this.props
        const {deviceType} = this.state
        const value = deviceType ? {width: DEVICE_SIZES[deviceType]} : undefined
        return <Context.Provider value={value}>{children}</Context.Provider>
    }
}

ResponsiveContainer.propTypes = {
    children: PropTypes.node,
    deviceType: PropTypes.string,
    store: PropTypes.object
}

ResponsiveContainer.contextType = DeviceContext

export default ResponsiveContainer
