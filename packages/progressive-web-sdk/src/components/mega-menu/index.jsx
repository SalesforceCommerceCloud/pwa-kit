/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {keyMap} from '../../a11y-utils'

import MegaMenuItem from '../mega-menu-item'
import Nav from '../nav'

const CURRENT_ACTIVE_LEVEL_1_ITEM = '.pw-mega-menu-item.pw--depth-1.pw--active'
const NEXT_TARGET_CONTENT_BUTTON = '[role="button"]'

/**
 * Related components:
 *
 * * [Nav](#!/Nav)
 * * [MegaMenuItem](#!/MegaMenuItem)
 *
 * MegaMenu is responsible for rendering a tree of `MegaMenuItem`s that users
 * can traverse the navigation tree (see the [`Nav` component](#!/Nav)'s
 * `root` prop)
 *
 * For example, the `MegaMenu` could render all of the root level items from
 * which the user can "hover" using their mouse (or tap on a touch device) to
 * view teh second level of items, at which point the `MegaMenu` would reveal
 * those menu items.
 *
 * `MegaMenu` cannot be used by itself. It must be inserted into a `Nav` component
 */

class MegaMenu extends React.Component {
    constructor(props) {
        super(props)

        this.ref = null

        this._handleKeyUp = this._handleKeyUp.bind(this)
        this._renderTree = this._renderTree.bind(this)
    }

    _handleKeyUp(e) {
        const currentEl = this.ref.querySelector(CURRENT_ACTIVE_LEVEL_1_ITEM)

        /* istanbul ignore next */
        if (!currentEl) {
            return
        }

        let newTarget

        switch (e.keyCode) {
            case keyMap.left:
                newTarget = currentEl.previousSibling
                break
            case keyMap.right:
                newTarget = currentEl.nextSibling
                break
            default:
                return
        }

        /* istanbul ignore next */
        if (newTarget) {
            newTarget.querySelector(NEXT_TARGET_CONTENT_BUTTON).focus()
        }
    }

    _renderTree(tree = this.context.root, depth = 0, key = '0') {
        const selected = this.context.selected.path === tree.path

        // Examples: Given a current `selectedKey` of `0.1.0.1`...
        //
        // - indexOf('0.1') => 0  // This item exist in the same branch
        // - indexOf('1.0') => 2  // This item does not exist in the same branch
        // - indexOf('0.2') => -1 // This item does not exist in the same branch
        const hasSelected = this.context.selectedKey.indexOf(key) === 0

        const itemProps = {
            key,
            depth,
            selected,
            hasSelected,
            content: tree.title,
            navigate: (trigger, path) => this.context.goToPath(path || tree.path, trigger),
            path: tree.path,
            options: tree.options
        }

        if (tree.children && tree.children.length > 0) {
            itemProps.children = tree.children.map((child, idx) =>
                this._renderTree(child, depth + 1, `${key}.${idx}`)
            )
        }

        return this.props.itemFactory(tree.type, itemProps)
    }

    render() {
        const {className} = this.props
        const classes = classNames('pw-mega-menu', className)

        return (
            // This a11y lint is being disabled, because they keyUp handlers are not
            // for interactions on this div, it's for interactions on the tabbable
            // items inside of this component.
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div
                role="list"
                className={classes}
                onKeyUp={this._handleKeyUp}
                ref={(el) => {
                    /* istanbul ignore next */
                    this.ref = el
                }}
            >
                {this._renderTree()}
            </div>
        )
    }
}

const defaultItemFactory = (type, props) => {
    return <MegaMenuItem {...props} />
}

MegaMenu.contextTypes = Nav.childContextTypes

MegaMenu.defaultProps = {
    itemFactory: defaultItemFactory,
    path: '/'
}

MegaMenu.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Factory function to render menu items for display. It takes two
     * arguments:
     *
     * - `type` (string)
     * - `props` (object)
     */
    itemFactory: PropTypes.func,

    /**
     * The currently selected path in the navigation.
     */
    path: PropTypes.string,

    /**
     * The structure of the navigation as a JS object.
     */
    root: PropTypes.shape({
        title: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        type: PropTypes.string,
        children: PropTypes.array
    })
}

export default MegaMenu
