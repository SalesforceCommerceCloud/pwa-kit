/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import debounce from 'debounce'

const noop = () => undefined
const debounceTimer = 5

/**
 * @typedef NavigationNode
 * @type {object}
 * @property {string} title
 * @property {string} path
 * @property {type} string
 * @property {Array} children
 */

/**
 * Related components:
 *
 * * [Nav](#!/Nav)
 * * [NavHeader](#!/NavHeader)
 * * [NavItem](#!/NavItem)
 * * [NavMenu](#!/NavMenu)
 * * [NavSlider](#!/NavSlider)
 * * [MegaMenu](#!/MegaMenu)
 * * [MegaMenuItem](#!/MegaMenuItem)
 *
 * The `Nav` component provides an arbitrarily nested navigation
 * tree which can be used to manage transitions between navigation nodes.
 *
 * The state of the navigation tree is shared with child components
 * through `context`, making it easy to build custom navigation UIs.
 * For simple cases, a set of default components are provided.
 *
 * Subscribe to changes through the `onPathChange` prop in order to
 * make changes to the navigation state of the app.
 *
 * @example ./DESIGN.md
 */
class Nav extends React.PureComponent {
    constructor(props) {
        super(props)
        this.goToPath = this.goToPath.bind(this)
        this.goBack = this.goBack.bind(this)
        this.getDerivedState = this.getDerivedState.bind(this)
        this.state = this.getDerivedState({root: undefined, path: '/'}, this.props)

        /* We expect onPathChange to make calls to setState, which trigger a rerender of the entire nav
         *
         * As users operate the Nav, they could trigger several near simulataneous events which could
         * trigger extra renders such as a blur + focus
         *
         * React tries to avoid needless renders by batching setState calls in event handlers and lifecycle methods
         * However, React 16 doesn't batch setState calls fired from event handlers containing timeouts or promises
         * such as in the `MegaMenuItem` component
         *
         * For more details, see
         * https://stackoverflow.com/questions/56885037/react-batch-updates-for-multiple-setstate-calls-inside-useeffect-hook
         *
         * We debounce here to limit extra renders when Nav or MegaMenu event handlers contain promises and/or timeouts
         *
         * TODO: This can be removed in React 17 as React will batch setState calls everywhere then
         */

        this.onPathChange = debounce(this.props.onPathChange, debounceTimer)
    }

    componentWillReceiveProps(newProps) {
        this.setState(this.getDerivedState(this.props, newProps))
        this.onPathChange = debounce(this.props.onPathChange, debounceTimer)
    }

    /**
     * Clone the tree and enrich the nodes with any extra
     * props we need.
     *
     * @param {NavigationNode} root - Navigation tree passed into the Nav component.
     * @return {Array<[NavigationNode, bool]>}:
     * - The enriched navigation tree with deduplicated path property and
     * an added originalPath property
     * - A boolean that is true if the navigation tree passed into
     * the method has duplicate paths, false otherwise.
     */
    static mapTree(root) {
        const seen = {}
        let containsDuplicates = false
        const inner = (node) => {
            const clone = Object.assign({}, node, {
                path: Nav.encodePath(node.path, seen),
                originalPath: node.path
            })
            const isDuplicate = clone.path !== clone.originalPath
            containsDuplicates = containsDuplicates || isDuplicate
            seen[clone.path] = true
            if (clone.children) {
                clone.children = clone.children.map(inner)
            }
            return clone
        }
        return [root === undefined ? undefined : inner(root), containsDuplicates]
    }

    /**
     * @param {NavigationNode} root - Navigation tree passed into the Nav component
     * @return {object} - Map indexing each path of the navigation tree. Each
     * indexed path is an object that contains the following properties:
     * - node: node referenced by the path (type: NavigationNode)
     * - parent: parent node of the node referenced by the path (type: NavigationNode)
     * - depth: the depth of the tree node is located at.
     * - key: A unique key associated with each node
     */
    static indexTree(root) {
        const inner = (node, parent = undefined, map = {}, depth = 0, key = '0') => {
            parent = parent || node // Root is its own parent

            map[node.path] = {node, parent, depth, key}

            const children = node.children || []
            children.forEach((child, idx) => {
                inner(child, node, map, depth + 1, `${key}.${idx}`)
            })
            return map
        }
        return root === undefined ? {} : inner(root)
    }

    /**
     * Deduplicate path by appending '#'s to the end of the path until
     * we come up with a path that is not already indexed by map
     */
    static encodePath(path, map) {
        while (map.hasOwnProperty(path)) {
            path += '#'
        }
        return path
    }

