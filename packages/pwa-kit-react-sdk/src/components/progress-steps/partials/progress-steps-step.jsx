/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import Link from '../../link'

const ProgressStepsStep = ({href, className, children, onClick}) => {
    if (href || onClick) {
        return (
            <Link href={href} onClick={onClick} className={className}>
                {children}
            </Link>
        )
    } else {
        return <div className={className}>{children}</div>
    }
}

ProgressStepsStep.propTypes = {
    /**
     * The content of the ProgressStepsItem.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * If provided, the ProgressStepsItem will render as a Link to this URL.
     */
    href: PropTypes.string,

    /**
     * If provided, the ProgressStepsItem will render as a Link.
     * When clicked, this function will be called.
     */
    onClick: PropTypes.func
}

export default ProgressStepsStep
