/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Button from '../button'

/**
 * The `LazyLoader` makes it possible to delay rendering of content until the
 * user has actually scrolled a certain distance through a page.
 *
 * A few common patterns for this component include:
 *
 * * Lazily fetch contents from a server when the user scrolls that content
 *   into view.
 * * Lazily render items, if rendering all of the items at once is a
 *   performance concern.
 *
 * The way this works is: when the `LazyLoader` scrolls into view, it triggers
 * a function callback to `fetchItems` (a Promise) to achieve the various lazy
 * loading effects. See example usages below.
 *
 * The LazyLoader is not responsible for managing its children.
 * LazyLoader children must be managed externally to the LazyLoader
 * (e.g. in the LazyLoader's parent)
 *
 * @example ./DESIGN.md
 */

class LazyLoader extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            shouldNotifyUser: false,
            loading: false,
            done: false
        }

        this.handleScroll = this.handleScroll.bind(this)
        this.loadNext = this.loadNext.bind(this)
        this.reset = this.reset.bind(this)
        this.checkIfDone = this.checkIfDone.bind(this)
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll)
        this.checkIfDone()
    }

    componentWillReceiveProps(nextProps) {
        this.checkIfDone(nextProps)
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    reset() {
        this.setState({
            loading: false,
            done: false
        })
    }

    loadNext() {
        const {currentItemCount, itemsPerPage, fetchItems} = this.props

        this.setState({
            loading: true,
            shouldNotifyUser: false
        })

        fetchItems &&
            fetchItems({
                startPosition: currentItemCount,
                lastPosition: currentItemCount + itemsPerPage
            }).then(() => {
                this.setState({
                    loading: false,
                    shouldNotifyUser: true
                })
            })
    }

    handleScroll() {
        const {useLoadMoreButton, scrollPixelOffset} = this.props

        const {loading, done} = this.state

        if (loading || done || useLoadMoreButton) {
            return
        }

        const bottomScrollThreshold = this.el.getBoundingClientRect().bottom
        const pixelOffset = scrollPixelOffset >= 0 ? scrollPixelOffset : 0

        if (bottomScrollThreshold <= window.innerHeight + pixelOffset) {
            this.loadNext()
        }
    }

    checkIfDone(props) {
        const {currentItemCount, itemTotal} = props || this.props

        const {done} = this.state

        if (currentItemCount >= itemTotal && !done) {
            this.setState({
                done: true,
                loading: false
            })
        }
    }

    render() {
        const {
            allItemsLoadedMessage,
            notificationAddedMessage,
            children,
            className,
            loadMoreButtonClassName,
            loadMoreItemsMessage,
            loadingIndicator,
            relevantText,
            useLoadMoreButton
        } = this.props

        const {done, loading, shouldNotifyUser} = this.state

        const classes = classNames('pw-lazy-loader', className)
        const loadMoreButtonClasses = classNames(
            'pw-lazy-loader__load-more',
            loadMoreButtonClassName
        )

        return (
            <div
                className={classes}
                ref={(el) => {
                    this.el = el
                }}
            >
                {children}

                {useLoadMoreButton && (
                    <Button
                        className={loadMoreButtonClasses}
                        onClick={this.loadNext}
                        disabled={loading || done}
                    >
                        {done ? allItemsLoadedMessage : loadMoreItemsMessage}
                    </Button>
                )}

                {loading && <div className="pw-lazy-loader__indicator">{loadingIndicator}</div>}

                <div
                    className="u-visually-hidden"
                    aria-live="polite"
                    aria-relevant={relevantText}
                    tabIndex="-1"
                >
                    {shouldNotifyUser && notificationAddedMessage}
                </div>
            </div>
        )
    }
}

LazyLoader.defaultProps = {
    allItemsLoadedMessage: 'All items loaded',
    itemsPerPage: 20,
    itemTotal: Number.POSITIVE_INFINITY,
    loadMoreItemsMessage: 'Load more items',
    loadingIndicator: 'Loading...',
    notificationAddedMessage: 'More items loaded',
    relevantText: 'additions text',
    scrollPixelOffset: 0
}

LazyLoader.propTypes = {
    /**
     * The current number of items. We cannot determine this based on the number
     * of children in case the children are wrapped in another component, such
     * as a Grid component providing layout.
     */
    currentItemCount: PropTypes.node.isRequired,

    /**
     * A user-defined function that is called when the bottom of the LazyLoader
     * component scrolls into view. This provides the user with a hook to
     * perform network requests to fetch and load more content. This function
     * must return a promise that resolves when any fetched content is loaded.
     */
    fetchItems: PropTypes.func.isRequired,

    /**
     * A message used on the Load More Items button when all items have loaded.
     * Exposed to screen readers.
     */
    allItemsLoadedMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The children to be rendered.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * A user-defined number that indicates the end state of the LazyLoader.
     * When the LazyLoader has loaded this many items, then it knows it can stop
     * attempting to load more items.
     */
    itemTotal: PropTypes.number,

    /**
     * The number of items to load for each page.
     */
    itemsPerPage: PropTypes.number,

    /**
     * Adds values to the `class` attribute of the load more button.
     */
    loadMoreButtonClassName: PropTypes.string,

    /**
     * A message used on the Load More Items button. Exposed to screen readers.
     */
    loadMoreItemsMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * An indicator that the next page of contents is loading.
     */
    loadingIndicator: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * A message exposed to screen readers when new contents have been loaded.
     */
    notificationAddedMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The `LazyLoader` component uses [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
     * to report updates to users using assistive tools like screen readers.
     * The `relevantText` prop describes which types of changes are relevant to
     * the Live Region, which tells the assistive tool which changes to report
     * to the user. This text is fed into an `aria-relevant` prop, accepts a
     * space delimited list of one or more of the following values: `additions`,
     * `removals`, `text` or `all`. See [here](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-relevant_attribute)
     * for details.
     */
    relevantText: PropTypes.string,

    /**
     * The pixel offset added to window.innerHeight to move the threshold for when
     * new content is fetched.
     *
     * New content is loaded when the bottom of the LazyLoader is scrolled into view
     * (the bottom position is less than or equal to window.innerHeight).
     * E.g. with a 100px offset new content will begin to load when LazyLoader bottom
     * is 100px below the bottom of the window.
     */
    scrollPixelOffset: PropTypes.number,
    /**
     * Indicates if the load more button should be used instead of scrolling.
     */
    useLoadMoreButton: PropTypes.bool
}

export default LazyLoader
