import React from 'react'
import PropTypes from 'prop-types'
import {Context} from 'react-responsive'
import {getBreakpoints} from 'progressive-web-sdk/dist/utils/universal-utils'
import {runningServerSide} from 'progressive-web-sdk/dist/utils/utils'

/**
 * Wraps react-responsive's Context component and forces a re-render on the client
 * side to fix incorrect viewport size guesses on the server. Server-side guesses
 * are based on user-agents and are not 100% reliable.
 *
 * See:
 *
 *  - https://reactjs.org/docs/react-dom.html#hydrate
 *  - https://github.com/contra/react-responsive/issues/162
 */
class ResponsiveContext extends React.Component {
    constructor(props) {
        super(props)
        const breakpointName = window.Progressive.viewportSize
        const breakpointWidth = getBreakpoints()[breakpointName]
        this.state = {
            value: {
                width: Math.max(breakpointWidth, 1)
            }
        }
    }

    componentDidMount() {
        // Set value to undefined so that react-responsive uses match media on the
        // client instead of a hard-coded default value. This also fixes incorrect
        // guesses on the server-side.
        if (!runningServerSide()) {
            this.setState({value: undefined})
        }
    }

    render() {
        const {children} = this.props
        const {value} = this.state
        return <Context.Provider value={value}>{children}</Context.Provider>
    }
}

ResponsiveContext.propTypes = {
    children: PropTypes.node,
    store: PropTypes.object
}

export default ResponsiveContext
