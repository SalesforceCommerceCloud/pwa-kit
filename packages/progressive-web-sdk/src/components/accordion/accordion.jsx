/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import AccordionItem from './accordion-item'
import withUniqueId from '../with-unique-id'

const noop = () => undefined

/**
 * Related components:
 *
 * * [AccordionItemContent](#!/AccordionItemContent)
 * * [AccordionItem](#!/AccordionItem)
 *
 * `Accordion` is the outer wrapper of expandable content.
 * It is used to expand and collapse the content by clicking its header.
 *
 * @example ./DESIGN.md
 */

class Accordion extends React.Component {
    constructor(props) {
        super(props)

        // With older versions of the Accordion component
        // initialOpenItems was passed indices, rather than the ids
        // To allow projects using those versions to use the new structure without breaking changes,
        // we need to transform these indices into their equivalent default ids
        const remappedOpenItems = props.initialOpenItems.map((id) => id.toString())

        this.state = {
            openItems: remappedOpenItems
        }

        this.onClick = this.onClick.bind(this)

        this.updateItem = this.updateItem.bind(this)
        this.openItem = this.openItem.bind(this)
        this.closeItem = this.closeItem.bind(this)
        this.mapChildren = this.mapChildren.bind(this)
    }

    updateItem(id, opening) {
        const childrenAsArray = React.Children.toArray(this.mapChildren())
        const childWithId = childrenAsArray.find((child) => {
            return child.props.id === id
        })

        if (!childWithId) {
            return
        }

        let openItems = [...this.state.openItems]
        const openItemArrayIndex = openItems.indexOf(id)
        const alreadyOpen = openItemArrayIndex !== -1

        if (opening) {
            if (this.props.singleItemOpen) {
                openItems = [id]
            } else if (!alreadyOpen) {
                // Don't push multiple copies of the same index into openItems
                openItems.push(id)
            }
        } else {
            if (this.props.singleItemOpen) {
                openItems = []
            } else if (alreadyOpen) {
                openItems.splice(openItemArrayIndex, 1)
            }
        }

        this.setState({openItems})
    }

    onClick(id, evt) {
        evt.preventDefault()
        const openItems = this.state.openItems
        const openItemArrayIndex = openItems.indexOf(id)

        this.updateItem(id, openItemArrayIndex === -1)
    }

    openItem(id) {
        this.updateItem(id, true)
    }

    closeItem(id) {
        this.updateItem(id, false)
    }

    openAllItems() {
        const ids = React.Children.map(this.mapChildren(), (child) => child.props.id)
        this.setState({
            openItems: ids
        })
    }

    closeAllItems() {
        this.setState({
            openItems: []
        })
    }

    // We want to make sure that anytime
    // we access the children to check their ids
    // that we're using the version of the children
    // where we provided default ids if none were defined
    mapChildren() {
        const {
            duration,
            easing,
            onOpen,
            onOpened,
            onClose,
            onClosed,
            prerender,

            children
        } = this.props

        return React.Children.map(children, (child, index) => {
            // If the user is using && to conditionally add a child
            // the child could be undefined
            if (child && child.type && child.type.name === AccordionItem.name) {
                const id = child.props.id || index.toString()

                const childProps = {
                    onHeaderClick: this.onClick.bind(this, id),
                    shown: this.state.openItems.indexOf(id) > -1,
                    prerender,
                    duration,
                    easing,
                    key: id,
                    // Set this again it wasn't provided and we're using the index
                    id
                }

                // Allow callbacks added to the AccordionItem directly
                // to override ones added to the Accordion
                if (!child.props.onOpen) {
                    childProps.onOpen = onOpen
                }

                if (!child.props.onOpened) {
                    childProps.onOpened = onOpened
                }

                if (!child.props.onClose) {
                    childProps.onClose = onClose
                }

                if (!child.props.onClosed) {
                    childProps.onClosed = onClosed
                }

                return React.cloneElement(child, childProps)
            } else {
                return child
            }
        })
    }

    render() {
        const {className, singleItemOpen} = this.props

        const classes = classNames('pw-accordion', className)

        return (
            <div className={classes} aria-multiselectable={!singleItemOpen} role="tablist">
                {this.mapChildren()}
            </div>
        )
    }
}

Accordion.defaultProps = {
    onOpen: noop,
    onOpened: noop,
    onClose: noop,
    onClosed: noop,
    duration: 500,
    easing: 'ease',
    singleItemOpen: false,
    initialOpenItems: []
}

Accordion.propTypes = {
    /**
     * This list of `AccordionItems` you'd like to display.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Duration of the animation in millis.
     */
    duration: PropTypes.number,

    /**
     * Easing function for the animation.
     */
    easing: PropTypes.string,

    /**
     * Component ID, component will use child id, if not provided then will be
     * generated by HOC, `withUniqueId`.
     */
    id: PropTypes.string,

    /**
     * If an item should be open by default, include its id in this array.
     * In order to support the old version where this prop accepted indices,
     * all items in this array will be converted into strings.
     */
    initialOpenItems: PropTypes.array,

    /**
     * Determines whether the content is available in DOM before opening the accordion
     */
    prerender: PropTypes.bool,

    /**
     * When set to true will force only one item open at a time.
     */
    singleItemOpen: PropTypes.bool,

    /**
     * Triggered every time an accordion item is starting to close.
     * This function is passed the id of the accordion item which is closing.
     * This prop can also be passed to an AccordionItem.
     */
    onClose: PropTypes.func,

    /**
     * Triggered every time an accordion item is finished closing.
     * This function is passed the id of the accordion item which closed.
     * This prop can also be passed to an AccordionItem.
     */
    onClosed: PropTypes.func,

    /**
     * Triggered every time an accordion item is starting to open.
     * This function is passed the id of the accordion item which is opening.
     * This prop can also be passed to an AccordionItem.
     */
    onOpen: PropTypes.func,

    /**
     * Triggered every time an accordion item has finished opening.
     * This function is passed the id of the accordion item which opened.
     * This prop can also be passed to an AccordionItem.
     */
    onOpened: PropTypes.func
}

export {Accordion as AccordionWithoutUniqueId}
export default withUniqueId(Accordion)
