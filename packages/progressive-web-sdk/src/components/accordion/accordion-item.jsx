/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '../icon'
import AccordionItemContent from './accordion-item-content'

import {onKeyUpWrapper} from '../../a11y-utils'

import TransitionGroup from 'react-transition-group/TransitionGroup'

/**
 * Related components:
 *
 * * [AccordionItemContent](#!/AccordionItemContent)
 * * [Accordion](#!/Accordion)
 *
 * `AccordionItem` acts as expandable container for the accordion's content.
 *
 * @example ./DESIGN.md
 */

class AccordionItem extends React.Component {
    constructor(props) {
        super(props)

        this.id = props.id
        this.itemId = `accordion__item-${this.id}`
        this.onClick = this.onClick.bind(this)
        this.onAnimationComplete = this.onAnimationComplete.bind(this)
    }

    onClick(e) {
        this.props.onHeaderClick(e)
    }

    componentWillReceiveProps(nextProps) {
        const {shown, onOpen, onClose} = this.props

        if (nextProps.shown === shown) {
            return
        }

        if (nextProps.shown) {
            onOpen(this.itemId)
        } else {
            onClose(this.itemId)
        }
    }

    // NOTE: JSDOM doesn't invoke animation complete events, so this never gets called
    // during tests.
    /* istanbul ignore next */
    onAnimationComplete() {
        const {shown, onOpened, onClosed} = this.props

        if (shown) {
            onOpened(this.itemId)
        } else {
            onClosed(this.itemId)
        }
    }

    render() {
        const {
            children,
            className,
            shown,
            prerender,
            header,
            openIconName,
            closeIconName,
            iconSize,
            iconPosition,

            duration,
            easing
        } = this.props

        const classes = classNames(
            'pw-accordion__item',
            {
                'pw-accordion--is-open': shown,
                'pw-accordion--is-prerender': prerender && !shown
            },
            className
        )

        const headerId = `accordion__header-${this.id}`
        const contentId = `accordion__content-${this.id}`

        return (
            <div
                className={classes}
                id={this.itemId}
                ref={(el) => {
                    this._container = el
                }}
            >
                <button
                    className="pw-accordion__header"
                    onClick={this.onClick}
                    onKeyUp={onKeyUpWrapper(this.onClick)}
                    tabIndex="0"
                    role="tab"
                    aria-expanded={shown}
                    aria-selected={shown}
                    aria-controls={contentId}
                    id={headerId}
                    type="button"
                    data-analytics-name={`${shown ? 'collapse' : 'expand'}_${'accordion'}`}
                    data-analytics-content={this.itemId}
                >
                    <div className={`pw-accordion__inner-header pw--icon-${iconPosition}`}>
                        <div className="pw-accordion__icon" aria-hidden="true">
                            <div className="pw-accordion__open-icon">
                                <Icon
                                    className="pw-accordion__glyph"
                                    size={iconSize}
                                    name={openIconName}
                                />
                            </div>

                            <div className="pw-accordion__close-icon">
                                <Icon
                                    className="pw-accordion__glyph"
                                    size={iconSize}
                                    name={closeIconName}
                                />
                            </div>
                        </div>

                        <div className="pw-accordion__title">{header}</div>
                    </div>
                </button>

                {!shown && prerender && <AccordionItemContent>{children}</AccordionItemContent>}

                <TransitionGroup
                    component="div"
                    role="tabpanel"
                    id={contentId}
                    aria-hidden={!shown}
                    aria-labelledby={headerId}
                    tabIndex={shown ? 0 : -1}
                >
                    {shown && (
                        <AccordionItemContent
                            onAnimationComplete={this.onAnimationComplete}
                            duration={duration}
                            easing={easing}
                        >
                            {children}
                        </AccordionItemContent>
                    )}
                </TransitionGroup>
            </div>
        )
    }
}

AccordionItem.defaultProps = {
    closeIconName: 'minus',
    iconPosition: 'start',
    openIconName: 'plus'
}

AccordionItem.propTypes = {
    /**
     * Whatever you'd like this AccordionItem to display.
     * This can also include more Accordions.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The name of the icon shown in the header
     * when the accordion can be closed.
     */
    closeIconName: PropTypes.string,

    /**
     * PROVIDED INTERNALLY. Duration of the animation in millis.
     */
    duration: PropTypes.number,

    /**
     * PROVIDED INTERNALLY. Easing function for the animation.
     */
    easing: PropTypes.string,

    /**
     * The content that should be displayed as the header.
     */
    header: PropTypes.node,

    /**
     * Determines whether the icons should be placed before or after the title.
     */
    iconPosition: PropTypes.oneOf(['start', 'end']),

    /**
     * Passes a custom className to the Accordion Item's icon.
     */
    iconSize: PropTypes.string,

    /**
     * A unique identifier for this AccordionItem.
     * It is highly recommended that you provide an id for each AccordionItem.
     */
    id: PropTypes.string,

    /**
     * The name of the icon shown in the header
     * when the accordion can be opened.
     */
    openIconName: PropTypes.string,

    /**
     * This is used by Accordion to prerender the content before openning it.
     */
    prerender: PropTypes.bool,

    /**
     * PROVIDED INTERNALLY. This is used by Accordion to open and close the items
     */
    shown: PropTypes.bool,

    /**
     * Triggered every time an accordion item is
     * starting to close.  This function is passed the id of the
     * accordion item which is closing.
     */
    onClose: PropTypes.func,

    /**
     * Triggered every time an accordion item is
     * finished closing.  This function is passed the id of the
     * accordion item which closed.
     */
    onClosed: PropTypes.func,

    /**
     * PROVIDED INTERNALLY. This is the callback used by Accordion to
     * open and close the items.
     */
    onHeaderClick: PropTypes.func,

    /**
     * Triggered every time an accordion item is
     * starting to open.  This function is passed the id of the
     * accordion item which is opening.
     */
    onOpen: PropTypes.func,

    /**
     * Triggered every time an accordion item has
     * finished opening.  This function is passed the id of the
     * accordion item which opened.
     */
    onOpened: PropTypes.func
}

export default AccordionItem
