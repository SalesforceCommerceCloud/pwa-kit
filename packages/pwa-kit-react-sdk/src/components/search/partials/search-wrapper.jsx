/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import onClickOutside from 'react-onclickoutside'

class SearchWrapper extends React.Component {
    constructor(props) {
        super(props)

        this.handleBlur = this.handleBlur.bind(this)
    }

    handleClickOutside() {
        this.props.onClickOutside()
    }

    // This function is responsible for ensuring this component remains
    // accessible. Specifically, when a user "tabs" into and then out of the
    // parent Search component, the Search component should become unfocused
    // (i.e. the overlay mask should disappear)
    handleBlur() {
        setTimeout(() => {
            const focusIsInWrapper = this._wrapper.contains(document.activeElement)

            /* istanbul ignore else */
            if (!focusIsInWrapper) {
                this.props.onClickOutside()
            }
        }, 0)
    }

    render() {
        return (
            <div
                className="pw-search__inner"
                ref={(el) => {
                    this._wrapper = el
                }}
                onBlur={this.handleBlur}
            >
                {this.props.children}
            </div>
        )
    }
}

SearchWrapper.propTypes = {
    children: PropTypes.node,
    submitSearch: PropTypes.func,
    onChange: PropTypes.func,
    onClickOutside: PropTypes.func
}

export default onClickOutside(SearchWrapper)
