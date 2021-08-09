/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

const panelCache = {}

const renderFullTree = (root = {}, expanded = {}, getRealPath, alreadyRenderedExpandedPanel) => {
    // When possible, return the cached panels. We want to make sure that we've
    // already reached the expanded result before doing this To make sure that
    // we don't return its cached parent and skip it
    if (alreadyRenderedExpandedPanel && panelCache[root.path]) {
        // The || false here makes no sense, but if it's not there, styleguidist
        // throws an error while trying to parse this component
        /* istanbul ignore next */
        return panelCache[root.path] || false
    }

    let result = []

    if (root.path === expanded.path) {
        // Skip the link for this entry and its direct children
        // Instead, render its children's children
        const immediateChildren = root.children || []
        result = immediateChildren.reduce((acc, {children}) => {
            if (!children) {
                return acc
            }

            return acc.concat(
                children.map((child) => renderFullTree(child, expanded, getRealPath, true))
            )
        }, [])
    } else {
        let childNodes = []
        if (root.children) {
            childNodes = root.children.map((child) =>
                renderFullTree(child, expanded, getRealPath, alreadyRenderedExpandedPanel)
            )
        }

        result = [
            <a href={getRealPath(root.path)} key={root.path}>
                {root.title}
            </a>,
            ...childNodes
        ]
    }

    panelCache[root.path] = result

    return result
}

class NonExpandedItems extends React.Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.allowRerender
    }

    componentDidUpdate() {
        this.props.onRenderComplete()
    }

    render() {
        const {root, expanded, getRealPath} = this.props
        return (
            <div className="pw-nav-menu__non-expanded-items u-visually-hidden" aria-hidden="true">
                {renderFullTree(root, expanded, getRealPath, false)}
            </div>
        )
    }
}

NonExpandedItems.propTypes = {
    allowRerender: PropTypes.bool,
    expanded: PropTypes.object,
    getRealPath: PropTypes.func,
    root: PropTypes.object,
    onRenderComplete: PropTypes.func
}

export default NonExpandedItems
