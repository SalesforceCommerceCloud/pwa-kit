/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Button from '../button'

const noop = () => undefined

/**
 * Related component:
 *
 * * [Swatch](#!/Swatch)
 *
 * This component is used to display items inside `Swatch` component.
 *
 * @example ./DESIGN.md
 */

const SwatchItem = (props) => {
    const {
        analyticsContent,
        analyticsName,
        children,
        className,
        color,
        disabled,
        label,
        selected,
        value,

        onClick
    } = props

    const itemClasses = classNames(
        'pw-swatch__item',
        {
            'pw--selected': selected
        },
        className
    )

    const chipClasses = classNames('pw-swatch__chip', {
        'pw--disabled': disabled
    })

    const buttonClasses = classNames('pw-swatch__button', {
        'pw--active': selected
    })

    return (
        <div className={itemClasses} key={value}>
            <Button
                className={buttonClasses}
                innerClassName="pw-swatch__button-inner"
                disabled={disabled}
                onClick={() => onClick(value)}
                role="radio"
                aria-checked={selected}
                data-analytics-name={`swatch:${analyticsName}`}
                data-analytics-content={analyticsContent}
            >
                <div className={chipClasses}>
                    <div className="pw-swatch__chip-inner" style={{backgroundColor: color}}>
                        {children}
                    </div>
                </div>

                {label && <div className="pw-swatch__outer-label">{label}</div>}
            </Button>
        </div>
    )
}

SwatchItem.defaultProps = {
    onClick: noop
}

SwatchItem.propTypes = {
    /**
     * Adds values to the `data-analytics-content` attribute of the input
     */
    analyticsContent: PropTypes.string,
    /**
     * Adds values to the `data-analytics-name` attribute of the input
     */
    analyticsName: PropTypes.string,
    /**
     * The children to be rendered within the chip.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * If a valid hex or CSS rgb color is provided here,
     * it will be shown as the background-color of the tile.
     */
    color: PropTypes.string,

    /**
     * Indicates if this option is disabled.
     */
    disabled: PropTypes.bool,

    /**
     * The label to display for the option. This is rendered outside of the chip.
     */
    label: PropTypes.node,

    /**
     * PROVIDED INTERNALLY. Indicates if the option is selected.
     */
    selected: PropTypes.bool,

    /**
     * The value for the option.
     */
    value: PropTypes.string,

    /**
     * PROVIDED INTERNALLY.
     * If you wish to call a function when a SwatchItem is clicked,
     * use the Swatch's onChange prop.
     * This function is called whenever the user selects an option.
     * It is passed the new value.
     */
    onClick: PropTypes.func
}

export default SwatchItem
