/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint-disable */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const CarouselPip = ({children, isCurrentPip, index, onClick}) => {
    const pipClasses = classNames('pw-carousel__pip', {'pw--active': isCurrentPip})
    return (
        <div
            className={pipClasses}
            onClick={() => onClick(index)}
            role="button"
            tabIndex={0}
            onKeyPress={() => onClick(index)}
        >
            <span className="u-visually-hidden">{children}</span>
        </div>
    )
}

CarouselPip.defaultProps = {
    currentSlideMessage: 'Current slide',
    slideMessage: 'Slide'
}

CarouselPip.propTypes = {
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    index: PropTypes.number,
    isCurrentPip: PropTypes.bool,
    onClick: PropTypes.func
}

CarouselPip.displayName = 'CarouselPip'

export default CarouselPip
