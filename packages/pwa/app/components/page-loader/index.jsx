import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'

import {getOfflineModeStartTime} from '../../selectors'
import OfflineSplash from './partials/offline-splash'
import SkeletonBlock from 'progressive-web-sdk/dist/components/skeleton-block'

/**
 * A loading screen component for use with react-loadable that handles
 * errors/retries encountered when asynchronously loading components in
 * offline mode.
 */
export class PageLoader extends React.Component {
    componentDidMount() {
        this.maybeRetry({}, this.props)
    }

    componentDidUpdate(prevProps) {
        this.maybeRetry(prevProps, this.props)
    }

    maybeRetry(prevProps, props) {
        // Handle errors loading the component in offline mode
        const shouldRetry =
            props.error &&
            props.offlineModeStartTime === null &&
            props.offlineModeStartTime !== prevProps.offlineModeStartTime
        if (shouldRetry) {
            props.retry()
        }
    }

    render() {
        const {error, retry} = this.props
        return (
            <div className="c-page-loader">
                {error ? (
                    <OfflineSplash retry={retry} />
                ) : (
                    <SkeletonBlock height="100%" width="100%" />
                )}
            </div>
        )
    }
}

PageLoader.propTypes = {
    // Provided by React Loadable
    // Indicates if an error occurred which prevented this component from loading
    error: PropTypes.instanceOf(Error),

    // The time when we went offline, or null
    offlineModeStartTime: PropTypes.number,

    // Provided by React Loadable
    // Calling this function attempts to reload the component
    retry: PropTypes.func
}

const mapStateToProps = createPropsSelector({
    offlineModeStartTime: getOfflineModeStartTime
})

export default connect(mapStateToProps)(PageLoader)
