/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import Button from '../button'
import classNames from 'classnames'

export const DefaultStartContent = ({atRoot, onClick}) => {
    const backClasses = classNames('pw-nav-header__button', 'pw-nav-header__back')
    return (
        !atRoot && (
            <Button className={backClasses} onClick={onClick}>
                Back
            </Button>
        )
    )
}

DefaultStartContent.propTypes = {
    atRoot: PropTypes.bool,
    onClick: PropTypes.func
}

export const DefaultEndContent = ({onClick}) => {
    const closeClasses = classNames('pw-nav-header__button', 'pw-nav-header__close')
    return (
        <Button className={closeClasses} onClick={onClick}>
            Close
        </Button>
    )
}

DefaultEndContent.propTypes = {
    onClick: PropTypes.func
}
