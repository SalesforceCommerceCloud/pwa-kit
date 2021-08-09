/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '../../icon'
import Image from '../../image'

/**
 * Rating is used to display an average user satisfaction level of a product, it
 * is the summary of the ratings given by users in the product reviews section.
 *
 * @example ./DESIGN.md
 */

const RatingIcon = ({name, src, modifierClass}) => {
    const iconClasses = classNames('pw-rating__icon', modifierClass)

    return (
        <div className={iconClasses}>
            {src ? <Image role="presentation" src={src} /> : <Icon name={name} />}
        </div>
    )
}

RatingIcon.propTypes = {
    /**
     * PROVIDED INTERNALLY: The addtional classes to be used for the RatingIcon div
     */
    modifierClass: PropTypes.string,
    /**
     * PROVIDED INTERNALLY: The name of the icon to be used
     */
    name: PropTypes.string,
    /**
     * PROVIDED INTERNALLY: The URL of the image to be used. Icon is used otherwise.
     */
    src: PropTypes.string
}

RatingIcon.displayName = 'RatingIcon'

export default RatingIcon
