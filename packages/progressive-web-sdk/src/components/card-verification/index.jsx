/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '../icon'
import {
    AMERICAN_EXPRESS,
    toDisplayValue,
    toStoreValueDecorator,
    getCardData
} from '../../card-utils'

/**
 * Card Verification Value (CVV). The number is displayed in front of the card for Amex and on the back for rest of
 * credit cards
 *
 * @example ./DESIGN.md
 */

const CardVerification = ({
    CVVHintAmex,
    CVVHintDefault,
    className,
    cardNumber,
    value,
    onChange,
    onBlur
}) => {
    const cardData = getCardData(cardNumber)
    const cardType = cardData.cardType
    const cvvFormat = cardData.cvv
    const iconName = cvvFormat.iconName
    const displayValue = toDisplayValue(value, cvvFormat)
    const classes = classNames('pw-card-verification', className)
    const iconClasses = classNames(
        'pw-card-verification__icon',
        `pw-card-verification__icon--${iconName}`
    )

    return (
        <div className={classes}>
            <input
                type="tel"
                onChange={toStoreValueDecorator(onChange, cvvFormat)}
                onBlur={toStoreValueDecorator(onBlur, cvvFormat)}
                value={displayValue}
                data-analytics-name="card_verification"
            />

            <Icon
                className={iconClasses}
                name={iconName}
                title={cardType === AMERICAN_EXPRESS ? CVVHintAmex : CVVHintDefault}
            />
        </div>
    )
}

CardVerification.defaultProps = {
    CVVHintAmex: 'CVV number is on the front',
    CVVHintDefault: 'CVV number is on the back'
}

CardVerification.propTypes = {
    /**
     * CVV hint for American Express cards.
     */
    CVVHintAmex: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * CVV hint for most credit cards.
     */
    CVVHintDefault: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The credit card number to determine whether it's Amex or any other card.
     */
    cardNumber: PropTypes.string,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The value of CVV.
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

export default CardVerification
