/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Card component is used to show content in a card with header and footer
 */

const Card = ({
    className,
    header,
    children,
    footer,
    hasShadow,
    hasBorder,
    headerClassName,
    innerClassName,
    itemScope,
    itemType
}) => {
    const classes = classNames(
        'pw-card',
        {
            'c--shadow': hasShadow,
            'c--border': hasBorder
        },
        className
    )

    const headerClasses = classNames('pw-card__header', headerClassName)

    const innerClasses = classNames('pw-card__inner', innerClassName)

    return (
        <article className={classes} itemScope={itemScope} itemType={itemType}>
            <div className={innerClasses}>
                {header && <header className={headerClasses}>{header}</header>}
                <div className="pw-card__content">{children}</div>

                {footer && <footer className="pw-card__footer">{footer}</footer>}
            </div>
        </article>
    )
}

Card.propTypes = {
    /**
     * Main content of the card
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Footer content of the card
     */
    footer: PropTypes.node,

    /**
     * Determines if card has border
     */
    hasBorder: PropTypes.bool,

    /**
     * Determines if card has box-shadow
     */
    hasShadow: PropTypes.bool,

    /**
     * Header content of the card
     */
    header: PropTypes.node,
    /**
     * Classes to add to the header
     */
    headerClassName: PropTypes.string,
    /**
     * Classes to add to the inner container of the component
     */
    innerClassName: PropTypes.string,
    /**
     * A value for the itemScope attribute
     * used to provide microdata to a page for SEO
     * https://www.w3.org/TR/microdata/
     */
    itemScope: PropTypes.bool,
    /**
     * A value for the itemType attribute
     * used to provide microdata to a page for SEO
     * https://www.w3.org/TR/microdata/
     */
    itemType: PropTypes.string
}

export default Card
