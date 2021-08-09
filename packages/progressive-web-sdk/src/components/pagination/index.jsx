/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Button from '../button'
import Icon from '../icon'
import {noop} from '../../utils/utils'

const ANALYTICS_NAME_PAGINATION = 'pagination'
/**
 * Pagination is a way of breaking down large listings into smaller,
 * more digestible chunks and allowing the user to step through them in sequential
 * (or random) order.
 *
 * @example ./DESIGN.md
 */
class Pagination extends React.Component {
    constructor(props) {
        super(props)

        this.goToStart = this.goToStart.bind(this)
        this.goBack = this.goBack.bind(this)
        this.goForward = this.goForward.bind(this)
        this.goToEnd = this.goToEnd.bind(this)
        this.goToSelected = this.goToSelected.bind(this)
    }

    renderPageButton(i) {
        const pageClasses = classNames('pw-pagination__page', {
            'pw--active': i === this.props.currentPage
        })

        return (
            <Button
                key={i}
                className={pageClasses}
                onClick={this.props.onChange.bind(null, i)}
                data-analytics-name={ANALYTICS_NAME_PAGINATION}
                data-analytics-content={`page ${i}`}
            >
                {this.props.getPageButtonMessage(i)}
            </Button>
        )
    }

    renderPageButtons(lower, upper) {
        const list = []
        for (let i = lower; i <= upper; i++) {
            list.push(this.renderPageButton(i))
        }
        return list
    }

    buildSelectOptions(pageCount) {
        return new Array(pageCount).fill(undefined).map((val, index) => {
            const newIndex = ++index
            const value = newIndex.toString()
            return (
                <option value={value} key={index}>
                    {this.props.currentPage === index
                        ? this.props.getCurrentPageMessage(value, pageCount)
                        : this.props.getSelectOptionMessage(value, pageCount)}
                </option>
            )
        })
    }

    goToStart() {
        this.props.onChange(1)
    }

    goBack() {
        this.props.onChange(this.props.currentPage - 1)
    }

    goForward() {
        this.props.onChange(this.props.currentPage + 1)
    }

    goToEnd() {
        this.props.onChange(this.props.pageCount)
    }

    goToSelected(e) {
        this.props.onChange(parseInt(e.target.value))
    }

    render() {
        const {
            className,
            pageCount,
            pagesToShow,
            currentPage,
            firstButton,
            prevButton,
            nextButton,
            lastButton,
            isSelect,
            showPageButtons,
            showCurrentPageMessage,
            getCurrentPageMessage,
            selectIcon
        } = this.props

        let {pagesToShowAtEnd, pagesToShowAtStart} = this.props

        const classes = classNames(
            'pw-pagination',
            {
                'pw--select-pagination': isSelect
            },
            className
        )

        const visiblePages = Math.min(pagesToShow || pageCount, pageCount)
        let centerChunkLength = visiblePages - pagesToShowAtStart - pagesToShowAtEnd

        // if visible pages is equal to pagesToShowAtEnd and pagesToShowAtStart combined
        // show subset of pages without start and end
        if (visiblePages === pagesToShowAtStart + pagesToShowAtEnd) {
            pagesToShowAtStart = 0
            pagesToShowAtEnd = 0
            centerChunkLength = visiblePages
        }

        // Pages are 1 indexed
        let pageBeforeEnd = pageCount - pagesToShowAtEnd

        // Offset the center chunk from the start and end
        let centerChunkStart = 1 + pagesToShowAtStart
        let centerChunkEnd = Math.min(centerChunkStart + centerChunkLength - 1, pageBeforeEnd)

        // If the current page isn't visible in the center,
        // shift the center so that it is
        // Also show the value following the current page
        if (currentPage >= centerChunkEnd && centerChunkStart !== centerChunkEnd) {
            centerChunkEnd = Math.min(currentPage + 1, pageBeforeEnd)
            centerChunkStart = centerChunkEnd - centerChunkLength + 1
        } else if (currentPage > centerChunkEnd && centerChunkStart === centerChunkEnd) {
            // do not shift the center when there is 1 page in the chunk
            centerChunkStart = Math.min(currentPage, pageBeforeEnd)
            centerChunkEnd = centerChunkStart
        }

        if (pageCount < pagesToShow || centerChunkLength < 0) {
            if (centerChunkLength < 0) {
                console.error(
                    'The pagesToShow prop must be >= pagesToShowAtStart + pagesToShowAtEnd. Ignoring pagesToShowAtStart and pagesToShowAtEnd.'
                )
            }
            pagesToShowAtStart = 0
            pagesToShowAtEnd = 0
            centerChunkStart = 1
            centerChunkEnd = pageCount
            pageBeforeEnd = pageCount
        }

        const atStart = currentPage === 1
        const atEnd = currentPage === pageCount

        const Ellipsis = () => <div className="pw-pagination__ellipsis">...</div>

        return (
            <nav role="navigation" className={classes}>
                {firstButton && (
                    <Button
                        className="pw-pagination__button"
                        onClick={this.goToStart}
                        disabled={atStart}
                        data-analytics-name={ANALYTICS_NAME_PAGINATION}
                        data-analytics-content={`page 1`}
                        {...firstButton.props}
                    >
                        {firstButton.text}
                    </Button>
                )}

                {prevButton && (
                    <Button
                        className="pw-pagination__button"
                        onClick={this.goBack}
                        disabled={atStart}
                        data-analytics-name={ANALYTICS_NAME_PAGINATION}
                        data-analytics-content="previous"
                        {...prevButton.props}
                    >
                        {prevButton.text}
                    </Button>
                )}

                <div className="pw-pagination__content">
                    {showPageButtons && (
                        <div className="pw-pagination__pages">
                            {this.renderPageButtons(1, pagesToShowAtStart)}
                            {pagesToShowAtStart && centerChunkStart > pagesToShowAtStart + 1 ? (
                                <Ellipsis key="firstEllipsis" />
                            ) : (
                                false
                            )}
                            {this.renderPageButtons(centerChunkStart, centerChunkEnd)}
                            {pagesToShowAtEnd && centerChunkEnd < pageBeforeEnd ? (
                                <Ellipsis key="secondEllipsis" />
                            ) : (
                                false
                            )}
                            {this.renderPageButtons(pageBeforeEnd + 1, pageCount)}
                        </div>
                    )}

                    {isSelect && (
                        <div className="pw-pagination__select-wrapper">
                            <select
                                className="pw-pagination__select"
                                onBlur={this.goToSelected}
                                onChange={this.goToSelected}
                                value={currentPage}
                            >
                                {this.buildSelectOptions(pageCount)}
                            </select>

                            <div className="pw-pagination__select-icon">
                                <Icon name={selectIcon || 'caret-bottom'} />
                            </div>
                        </div>
                    )}

                    {showCurrentPageMessage && (
                        <span className="pw-pagination__page-count">
                            {getCurrentPageMessage(currentPage, pageCount)}
                        </span>
                    )}
                </div>

                {nextButton && (
                    <Button
                        className="pw-pagination__button"
                        onClick={this.goForward}
                        disabled={atEnd}
                        data-analytics-name={ANALYTICS_NAME_PAGINATION}
                        data-analytics-content="next"
                        {...nextButton.props}
                    >
                        {nextButton.text}
                    </Button>
                )}
                {lastButton && (
                    <Button
                        className="pw-pagination__button"
                        onClick={this.goToEnd}
                        disabled={atEnd}
                        data-analytics-name={ANALYTICS_NAME_PAGINATION}
                        data-analytics-content={`page ${pageCount}`}
                        {...lastButton.props}
                    >
                        {lastButton.text}
                    </Button>
                )}
            </nav>
        )
    }
}

