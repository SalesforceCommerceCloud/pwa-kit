/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

import Button from '../../button'
import Icon from '../../icon'

const CarouselButton = ({
    className,
    buttonClass,
    onClick,
    disabled,
    icon,
    iconSize,
    title,
    analyticsContent
}) => {
    return (
        <div className={className}>
            <Button
                className={buttonClass}
                onClick={onClick}
                disabled={disabled}
                data-analytics-name="carousel"
                data-analytics-content={analyticsContent}
            >
                <Icon name={icon} size={iconSize} title={title} />
            </Button>
        </div>
    )
}

CarouselButton.propTypes = {
    analyticsContent: PropTypes.string,
    buttonClass: PropTypes.string,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    icon: PropTypes.string,
    iconSize: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    onClick: PropTypes.func
}

export default CarouselButton
