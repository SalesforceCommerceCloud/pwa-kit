/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Button from '../button'
import Icon from '../icon'
import {onKeyUpWrapper} from '../../a11y-utils'
import {noop} from '../../utils/utils'
import PopoverSuggestions from './partials/popover-suggestions'
import TakeoverSuggestions from './partials/takeover-suggestions'
import SearchWrapper from './partials/search-wrapper'

const searchId = (() => {
    let i = 0
    return () => {
        return i++
    }
})()

/**
 * `Search` component that includes two variants: inline and overlay.
 * This component is commonly used in the header.
 *
 * @example ./DESIGN.md
 */

class Search extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            searchValue: '',
            isActive: false,
            id: `search-${searchId()}`
        }

        this.componentDidUpdate = this.componentDidUpdate.bind(this)
        this.focusInput = this.focusInput.bind(this)
        this.blurInput = this.blurInput.bind(this)
        this.resetInput = this.resetInput.bind(this)
        this.clearInput = this.clearInput.bind(this)
        this.closeSearch = this.closeSearch.bind(this)
        this.submitSearch = this.submitSearch.bind(this)
        this.clickSuggestion = this.clickSuggestion.bind(this)
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.isOpen && this.props.isOpen) {
            this.focusInput()
        }
        const componentWasOpen = prevProps.isOpen && !this.props.isOpen
        const componentWasActive = prevState.isActive && !this.state.isActive
        if (componentWasOpen || (componentWasActive && !this.props.allowPageInteractions)) {
            this.resetInput()
        }
    }

    resetInput() {
        this.setState({
            searchValue: ''
        })
    }

    clearInput() {
        this.resetInput()
        this.focusInput()
        this.props.onClear()
    }

    focusInput() {
        this.input.focus()
    }

    // @TODO: check and make sure this doesn't break accessibility
    blurInput() {
        this.input.blur()
    }

    closeSearch(e) {
        if (!this.state.isActive) {
            return // do nothing if this search isn't even active
        }

        this.setState({
            isActive: false
        })

        if (!this.props.allowPageInteractions) {
            this.resetInput()
        }

        this.props.onClose(e)
        this.blurInput()
    }

    submitSearch(e) {
        this.props.onSubmit(e)
        this.closeSearch()
    }

    clickSuggestion(e) {
        this.props.onClickSuggestion(e)
        this.closeSearch()
    }

    render() {
        const {
            accessibleLabel,
            allowPageInteractions,
            className,
            onChange,
            onClose,
            includeClearButton,
            inputProps,
            isOverlay,
            searchIcon,
            replaceSearchWithClose,
            suggestedTermHeading,
            suggestedProductsHeading,
            termSuggestions,
            productSuggestions,
            onClickSuggestion,
            submitButtonProps,
            closeButtonProps,
            clearButtonProps
        } = this.props

        const {isActive, searchValue, id} = this.state

        const classes = classNames(
            'pw-search',
            {
                'pw--is-active': isActive,
                'pw--is-overlay': isOverlay
            },
            className
        )

        const searchSuggestionClasses = classNames('pw-search__suggestions', {
            'pw--is-empty': !termSuggestions && !productSuggestions
        })
        const searchIconClasses = classNames('pw-search__icon', {
            'pw--is-not-clickable': !(isOverlay && replaceSearchWithClose)
        })

        const suggestionsProps = {
            clickSuggestion: this.clickSuggestion,
            onClickSuggestion,
            productSuggestions,
            searchSuggestionClasses,
            suggestedProductsHeading,
            suggestedTermHeading,
            termSuggestions
        }

        const isAllowingInteractionAndHasSuggestions =
            allowPageInteractions && (productSuggestions || termSuggestions)

        return (
            <div className={classes} role="search">
                <SearchWrapper onClickOutside={this.closeSearch}>
                    <form
                        className="pw-search__form"
                        onSubmit={this.submitSearch}
                        onChange={onChange}
                        action="javascript:void(0)"
                    >
                        <div className="pw-search__bar">
                            <div className={searchIconClasses}>
                                {replaceSearchWithClose && isOverlay ? (
                                    <Button onClick={this.closeSearch} {...closeButtonProps} />
                                ) : (
                                    <Icon className="pw-search__icon-content" name={searchIcon} />
                                )}
                            </div>

                            <div className="pw-search__field">
                                <label htmlFor={id} className="u-visually-hidden">
                                    {accessibleLabel}
                                </label>

                                <input
                                    className="pw-search__input"
                                    ref={(el) => {
                                        this.input = el
                                    }}
                                    id={id}
                                    value={searchValue}
                                    onChange={(e) => this.setState({searchValue: e.target.value})}
                                    onFocus={() => this.setState({isActive: true})}
                                    type="search"
                                    name="query"
                                    data-analytics-name="search"
                                    {...inputProps}
                                />
                            </div>

                            {includeClearButton && searchValue.length > 0 && (
                                <div className="pw-search__button-clear">
                                    <Button
                                        onClick={this.clearInput}
                                        {...clearButtonProps}
                                        data-analytics-name="clear_search"
                                    />
                                </div>
                            )}

                            <div className="pw-search__button-submit">
                                <Button
                                    type="submit"
                                    disabled={searchValue.trim().length === 0}
                                    {...submitButtonProps}
                                    data-analytics-name="search"
                                />
                            </div>

                            {isOverlay && !replaceSearchWithClose && (
                                <div className="pw-search__button-close">
                                    <Button
                                        onClick={this.closeSearch}
                                        {...closeButtonProps}
                                        data-analytics-name="dismiss_search"
                                    />
                                </div>
                            )}
                        </div>
                    </form>

                    {isAllowingInteractionAndHasSuggestions ? (
                        <PopoverSuggestions {...suggestionsProps} />
                    ) : (
                        <TakeoverSuggestions {...suggestionsProps} />
                    )}
                </SearchWrapper>

                {/* disable this a11y lint because it's a presentational element
                 * that's meant for mouse users, not keyboard users.
                 */}
                {/* eslint-disable jsx-a11y/no-static-element-interactions */}
                {!allowPageInteractions && (
                    <div
                        tabIndex="-1"
                        role="presentation"
                        onKeyUp={onKeyUpWrapper(onClose)}
                        className="pw-search__shade"
                        onClick={this.closeSearch}
                    />
                )}
                {/* eslint-enable jsx-a11y/no-static-element-interactions */}
            </div>
        )
    }
}

