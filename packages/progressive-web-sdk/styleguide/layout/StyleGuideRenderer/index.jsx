import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import DangerousHTML from '../../../src/components/dangerous-html' // eslint-disable-line import/no-extraneous-dependencies
import sprite from '../../svg/sprite-dist/sprite.svg'
import arrow from '../../svg/arrow.svg'

import '../../styleguide.scss'

// This is required in order for code split chunks to download from the correct domain.
// window.Mobify.version is exposed by documentation-theme
const s3Path = `progressive-web/${window.Mobify.version}/styleguidist/`
if (window.location.host === 'docs.mobify.com') {
    __webpack_public_path__ = `https://docs.mobify.com/${s3Path}` // eslint-disable-line camelcase, no-undef
} else if (window.location.host === 'docs-staging.mobify.com') {
    __webpack_public_path__ = `https://docs-staging.mobify.com/${s3Path}` // eslint-disable-line camelcase, no-undef
} else if (window.location.host === 'docs-testing.mobify.com.s3-website-us-east-1.amazonaws.com') {
    __webpack_public_path__ = `http://docs-testing.mobify.com.s3-website-us-east-1.amazonaws.com/${s3Path}` // eslint-disable-line camelcase, no-undef
} else {
    __webpack_public_path__ = 'http://localhost:9002/' // eslint-disable-line camelcase, no-undef
}

const StyleGuideRenderer = ({children}) => {
    const {sections} = children.props
    let count = 0

    sections.forEach(({components}) => {
        count += components.length
    })

    const isContent = count > 1

    const renderContentOrChildren = () => {
        if (isContent) {
            return (
                <div className="u-margin-top-massive u-padding-top-massive">
                    <p className="u-margin-top-xl">
                        Choose a component to get started. Want a brief description of each
                        component? Check out the listing page for{' '}
                        <a href="all">All Components and Templates</a>.
                    </p>
                    <div className="rsg-style-guide__arrow">
                        <DangerousHTML html={arrow}>
                            {(htmlObj) => <div dangerouslySetInnerHTML={htmlObj} />}
                        </DangerousHTML>
                    </div>
                </div>
            )
        } else {
            return children
        }
    }

    const classes = classNames('rsg-style-guide', {
        'rsg-style-guide--is-top-level': isContent
    })

    return (
        <div className={classes}>
            <DangerousHTML html={sprite}>
                {(htmlObj) => <div hidden dangerouslySetInnerHTML={htmlObj} />}
            </DangerousHTML>

            <div className="rsg-components">
                <div className="rsg-components__component-section">
                    <div>
                        <a href="all/">← All Components and Templates</a>
                    </div>
                    {renderContentOrChildren()}
                </div>
            </div>
        </div>
    )
}

StyleGuideRenderer.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    toc: PropTypes.node.isRequired,
    classes: PropTypes.object,
    hasSidebar: PropTypes.bool
}

export default StyleGuideRenderer
