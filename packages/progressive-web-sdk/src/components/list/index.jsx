/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import ListTile from '../list-tile'

/**
 * The `List` component is used to enclose a series of related items, providing a
 * consistent balance of space and separation between each item.
 *
 * @example ./DESIGN.md
 */

const List = ({items, className, clickHandler, component, children}) => {
    const classes = classNames('pw-list', className)

    return (
        <div className={classes}>
            {React.Children.count(children)
                ? children
                : items.map((item, idx) => {
                      const componentToRender = item.component || component || ListTile

                      return React.createElement(componentToRender, {
                          key: idx,
                          onClick: (...args) => clickHandler(idx, ...args),
                          children: item.children || item.title,
                          ...item
                      })
                  })}
        </div>
    )
}

List.defaultProps = {
    items: []
}

List.propTypes = {
    /**
     * Any children to be nested within the List.
     */
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),

    /**
     * The CSS class/classes to be applied to the root element.
     */
    className: PropTypes.string,

    /**
     * A function to be called when an item in the list is
     * clicked. Not called if the item has an `href` set, or if
     * children are passed directly.
     */
    clickHandler: PropTypes.func,

    /**
     * The component to render for each item.
     * By default, List will render ListTiles.
     * If an item has a component prop defined within its data,
     * that component will be rendered instead.
     */
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),

    /**
     * An array of the items that should be rendered.
     */
    items: PropTypes.arrayOf(PropTypes.object)
}

export default List
