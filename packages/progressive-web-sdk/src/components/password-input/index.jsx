/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Button from '../button'

/**
 * An input field to capture passwords.
 * Allows the user to toggle if their password should be visible or masked.
 */

class PasswordInput extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            passwordVisible: this.props.showPassword || false
        }

        this.toggleVisibility = this.toggleVisibility.bind(this)
        this.getChildren = this.getChildren.bind(this)
    }

    toggleVisibility(evt) {
        evt.preventDefault()
        this.setState({
            passwordVisible: !this.state.passwordVisible
        })
    }

    getChildren() {
        const {hideButtonText, buttonTextHide, buttonTextShow} = this.props

        const {passwordVisible} = this.state

        // if hideButtonText is true, do not show buttonText. Otherwise toggle text with passwordVisible.
        if (hideButtonText) {
            return null
        } else {
            return passwordVisible ? buttonTextHide : buttonTextShow
        }
    }

    render() {
        /* eslint-disable */
        const {
            className,
            buttonClassName,
            buttonIconName,
            buttonIconSize,
            buttonTextHide,
            buttonTextShow,
            hideButtonText,
            analyticsName,
            showPassword,
            ...inputProps
        } = this.props
        /* eslint-enable */

        const {passwordVisible} = this.state

        const classes = classNames('pw-password-input', className)

        const toggleClasses = classNames(
            'pw-password-input__toggle',
            {
                'pw--inactive': !passwordVisible,
                'pw--is-text': !hideButtonText
            },
            buttonClassName
        )

        return (
            <div className={classes}>
                <input
                    {...inputProps}
                    type={passwordVisible ? 'text' : 'password'}
                    data-analytics-name={analyticsName}
                />
                <Button
                    className={toggleClasses}
                    icon={buttonIconName}
                    iconSize={buttonIconSize}
                    title={passwordVisible ? buttonTextHide : buttonTextShow}
                    onClick={this.toggleVisibility}
                    data-analytics-name="toggle_password_text"
                >
                    {this.getChildren()}
                </Button>
            </div>
        )
    }
}

PasswordInput.defaultProps = {
    buttonClassName: 'pw--blank',
    buttonTextShow: 'Show Password',
    buttonTextHide: 'Hide Password',
    buttonIconSize: 'large'
}

PasswordInput.propTypes = {
    /**
     * Adds values to the `analytics-name` attribute of the input
     */
    analyticsName: PropTypes.string,

    /**
     * Adds values to the `class` attribute of the toggle button
     */
    buttonClassName: PropTypes.string,

    /**
     * Identifier for the desired icon within the toggle button
     */
    buttonIconName: PropTypes.string,

    /**
     * The size of the icon within the toggle button
     */
    buttonIconSize: PropTypes.string,

    /**
     * The text of the toggle button when the password is visible.
     * This text is also used for accessibility.
     */
    buttonTextHide: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The text of the toggle button when the password is masked
     * This text is also used for accessibility.
     */
    buttonTextShow: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Determines if button has text or not
     */
    hideButtonText: PropTypes.bool,

    /**
     * Determines if password is shown
     */
    showPassword: PropTypes.bool
}

export default PasswordInput
