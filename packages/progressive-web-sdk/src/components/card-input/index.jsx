/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {getCardData, toStoreValueDecorator, registerCardDataMap} from '../../card-utils'

import Icon from '../icon'
import InputMask from 'react-input-mask'

const getMask = (cardFormat, value) => {
    // Get number length because certain credit card types have specific
    // patterns for different number lengths
    const valueCount = value.length
    const formatPattern = cardFormat[valueCount] ? cardFormat[valueCount] : cardFormat.default

    let mask = ''
    formatPattern.forEach((chunk) => {
        mask += `${'9'.repeat(chunk)} `
    })

    return mask.trim()
}

/**
 * An input field to capture credit card numbers. Formats the card number
 * as it is displayed on a user's card and detects the card issuer.
 * Note that `onChange` and `onBlur` are called with the changed *value*
 * not an event. This is compatible with redux-form and allows the stored
 * value to differ from the displayed one.
 *
 * @example ./DESIGN.md
 */
const CardInput = (props) => {
    const {value, onChange, onBlur, className, ccType, placeholder, defaultValue, maskChar} = props

    const cardData = getCardData(value)
    const cardType = cardData.cardType
    const cardFormat = cardData.format
    const mask = getMask(cardFormat, value)
    const iconName = ccType
        ? ccType.toLowerCase().replace(/ /g, '-')
        : cardType.toLowerCase().replace(/ /g, '-')

    const classes = classNames('pw-card-input', className)
    const iconClasses = classNames(
        'pw-card-input__card-icon',
        `pw-card-input__card-icon--${iconName}`
    )

    return (
        <div className={classes}>
            <InputMask
                type="tel"
                onChange={toStoreValueDecorator(onChange, cardFormat)}
                onBlur={toStoreValueDecorator(onBlur, cardFormat)}
                mask={mask}
                maskChar={maskChar}
                placeholder={placeholder}
                defaultValue={defaultValue}
                data-analytics-name="card_number"
            />

            <Icon
                className={iconClasses}
                name={`cc-${iconName}`}
                title={ccType ? ccType : cardType}
            />
        </div>
    )
}

CardInput.registerCustomFormat = registerCardDataMap

CardInput.defaultProps = {
    maskChar: null
}

CardInput.propTypes = {
    /**
     * Type of credit card that is not detected by card number.
     */
    ccType: PropTypes.string,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Adds a default value to input
     */
    defaultValue: PropTypes.string,

    /**
     * Character to cover unfilled parts of the mask. Default is `null`,unfilled
     * parts will be empty as in ordinary input.
     */
    maskChar: PropTypes.string,

    /**
     * Adds a placeholder.
     */
    placeholder: PropTypes.string,

    /**
     * PROVIDED INTERNALLY: The value of the field (passed in by redux-form).
     */
    value: PropTypes.string,

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

export default CardInput
