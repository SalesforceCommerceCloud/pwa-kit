/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {onKeyUpWrapper} from '../../../a11y-utils'

import Link from '../../link'

const TilePrimary = ({href, children, onClick}) => {
    const tileProps = {
        className: 'pw-tile__primary'
    }

    if (onClick) {
        tileProps.onClick = onClick
    }

    if (href) {
        return (
            <Link href={href} {...tileProps}>
                {children}
            </Link>
        )
    } else {
        // Disabling the jsx-a11y/no-static-element-interactions rule because
        // there are some cases where we want the this container to behave as a
        // button, but it also contains a button. Nesting buttons inside buttons
        // in not valid markup.
        //
        // @url: https://developer.mozilla.org/en/docs/Web/HTML/Element/button
        /* eslint-disable jsx-a11y/no-static-element-interactions */
        const a11y = onClick && {
            role: 'button',
            tabIndex: '0',
            onKeyUp: onKeyUpWrapper(onClick),
            onClick
        }
        return (
            <div {...a11y} {...tileProps}>
                {children}
            </div>
        )
        /* eslint-enable jsx-a11y/no-static-element-interactions */
    }
}

TilePrimary.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    href: PropTypes.string,
    onClick: PropTypes.func
}

export default TilePrimary
