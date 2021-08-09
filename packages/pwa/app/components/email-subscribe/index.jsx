import React from 'react'
import PropTypes from 'prop-types'

import Button from 'progressive-web-sdk/dist/components/button'
import {getAnalyticsManager} from '../../analytics'

const analyticsManager = getAnalyticsManager()
const EMAIL_SUBSCRIBE_FORM_NAME = 'email-subscribe'

export const validate = (values) => {
    const errors = {}
    if ((values.email || '').search(/@mobify.com$/) < 0) {
        errors.email = 'Must be a @mobify.com email address'
    }
    return errors
}

class EmailSubscribe extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = {value: '', error: null}
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }
    handleChange(event) {
        this.setState({value: event.target.value})
    }

    handleSubmit(event) {
        const {onSubmit} = this.props
        const error = validate({email: this.state.value}).email
        if (error) {
            event.preventDefault()
            this.setState({error})
            analyticsManager.track('error', {
                name: 'emailSubscribe_form',
                content: error
            })
            return
        }

        if (onSubmit) onSubmit()
    }

    render() {
        return (
            <form
                id={EMAIL_SUBSCRIBE_FORM_NAME}
                className="c-email-subscribe"
                data-analytics-name={EMAIL_SUBSCRIBE_FORM_NAME}
                onSubmit={this.handleSubmit}
            >
                <div className="c-email-subscribe__form-field-row u-flexbox">
                    <div
                        className={`c-email-subscribe__form-field u-flex ${
                            this.state.error ? 'c-email-subscribe__form-field-error' : ''
                        }`}
                    >
                        <div className="c-email-subscribe__form-field-inner">
                            <div className="c-email-subscribe__form-field-label-wrap">
                                <label
                                    className="c-email-subscribe__form-field-label"
                                    htmlFor="email"
                                >
                                    {'Email Address'}
                                </label>
                            </div>
                            <div className="c-email-subscribe__form-field-input">
                                <input
                                    id="email"
                                    type="email"
                                    data-analytics-name="email"
                                    className="u-flex"
                                    required
                                    onChange={this.handleChange}
                                    value={this.state.value}
                                />
                            </div>
                            {this.state.error && (
                                <div className="c-email-subscribe__form-field-error-text">
                                    {this.state.error}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="c-email-subscribe__form-field c-email-subscribe__button u-flex-none u-margin-start-0">
                        <div className="c-email-subscribe__form-field-inner">
                            <div className="c-email-subscribe__form-field-input">
                                <div
                                    className="c-email-subscribe__form-field-label"
                                    aria-hidden="true"
                                >
                                    {'Email Address'}
                                </div>
                                <Button type="submit" className="pw--primary">
                                    Submit
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        )
    }
}

EmailSubscribe.propTypes = {
    /**
     * Handler that is triggers when the form is submitted
     */
    onSubmit: PropTypes.func
}

export default EmailSubscribe