const defaultGetCurrentPageMessage = (current, total) => `Page ${current} of ${total}`

const defaultGetPageButtonMessage = (pageNumber) => (
    <span>
        <span className="pw-pagination__hidden-label">Page </span>
        {pageNumber}
    </span>
)

const defaultSelectOptionMessage = (current, total) => `Page ${current} of ${total}`

Pagination.defaultProps = {
    getCurrentPageMessage: defaultGetCurrentPageMessage,
    getPageButtonMessage: defaultGetPageButtonMessage,
    getSelectOptionMessage: defaultSelectOptionMessage,
    nextButton: {
        text: 'Next'
    },
    prevButton: {
        text: 'Prev'
    },
    pagesToShowAtStart: 0,
    pagesToShowAtEnd: 0,
    showPageButtons: true,
    showCurrentPageMessage: true,
    onChange: noop
}

Pagination.propTypes = {
    /**
     * The current page number.
     */
    currentPage: PropTypes.number.isRequired,

    /**
     * The number of pages shown in pagination.
     */
    pageCount: PropTypes.number.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The properties for First Button (It's used to go to the very first page).
     */
    firstButton: PropTypes.shape({
        text: PropTypes.string,
        props: PropTypes.object
    }),

    /**
     * This function should return a string (or node) that describes the user's current location in the pagination.
     * It will be passed the current page and total number of pages.
     */
    getCurrentPageMessage: PropTypes.func,

    /**
     * This function should return a string (or node) to be used for the page buttons.
     * It will be passed the button's page number.
     */
    getPageButtonMessage: PropTypes.func,

    /**
     * This function should return a string for the select option of pagination.
     * It will be passed the current page and total number of pages.
     */
    getSelectOptionMessage: PropTypes.func,

    /**
     * Defines if pagination is a select pagination.
     */
    isSelect: PropTypes.bool,

    /**
     * The properties for Last Button (It's used to go to the very last page).
     */
    lastButton: PropTypes.shape({
        text: PropTypes.string,
        props: PropTypes.object
    }),

    /**
     * The properties for Next Button (It's used to go to the next page).
     */
    nextButton: PropTypes.shape({
        text: PropTypes.string,
        props: PropTypes.object
    }),

    /**
     * The total number of pages to show.
     * If you provide pagesToShowAtStart or pagesToShowAtEnd, they will be subtracted from this number.
     */
    pagesToShow: PropTypes.number,

    /**
     * The number of pages to always show at the end of the pagination.
     */
    pagesToShowAtEnd: PropTypes.number,

    /**
     * The number of pages to always show at the start of the pagination.
     */
    pagesToShowAtStart: PropTypes.number,

    /**
     * The properties for Previous Button (It's used to go to the previous page).
     */
    prevButton: PropTypes.shape({
        text: PropTypes.string,
        props: PropTypes.object
    }),

    /**
     * Name of SVG icon for select drop down.
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    selectIcon: PropTypes.string,

    /**
     * If false, the current page message will not be shown.
     */
    showCurrentPageMessage: PropTypes.bool,

    /**
     * If false, the page buttons(numbers) will not be shown.
     */
    showPageButtons: PropTypes.bool,

    /**
     * This function is called whenever the page is changed.
     * This function is also responsible for updating the props that are passed to the pagination component.
     */
    onChange: PropTypes.func
}

export default Pagination
