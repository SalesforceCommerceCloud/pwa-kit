/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Link from '../link'

/**
 * Related component:
 *
 * * [Carousel](#!/Carousel)
 *
 * A single item to be displaced within the `Carousel` component.
 *
 * @example ./DESIGN.md
 */
const CarouselItem = ({
    active,
    isAnimating,
    isDragging,
    children,
    className,
    href,
    onClick,
    openInNewTab
}) => {
    const shouldRender = active || isAnimating || isDragging
    const Item = href ? Link : 'div'
    const itemProps = {
        className: classNames(
            `pw-carousel__item`,
            {
                'pw--active': active
            },
            className
        ),
        'aria-hidden': active ? 'false' : 'true',
        'aria-live': active ? 'polite' : '',
        onClick
    }
    const itemVisibility = {
        display: shouldRender ? 'block' : 'none'
    }

    if (href) {
        itemProps.href = href
        itemProps.openInNewTab = openInNewTab
    }

    return (
        <Item {...itemProps}>
            <div style={itemVisibility}>{children}</div>
        </Item>
    )
}

CarouselItem.propTypes = {
    /**
     * PROVIDED INTERNALLY: Defines if the item is active or not.
     */
    active: PropTypes.bool,

    /**
     * The contents of the carousel item, to be shown in the carousel.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * If specified, the component is rendered as a link, with this value set as the href.
     */
    href: PropTypes.string,

    /**
     * PROVIDED INTERNALLY: Defines if the item is animating or not.
     */
    isAnimating: PropTypes.bool,

    /**
     * PROVIDED INTERNALLY: Defines if the item is dragging or not.
     */
    isDragging: PropTypes.bool,

    /**
     * If rendered as a link, when the CarouselItem is clicked the corresponding link opens in a new tab.
     */
    openInNewTab: PropTypes.bool,

    /**
     * A callback to be called when the CarouselItem is clicked.
     */
    onClick: PropTypes.func
}

export default CarouselItem