Search.defaultProps = {
    accessibleLabel: 'Search',
    allowPageInteractions: false,
    submitButtonProps: {
        text: 'Submit search'
    },
    closeButtonProps: {
        text: 'Close search'
    },
    clearButtonProps: {
        text: 'Clear'
    },
    includeClearButton: true,
    replaceSearchWithClose: false,
    searchIcon: 'search',
    suggestedTermHeading: 'Suggested Search Terms',
    suggestedProductsHeading: 'Suggested Products',
    onClear: noop,
    onClose: noop,
    onSubmit: noop
}

Search.propTypes = {
    /**
     * Adds text as a label for the search input, accessible
     * to screen readers, but hidden to visual users.
     */
    accessibleLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * This prop is only used when `isOverlay` is `false`.
     *
     * If true the search suggestions will behave like the popover component,
     * interactions on the page will not be blocked while suggestions are open,
     * clicking outside the suggestions will close the suggestions popover
     */
    allowPageInteractions: PropTypes.bool,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The properties for clear button.
     */
    clearButtonProps: PropTypes.object,

    /**
     * The properties for close button.
     */
    closeButtonProps: PropTypes.object,

    /**
     * Indicates if the clear button should be included in the search component
     */
    includeClearButton: PropTypes.bool,

    /**
     * The data for the input you wish to render.
     */
    inputProps: PropTypes.object,

    /**
     * Is only used when `isOverlay` is `true`. Its comparison in `componentDidUpdate`
     * determines whether to allow or disallow input focus, or input reset. This
     * prop does nothing for an inline search. Note that this is different
     * from isActive.
     */
    isOpen: PropTypes.bool,

    /**
     * Controls whether the search component uses an overlay layout or not.
     */
    isOverlay: PropTypes.bool,

    /**
     * An array of the search(product) suggestions to be displayed.
     */
    productSuggestions: PropTypes.array,

    /**
     * This prop is only used when `isOverlay` is `true`.
     *
     * If true the close button will replace the search icon
     * when the search overlay is open. Clicking the button.
     *
     */
    replaceSearchWithClose: PropTypes.bool,

    /**
     * Icon name for search.
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    searchIcon: PropTypes.string,

    /**
     * The properties for submit button.
     */
    submitButtonProps: PropTypes.object,

    /**
     * The text for suggested products heading.
     */
    suggestedProductsHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The text for suggested terms heading.
     */
    suggestedTermHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * An array of the search(term) suggestions to be displayed
     */
    termSuggestions: PropTypes.array,

    /**
     * The function to be called when the form is changed.
     */
    onChange: PropTypes.func,

    /**
     * The function to be called when the clear button is clicked.
     */
    onClear: PropTypes.func,

    /**
     * The function to be called when a suggestion is clicked.
     */
    onClickSuggestion: PropTypes.func,

    /**
     * The function to be called when the close button is clicked.
     */
    onClose: PropTypes.func,

    /**
     * The function to be called after form is submitted.
     */
    onSubmit: PropTypes.func
}

export default Search
