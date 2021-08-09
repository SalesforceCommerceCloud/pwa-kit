/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import prefixAll from 'inline-style-prefixer/static'

import CarouselButton from './partials/carousel-button'
import CarouselPip from './partials/carousel-pip'

import {positiveNumber} from '../../prop-type-utils'

const DIRECTION_RIGHT = 'right'
const DIRECTION_LEFT = 'left'

const getKey = (index) => {
    return `slide-${index}`
}

const getCursorPosition = (e) => {
    return e.touches
        ? {x: e.touches[0].clientX, y: e.touches[0].clientY}
        : {x: e.clientX, y: e.clientY}
}

/**
 * Related component:
 *
 * * [CarouselItem](#!/CarouselItem)
 *
 * `Carousel` is used to display a series of content (carouselItem).
 * It only shows one item at a time and allows users to cycle
 * through the items by swiping left/right or using next/previous button
 *
 * @example ./DESIGN.md
 */

class Carousel extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            ...this.calculateIndexes(props.currentSlide || 0), // Easy way to populate the prev/cur/next indexes
            dragging: false,
            dragStartX: 0,
            dragStartY: 0,
            deltaX: 0,
            deltaY: 0,
            deltaXPercent: 0,
            isScrollingPast: false,
            itemWidth: 0
        }

        this._innerWrapper = React.createRef()

        this.moveComplete = this.moveComplete.bind(this)
        this.onPreviousHandler = this.onPreviousHandler.bind(this)
        this.onNextHandler = this.onNextHandler.bind(this)
        this.updateItemWidth = this.updateItemWidth.bind(this)
        this.onPipClick = this.onPipClick.bind(this)

        this.addEventListeners = this.addEventListeners.bind(this)
        this.removeEventListeners = this.removeEventListeners.bind(this)
        this.onDownHandler = this.onDownHandler.bind(this)
        this.onMoveHandler = this.onMoveHandler.bind(this)
        this.onUpHandler = this.onUpHandler.bind(this)
        this.onLeaveHandler = this.onLeaveHandler.bind(this)
    }

    componentDidMount() {
        this.updateItemWidth()

        const innerWrapper = this._innerWrapper.current
        if (innerWrapper) {
            innerWrapper.addEventListener('mousedown', this.onDownHandler)
            innerWrapper.addEventListener('touchstart', this.onDownHandler, {passive: false})
        }

        window.addEventListener('resize', this.updateItemWidth)
    }

    componentWillUnmount() {
        this.removeEventListeners()

        const innerWrapper = this._innerWrapper.current
        if (innerWrapper) {
            innerWrapper.removeEventListener('mousedown', this.onDownHandler)
            innerWrapper.removeEventListener('touchstart', this.onDownHandler, {passive: false})
        }

        window.removeEventListener('resize', this.updateItemWidth)
    }

    componentWillReceiveProps(newProps) {
        const useCurrentSlideProp = newProps.currentSlide >= 0
        // The currentSlide prop is for when the user wants to take manual
        // control over the carousel's internal state. For example: making it
        // possible to change slides using the redux store.
        const currentIndex = useCurrentSlideProp ? newProps.currentSlide : this.state.currentIndex
        const newLength = newProps.children.length

        // Update the cur/prev/next indexes because CarouselItems length has changed
        if (newLength !== this.props.children.length) {
            this.setState({
                ...this.calculateIndexes(currentIndex, newLength)
            })
        }

        // Update the indexes because a new currentIndex has been provided
        const oldCurrentSlide = this.props.currentSlide
        const newCurrentSlide = newProps.currentSlide
        if (newCurrentSlide !== oldCurrentSlide) {
            this.moveTo(newCurrentSlide)
        }
    }

    addEventListeners() {
        window.addEventListener('mousemove', this.onMoveHandler)
        window.addEventListener('mouseup', this.onUpHandler)
        window.addEventListener('mouseleave', this.onLeaveHandler)
        window.addEventListener('touchmove', this.onMoveHandler, {passive: false})
        window.addEventListener('touchend', this.onUpHandler)
        window.addEventListener('touchcancel', this.onLeaveHandler)
    }

    removeEventListeners() {
        window.removeEventListener('mousemove', this.onMoveHandler)
        window.removeEventListener('mouseup', this.onUpHandler)
        window.removeEventListener('mouseleave', this.onLeaveHandler)
        window.removeEventListener('touchmove', this.onMoveHandler, {passive: false})
        window.removeEventListener('touchend', this.onUpHandler)
        window.removeEventListener('touchcancel', this.onLeaveHandler)
    }

    updateItemWidth() {
        // Item width is used to determine how much to slide over when
        // cycling through the slides
        // This is a sanity check and thus difficult to make fail in tests
        /* istanbul ignore else */
        const innerWrapper = this._innerWrapper.current
        if (innerWrapper && innerWrapper.firstChild) {
            this.setState({
                itemWidth: innerWrapper.firstChild.clientWidth
            })
        }
    }

    calculateIndex(position, length) {
        const len = length || React.Children.count(this.props.children)

        // Always return a value within the array bounds. This
        // accounts for when the current position is either 0 or
        // length - 1.
        return position < 0 ? (len - (Math.abs(position) % len)) % len : position % len
    }

    calculateIndexes(position, length) {
        // Calculate the array index for the current item, as well as the previous and next.
        //
        // Optionally called with `length` when indices need to be recalculated due to number of
        // carousel children changing
        return {
            currentIndex: this.calculateIndex(position, length),
            prevIndex: this.calculateIndex(position - 1, length),
            nextIndex: this.calculateIndex(position + 1, length)
        }
    }

    move(direction) {
        const {itemWidth} = this.state
        const newDeltaX = (direction === DIRECTION_LEFT ? 1 : -1) * itemWidth

        this.setState({
            animate: true,
            deltaX: newDeltaX
        })
    }

    moveComplete() {
        // Update the current index.
        const {currentIndex, deltaX} = this.state
        const {currentSlide, onSlideMove} = this.props

        // Disabled animation for next drag.
        this.setState({animate: false})

        // Return if we haven't moved (user didn't move passed the threshold and was animated back to
        // the deltaX = 0 position).
        if (!deltaX) {
            return
        }

        // Determine last move by checking the current deltaX value (was moved left or right)
        let index
        if (Number.isInteger(currentSlide) && currentSlide !== currentIndex) {
            index = currentSlide
        } else {
            index = currentIndex + (deltaX < 0 ? 1 : -1)
        }

        // Update the indexes and reset the content panel to its original position.
        const newIndexes = this.calculateIndexes(index)

        this.setState(
            {
                ...newIndexes,
                deltaX: 0
            },
            () => {
                // Execute onSlideMove to trigger any listening callbacks, passing it
                // the current index.
                onSlideMove(newIndexes.currentIndex)
            }
        )
    }

    moveTo(position, animate = true) {
        const slideCount = React.Children.count(this.props.children)

        // If the new position is outside the range of the carousel, ignore it
        if (position >= 0 && position < slideCount) {
            if (!animate) {
                // If we don't need to animate,
                // just go directly to the new position
                const newIndexes = this.calculateIndexes(position)
                const {onSlideMove} = this.props
                this.setState(
                    {
                        ...newIndexes
                    },
                    () => {
                        onSlideMove(newIndexes.currentIndex)
                    }
                )
            } else {
                const {itemWidth, currentIndex} = this.state
                const newDeltaX = (currentIndex - position) * itemWidth

                this.setState({
                    animate: true,
                    deltaX: newDeltaX
                })
            }
        }
    }

    canMove(direction) {
        const {children, allowLooping} = this.props
        const {currentIndex} = this.state
        const slideCount = React.Children.count(children)

        // If we only have a single slide, it's safe to assume we shouldn't move
        if (slideCount === 1) {
            return false
        }

        // Determine if you can make a move in the given direction, this is used
        // for both disabling swiping and controls when not looping and you are
        // at the beginning or end of the item array.
        return (
            allowLooping ||
            (direction === DIRECTION_LEFT && currentIndex > 0) ||
            (direction === DIRECTION_RIGHT && currentIndex !== slideCount - 1)
        )
    }

    onUpHandler() {
        const {moveThreshold} = this.props
        const {deltaX} = this.state

        this.setState({
            dragging: false,
            isScrollingPast: false
        })

        // Clean up all of the touch/mouse events used for dragging.
        this.removeEventListeners()

        // If there is no drag amount, return.
        if (!deltaX || Math.abs(deltaX) < moveThreshold) {
            this.setState({
                animate: !!deltaX, // Only animate when move is greater than 0.
                deltaX: 0
            })

            return
        }
        // We have a valid drag, so move one step in the direction of the drag.
        this.move(deltaX < 0 ? DIRECTION_RIGHT : DIRECTION_LEFT)

        if (window.Progressive && window.Progressive.analytics) {
            window.Progressive.analytics.send({
                subject: 'user',
                action: 'Swipe',
                object: 'Element',
                name: 'carousel',
                content: deltaX < 0 ? 'next' : 'previous'
            })
        }
    }

    onDownHandler(e) {
        const {animate} = this.state

        // Add all of the touch/mouse events used for dragging.
        this.addEventListeners()

        // Disallow dragging when animating a move, this should be fixed in
        // a future release.
        if (animate) {
            e.preventDefault()
            return
        }

        this.setState({
            animate: false,
            dragStartX: getCursorPosition(e).x,
            dragStartY: getCursorPosition(e).y
        })
    }

    onMoveHandler(e) {
        const {dragThreshold} = this.props
        const {dragging, dragStartX, dragStartY, isScrollingPast} = this.state
        const deltaX = getCursorPosition(e).x - dragStartX
        const deltaY = getCursorPosition(e).y - dragStartY
        const isUnderDragThreshold = Math.abs(deltaX) < dragThreshold

        // If we are scrolling past, prevent further dragging
        if (isScrollingPast) {
            return
        }

        // Determine if the user is trying to scroll past the carousel
        if (!dragging && Math.abs(deltaY) > Math.abs(deltaX)) {
            // We know we're scrolling past now, so prevent
            // further dragging
            this.setState({isScrollingPast: true})
            return
        }

        // Prevent app from being scrollable
        e.preventDefault()

        // If we are under the drag threshold, prevent further dragging.
        // This happens after the `preventDefault()` call because we still
        // can't determine if the user is going to be dragging the carousel
        // or not.
        if (isUnderDragThreshold) {
            return
        }

        // Set the carousel to "dragging" to ensure all dragging animation
        // happens until the user finishes
        this.setState({dragging: true})

        const direction = deltaX < 0 ? DIRECTION_RIGHT : DIRECTION_LEFT

        // Disallow dragging in a direction that you can't move to.
        if (this.canMove(direction)) {
            // Account for the threshold, or the content will jump to
            // cursor position'
            const newDeltaX = deltaX + (direction === DIRECTION_RIGHT ? 1 : -1) * dragThreshold

            this.setState({
                animate: true,
                deltaX: newDeltaX
            })
        }
    }

    onLeaveHandler() {
        if (this.state.dragging) {
            this.onUpHandler()
        }
    }

    onPreviousHandler() {
        !this.state.dragging && this.move(DIRECTION_LEFT)
    }

    onNextHandler() {
        !this.state.dragging && this.move(DIRECTION_RIGHT)
    }

    onPipClick(index) {
        // Images in between the initial pip and the cicked pip
        // May not be loaded so animation makes the transition look choppy
        this.moveTo(index, false)
    }

    render() {
        const {
            animationDuration,
            className,
            previousIcon,
            nextIcon,
            iconSize,
            buttonClass,
            showCaption,
            showControls,
            showPips,
            getNextMessage,
            getPipMessage,
            getPreviousMessage
        } = this.props

        const {animate, currentIndex, deltaX, dragging, prevIndex, nextIndex} = this.state

        const {children} = this.props

        const classes = classNames('pw-carousel', className)

        if (!React.Children.count(children)) {
            return false
        }

        // Ensure that deltaX must be greater than 0 in order for animations to
        // occur, otherwise you might get an undersirable animate-forward-
        // animate-back effect.
        const duration = dragging ? 0 : animationDuration
        const innerStyle = prefixAll(
            deltaX && animate && animationDuration
                ? {
                      transform: `translate3d(${deltaX}px, 0, 0)`,
                      transition: `transform ${duration.toString()}s ease-in-out`
                  }
                : {transform: `translate3d(0, 0, 0)`, transition: 'none'}
        )
        const animatingProps = {isAnimating: animate, isDragging: dragging}

        const slideCount = React.Children.count(children)

        // Handle the case where there is only a single child correctly
        let currentChild = children[currentIndex] || children
        currentChild = React.cloneElement(currentChild, {
            ...animatingProps,
            active: true,
            key: getKey(currentIndex)
        })

        // If we have only one child, prev and next can be null
        const prevChild =
            slideCount > 1
                ? React.cloneElement(children[prevIndex], {
                      ...animatingProps,
                      key: getKey(prevIndex)
                  })
                : null

        // If we have two children, we need to have a dummy 'next' one,
        // so we'll clone the prev and give it a new key
        const nextChild = (() => {
            if (slideCount > 2) {
                return React.cloneElement(children[nextIndex], {
                    ...animatingProps,
                    key: getKey(nextIndex)
                })
            } else if (slideCount > 1 && prevChild) {
                return React.cloneElement(prevChild, {
                    ...animatingProps,
                    key: getKey(`${prevIndex}-duplicate`)
                })
            } else {
                return null
            }
        })()

        const childList = [prevChild, currentChild, nextChild]

        return (
            <div className={classes}>
                <div
                    ref={this._innerWrapper}
                    className="pw-carousel__inner"
                    style={innerStyle}
                    onTransitionEnd={this.moveComplete}
                    {...this.eventHandlers}
                >
                    {childList.map((item) => item)}
                </div>

                {/* Optional 'caption' label control */}
                {showCaption && (
                    <span className={`pw-carousel__caption`}>{currentChild.props.caption}</span>
                )}

                {(showControls || showPips) && (
                    <div className="pw-carousel__controls">
                        {showControls && (
                            <CarouselButton
                                className="pw-carousel__previous"
                                onClick={this.onPreviousHandler}
                                disabled={!this.canMove(DIRECTION_LEFT)}
                                buttonClass={buttonClass}
                                icon={previousIcon}
                                iconSize={iconSize}
                                title={getPreviousMessage(prevIndex + 1, slideCount)}
                                analyticsContent="previous"
                            />
                        )}

                        {(showControls || showPips) && (
                            <div className="pw-carousel__pips">
                                {React.Children.map(children, (item, index) => {
                                    const isCurrentPip = index === currentIndex
                                    return (
                                        <CarouselPip
                                            isCurrentPip={isCurrentPip}
                                            key={index}
                                            index={index}
                                            onClick={this.onPipClick}
                                        >
                                            {getPipMessage(isCurrentPip, index + 1)}
                                        </CarouselPip>
                                    )
                                })}
                            </div>
                        )}

                        {showControls && (
                            <CarouselButton
                                className="pw-carousel__next"
                                onClick={this.onNextHandler}
                                disabled={!this.canMove(DIRECTION_RIGHT)}
                                buttonClass={buttonClass}
                                icon={nextIcon}
                                iconSize={iconSize}
                                title={getNextMessage(nextIndex + 1, slideCount)}
                                analyticsContent="next"
                            />
                        )}
                    </div>
                )}
            </div>
        )
    }
}

