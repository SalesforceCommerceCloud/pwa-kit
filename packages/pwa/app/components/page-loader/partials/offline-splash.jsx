import React from 'react'
import PropTypes from 'prop-types'

import Button from 'progressive-web-sdk/dist/components/button'
import DangerousHTML from 'progressive-web-sdk/dist/components/dangerous-html'
import offlineCloud from '../../../static/svg/offline-cloud.svg'

const OfflineBanner = ({retry}) => (
    <div className="c-page-loader__offline u-text-align-center">
        <DangerousHTML className="u-color-neutral-20" html={offlineCloud}>
            {(htmlObj) => <div dangerouslySetInnerHTML={htmlObj} />}
        </DangerousHTML>

        <h1 className="u-text-family u-padding">You are currently offline</h1>
        <p className="u-margin-bottom-lg">
            We couldn't load the next page on this connection. Please try again.
        </p>

        <Button className="c-page-loader__offline-button pw--primary" onClick={retry}>
            Retry Connection
        </Button>
    </div>
)

OfflineBanner.propTypes = {
    // Provided by React Loadable
    // Calling this function attempts to reload the component
    retry: PropTypes.func
}

export default OfflineBanner
