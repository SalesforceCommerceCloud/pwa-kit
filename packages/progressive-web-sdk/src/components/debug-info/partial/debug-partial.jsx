/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const DebugPartial = ({
    buildOriginUrl,
    bundleId,
    className,
    cloudURL,
    isPreview,
    projectId,
    ssrTiming,
    target,
    version
}) => {
    const classes = classNames('pw-debug-info__content', className)

    return (
        <div className={classes}>
            {projectId && (
                <div className="pw-debug-info__item">
                    <h4 className="pw-debug-info__title">ProjectID</h4>
                    <p>{projectId}</p>
                </div>
            )}
            {bundleId && bundleId !== '0' && (
                <div className="pw-debug-info__item">
                    <h4 className="pw-debug-info__title">BundleID</h4>
                    <p>{bundleId}</p>
                </div>
            )}
            {isPreview && (
                <div className="pw-debug-info__item">
                    <h4 className="pw-debug-info__title">isPreview</h4>
                    <p>{isPreview.toString()}</p>
                </div>
            )}
            {target && (
                <div className="pw-debug-info__item">
                    <h4 className="pw-debug-info__title">Target</h4>
                    <p>{target}</p>
                </div>
            )}
            {buildOriginUrl && (
                <div className="pw-debug-info__item">
                    <h4 className="pw-debug-info__title">Origin</h4>
                    <p>{buildOriginUrl}</p>
                </div>
            )}
            {cloudURL && (
                <div className="pw-debug-info__item">
                    <h4 className="pw-debug-info__title">CloudURL</h4>
                    <a href={cloudURL} className="pw-debug-info__link">
                        cloud.mobify.com
                    </a>
                </div>
            )}
            {version && (
                <div className="pw-debug-info__item">
                    <h4 className="pw-debug-info__title">ProgressiveWebSDK</h4>
                    <p>v{version}</p>
                </div>
            )}

            <div className="pw-debug-info__table-label">Build Info</div>
            {ssrTiming && (
                <table className="pw-debug-info__table">
                    <tbody>
                        {ssrTiming.map((entry, idx) => {
                            return (
                                <tr key={idx} className="pw-debug-info__row">
                                    <td className="pw-debug-info__cell pw--name">{entry.name}</td>
                                    <td className="pw-debug-info__cell pw--duration">
                                        {entry.duration.toFixed(2)} mS
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}

DebugPartial.propTypes = {
    /**
     * Url of the Mobify Tag
     */
    buildOriginUrl: PropTypes.string,
    /**
     * Number of the currently deployed bundle
     */
    bundleId: PropTypes.string,
    /**
     * A CSS class name to be applied to the `DebugPartial` component's `<div>` wrapper.
     */
    className: PropTypes.string,
    /**
     * The cloud.mobify.com URL for the project
     */
    cloudURL: PropTypes.string,
    /**
     * Whether the site is in Preview mode
     */
    isPreview: PropTypes.bool,
    /**
     * Target company's project id
     */
    projectId: PropTypes.string,
    /**
     * SSR Timing values.
     */
    ssrTiming: PropTypes.array,
    /**
     * Build target
     */
    target: PropTypes.string,

    /**
     * Version of the Progressive-Web-SDK
     */
    version: PropTypes.string
}

export default DebugPartial