const defaultGetNextMessage = (nextIndex, total) => `Show slide ${nextIndex} of ${total}`

const defaultGetPreviousMessage = (previousIndex, total) =>
    `Show slide ${previousIndex} of ${total}`

const defaultGetPipMessage = (isCurrentPip, slideIndex) => {
    return isCurrentPip ? `Current slide: ${slideIndex}` : `Slide ${slideIndex}`
}

Carousel.defaultProps = {
    allowLooping: false,
    animationDuration: 0.5,
    dragThreshold: 10,
    getNextMessage: defaultGetNextMessage,
    getPipMessage: defaultGetPipMessage,
    getPreviousMessage: defaultGetPreviousMessage,
    iconSize: 'small',
    moveThreshold: 50,
    nextIcon: 'caret-circle-right',
    previousIcon: 'caret-circle-left',
    showCaption: false,
    showControls: true,
    showPips: false,
    onSlideMove: () => {}
}

Carousel.propTypes = {
    /**
     * AllowLooping will cause the carousel to start at the beginning on the next move
     * when the end is reached.
     */
    allowLooping: PropTypes.bool,

    /**
     * Duration will define the time the animation takes to complete.
     */
    animationDuration: PropTypes.number,

    /**
     * Adds values to the `class` attribute for the Previous/Next buttons.
     */
    buttonClass: PropTypes.string,

    /**
     * The CarouselItems to display.
     *
     * Because of the way this component handles animation,
     * only 3 will ever be rendered at a time.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The index of the current slide. This prop can be used to set the active slide to an index of your choice.
     */
    currentSlide: PropTypes.number,

    /**
     * Number value in pixels representing the distance the user must drag their finger
     * over the carousel item before it starts dragging.
     */
    dragThreshold: positiveNumber,

    /**
     * This function should return a string (or node) that describes the user's current location in the carousel.
     * It will be passed the next slide index and total number of slides.
     */
    getNextMessage: PropTypes.func,

    /**
     * This function should return a string (or node) that describes the meaning of each individual "pip" of
     * the carousel. This function is run for each pip, and is passed whether the pip is the _current_ pip, and
     * the pip's slide index.
     */
    getPipMessage: PropTypes.func,

    /**
     * This function should return a string (or node) that describes the user's current location in the carousel.
     * It will be passed the previous slide index and total number of slides.
     */
    getPreviousMessage: PropTypes.func,

    /**
     * Icon size for the Previous/Next buttons.
     */
    iconSize: PropTypes.string,

    /**
     * Number value in pixels representing the distance the carousel item must be dragged
     * before it qualifies as a valid move.
     */
    moveThreshold: positiveNumber,

    /**
     * Icon name for the "Next Button".
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    nextIcon: PropTypes.string,

    /**
     * Icon name for the "Previous Button".
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    previousIcon: PropTypes.string,

    /**
     * Boolean value to show slide caption or not. The caption is read
     * from the props of the current CarouselItem.
     */
    showCaption: PropTypes.bool,

    /**
     * Boolean value to show carousel controls and pips or not.
     */
    showControls: PropTypes.bool,

    /**
     * Determines hidden controls and display pips.
     * Set this to `true` in combination with `showControls` set to false if
     * you want pips to remain visible while controls are hidden.
     */
    showPips: PropTypes.bool,

    /**
     * Callback that triggers at the end of the `moveComplete` "event"
     */
    onSlideMove: PropTypes.func
}

export default Carousel