    getDerivedState(oldProps, newProps) {
        // Build or get a map of all paths (or IDs) to their respective node,
        // parentNodes and depth
        const rootChanged = oldProps.root !== newProps.root

        const [root, containsDuplicates] = rootChanged
            ? Nav.mapTree(newProps.root)
            : [this.state.root, false]
        const nodes = rootChanged ? Nav.indexTree(root) : this.state.nodes

        const implementedOnPathChange = newProps.onPathChange !== noop
        const shouldWarn = implementedOnPathChange && newProps.onPathChange.length !== 4
        if (containsDuplicates && shouldWarn) {
            // User is at risk of doing window.location = 'example.com/###',
            // which is our de-duplication strategy. This is a minor issue, but warn
            // and ask them to upgrade their onPathChange handler.
            console.warn(
                `Your Nav contains duplicate paths. Make sure you change your ` +
                    `onPathChange callback to use originalPath when changing routes. ` +
                    `See https://dev.mobify.com/v2.x/apis-and-sdks/component-library/components/Nav`
            )
        }

        // Get the new, current active path
        const selectedPath = newProps.path
        const selectedKey = nodes[selectedPath].key

        // Get the current node and parent node from the active path
        const {node: selected, parent: selectedParent} = nodes[selectedPath]

        // Check if the current node is a leaf or not
        const isLeaf = (selected.children || []).length === 0

        // Get the previous "expanded" path/ID. If no previous (i.e. at
        // instantiation) then default to the root
        const oldExpandedPath = this.state ? this.state.expandedPath : '/'

        // leaves can't be expanded, so only get valid expanded path. If it's
        // a leaf, get the parent path; if it's not a leaf, get the current path
        const expandedPath = isLeaf ? selectedParent.path : selectedPath

        // Based on the _expanded_ path (not necessarily the active path as with
        // leafs), get the current expanded node and its depth
        const {node: expanded, depth} = nodes[expandedPath]

        // Get the old depth value
        const {depth: oldDepth} = nodes[oldExpandedPath]

        // Based on current and previous depths, determine whether we are
        // ascending or descending
        const action = depth > oldDepth ? 'descending' : 'ascending'

        return {
            selectedPath, // (string) The new/current active path (i.e. '/')
            selectedKey, // (string) The new/current active key (i.e. '0.1.2.3')
            selected, // (object) The new/current active node that represents the current path
            expandedPath, // (string) The new/current active _expanded_ path (can't be a leaf)
            expanded, // (object) The new/current active _expanded_ node, based on expandedPath
            action, // (string) Whether we are ascending or descending
            nodes, // (object) The complete map of all possible nodes in the navigation tree
            root // (object) The object passed by the user (after deep cloning)
        }
    }

    goToPath(path, trigger = 'click') {
        if (this.state.nodes.hasOwnProperty(path)) {
            const {node} = this.state.nodes[path]
            const isLeaf = (node.children || []).length === 0
            this.onPathChange(path, isLeaf, trigger, node.originalPath)
            if (trigger == 'click') {
                // Flush the debouncer to ensure that onPathChange is called immediately
                // to apply the click
                this.onPathChange.flush()
            }
        }
    }

    goBack() {
        const {expandedPath} = this.state
        const {parent: expandedParent} = this.state.nodes[expandedPath]
        this.goToPath(expandedParent.path)
    }

    getChildContext() {
        return {
            ...this.state,
            goToPath: this.goToPath,
            goBack: this.goBack
        }
    }

    render() {
        const {className, children} = this.props
        const classes = classNames('pw-nav', className)

        return <nav className={classes}>{children}</nav>
    }
}

Nav.defaultProps = {
    path: '/',
    root: {title: '', path: '/'},
    onPathChange: noop
}

Nav.propTypes = {
    /**
     * The element's children.
     */
    children: PropTypes.node,

    /**
     * Additional CSS classes to give to the element.
     */
    className: PropTypes.string,

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
    }),

    /**
     * Callback invoked when the selected path changes. The callback is defined
     * as of type:
     *
     * `(path: String, isLeaf: Boolean, trigger: String, originalPath: String) => any`
     *
     * The `trigger` argument designates what type of action triggered the path
     * change. It can be one of the following values: `mouseEnter`,
     * `mouseLeave`, `touchEnd`, `focus`, `blur`, or `click`.
     */
    onPathChange: PropTypes.func
}

Nav.childContextTypes = {
    nodes: PropTypes.object,
    root: PropTypes.object,
    selected: PropTypes.object,
    selectedKey: PropTypes.string,
    selectedPath: PropTypes.string,
    expanded: PropTypes.object,
    expandedPath: PropTypes.string,
    action: PropTypes.string,
    goToPath: PropTypes.func,
    goBack: PropTypes.func
}

export default Nav
