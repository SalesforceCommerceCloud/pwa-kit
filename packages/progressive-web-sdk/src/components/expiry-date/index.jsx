/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {expiryFormat, toStoreValueDecorator} from '../../card-utils'

import InputMask from 'react-input-mask'

/**
 * An input field to capture credit card's expiry dates
 *
 * @example ./DESIGN.md
 */

const ExpiryDate = ({className, placeholder, defaultValue, onChange, onBlur}) => {
    const classes = classNames('pw-expiry-date', className)

    return (
        <div className={classes}>
            <InputMask
                type="tel"
                placeholder={placeholder}
                defaultValue={defaultValue}
                onChange={toStoreValueDecorator(onChange, expiryFormat)}
                onBlur={toStoreValueDecorator(onBlur, expiryFormat)}
                mask="99/99"
                maskChar={null}
                data-analytics-name="card_expiry_date"
            />
        </div>
    )
}

ExpiryDate.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Adds a default value to input
     */
    defaultValue: PropTypes.string,

    /**
     * Adds a placeholder.
     */
    placeholder: PropTypes.string,

    /**
     * PROVIDED INTERNALLY: OnBlur callback with signature `(eventOrValue) => undefined`
     * (passed in by redux-form).
     */
    onBlur: PropTypes.func,

    /**
     * PROVIDED INTERNALLY: OnChange callback with signature `(eventOrValue) => undefined`
     * (passed in by redux-form).
     */
    onChange: PropTypes.func
}

export default ExpiryDate
