import React from 'react'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'
import PropTypes from 'prop-types'

import Link from 'progressive-web-sdk/dist/components/link'
import ListTile from 'progressive-web-sdk/dist/components/list-tile'

import * as actions from './actions'
import * as globalSelectors from '../../selectors'
import {trackPageLoad} from '../../page-actions'

class Home extends React.Component {
    constructor(props) {
        super(props)
        this.pageType = 'home'
    }

    componentDidMount() {
        const {trackPageLoad, initializeHome} = this.props

        // Set page-specific headers or status codes in your `trackPageLoad` call.
        trackPageLoad(initializeHome(), this.pageType, (result) => {
            const responseOpts = {statusCode: result.statusCode}
            if (responseOpts.statusCode === 200) {
                responseOpts.headers = {
                    'Cache-Control': 'max-age=0, s-maxage=3600'
                }
            }
            return responseOpts
        })
    }

    render() {
        return (
            <div className="t-home">
                <h1 className="u-padding-top-md u-margin-bottom-sm">Homepage</h1>
                <p className="u-margin-bottom-md">Tips for getting started on this page:</p>
                <ListTile className="pw--instructional-block">
                    <div>
                        Replace dummy products with real data using Commerce Integrations.&nbsp;
                        <Link
                            className="pw--underline"
                            openInNewTab
                            href="https://docs.mobify.com/commerce-integrations/latest/"
                        >
                            Read the guide
                        </Link>
                    </div>
                </ListTile>

                <ListTile className="pw--instructional-block">
                    <div>
                        Learn more about the grey columns which make up the responsive grid.&nbsp;
                        <Link
                            className="pw--underline"
                            openInNewTab
                            href="https://docs.mobify.com/progressive-web/latest/guides/responsive-grid/"
                        >
                            Read the guide
                        </Link>
                    </div>
                </ListTile>

                <div className="u-padding-bottom-lg">
                    View more guides on&nbsp;
                    <Link className="pw--underline" openInNewTab href="https://docs.mobify.com">
                        docs.mobify.com
                    </Link>
                </div>
            </div>
        )
    }
}

Home.propTypes = {
    initializeHome: PropTypes.func,
    trackPageLoad: PropTypes.func,
    uiState: PropTypes.object
}

export {Home as UnconnectedHome}

const mapStateToProps = createPropsSelector({
    uiState: globalSelectors.getHome
})

const mapDispatchToProps = {
    trackPageLoad,
    initializeHome: actions.initializeHome
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Home)
