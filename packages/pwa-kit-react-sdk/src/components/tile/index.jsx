/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Image from '../image'
import Rating from '../rating'
import TilePrimary from './partials/tile-primary'

/**
 * `Tile` Component is used to display product/category list.
 * It includes 4 variants (row, column, row+full and column+full).
 * It accepts image, product info (title, quantity, ...) and ratings.
 *
 * @example ./DESIGN.md
 */

const Tile = ({
    className,
    imageProps,
    href,
    title,
    options,
    price,
    quantity,
    quantityLabel,
    onClick,
    ratingProps,
    isColumn,
    isFull,
    isSimple
}) => {
    const classes = classNames(
        'pw-tile',
        {
            'pw--column': isColumn,
            'pw--full': isFull,
            'pw--simple': isSimple
        },
        className
    )

    return (
        <article className={classes}>
            <TilePrimary href={href} onClick={onClick}>
                {/* eslint-disable jsx-a11y/img-has-alt */}
                <Image {...imageProps} />
                {/* eslint-enable jsx-a11y/img-has-alt */}
            </TilePrimary>

            <div className="pw-tile__details">
                <div className="pw-tile__info">
                    <div className="pw-tile__info-inner">
                        <header className="pw-tile__header">
                            <TilePrimary className="pw-tile__title" href={href} onClick={onClick}>
                                {title}
                            </TilePrimary>
                        </header>

                        {options && (
                            <div className={`pw-tile__options`}>
                                {options.map((option, idx) => (
                                    <div className={`pw-tile__option`} key={idx}>
                                        {option.label}
                                        {option.value}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {ratingProps && (
                        <Rating
                            {...ratingProps}
                            className={classNames(`pw-tile__rating-stars`, ratingProps.className)}
                        />
                    )}
                </div>
                <div className={`pw-tile__footer`}>
                    <div className={`pw-tile__footer-inner`}>
                        <div className={`pw-tile__quantity`}>
                            {quantityLabel}
                            {quantity}
                        </div>
                        <div className={`pw-tile__price`}>{price}</div>
                    </div>
                </div>
            </div>
        </article>
    )
}

Tile.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * If provided, element will render as a link.
     */
    href: PropTypes.string,

    /**
     * The properties for Image.
     */
    imageProps: PropTypes.object,

    /**
     * Defines if Tile is column.
     */
    isColumn: PropTypes.bool,

    /**
     * Defines if Tile is a bigger version.
     */
    isFull: PropTypes.bool,

    /**
     * Defines if Tile is a simplified version.
     */
    isSimple: PropTypes.bool,

    /**
     * An array of information related to the product.
     */
    options: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            value: PropTypes.string
        })
    ),

    /**
     * Price of the product.
     */
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Quantity of the product.
     */
    quantity: PropTypes.number,

    /**
     * Label for quantity of the product.
     */
    quantityLabel: PropTypes.string,

    /**
     * The properties for Rating.
     */
    ratingProps: PropTypes.object,

    /**
     * Title of the product.
     */
    title: PropTypes.string,

    /**
     * Callback for when the primary is clicked. Not called if an href is passed.
     */
    onClick: PropTypes.func
}

export default Tile
