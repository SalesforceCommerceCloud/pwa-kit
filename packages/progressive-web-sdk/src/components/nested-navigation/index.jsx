/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Button from '../button'
import List from '../list'
import prefixAll from 'inline-style-prefixer/static'

const POSITION_LEFT = 'left'
const POSITION_CENTER = 'center'
const POSITION_RIGHT = 'right'

/**
 * <strong style="color:red; font-size:20px;">Deprecated.</strong>
 * This component is deprecated in favour of the `Nav` component.
 * Please use that instead.
 */
class NestedNavigation extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            path: [],
            panels: [
                {
                    path: null,
                    position: POSITION_LEFT,
                    transition: 'none'
                },
                {
                    path: [],
                    position: POSITION_CENTER,
                    transition: 'none'
                },
                {
                    path: null,
                    position: POSITION_RIGHT,
                    transition: 'none'
                }
            ],
            title: {
                text: props.data.title,
                position: POSITION_CENTER,
                transition: 'none'
            }
        }

        this.bindHandlers()
    }

    bindHandlers() {
        this.onPreviousHandler = this.onPreviousHandler.bind(this)
        this.onNextHandler = this.onNextHandler.bind(this)
        this.navigate = this.navigate.bind(this)
        this.updateTitle = this.updateTitle.bind(this)
        this.getList = this.getList.bind(this)
        this.buildList = this.buildList.bind(this)
    }

    getPath(position, path, newIndex) {
        const currentPath = this.state.path

        // If the new index is less than 0, it means we are navigating
        // up in the tree.
        if (newIndex < 0) {
            if (position === POSITION_RIGHT) {
                return currentPath
            } else if (position === POSITION_CENTER) {
                return currentPath.slice(0, path.length - 1)
            }
        } else {
            if (position === POSITION_CENTER) {
                return path.concat(newIndex)
            } else if (position === POSITION_LEFT) {
                return currentPath
            }
        }

        return null
    }

    getPanelStyle(position, newIndex) {
        const {duration} = this.props
        let transition = 'none'

        // Only animate the panel transition if moving one position aka right -> center,
        // center -> left, or left -> center and center -> right.
        if (duration && !(position === POSITION_RIGHT && newIndex >= 0)) {
            transition = `transform ${duration.toString()}ms ease-in-out`
        }

        return transition
    }

    getList(path) {
        if (!path) {
            return null
        }

        let {data} = this.props
        path = [...path] // We don't want to modify the state

        while (path.length) {
            data = data.items[path.shift()]
        }

        return data
    }

    buildList(path) {
        const list = this.getList(path)

        if (!path || !list.items) {
            return <List items={[]} />
        }

        return (
            <List
                component={this.props.component}
                items={list.items}
                clickHandler={this.onNextHandler}
            />
        )
    }

    navigate(index) {
        const {panels, path, title} = this.state
        const {duration} = this.props
        let newPath
        let newList
        let newPosition

        if (index < 0) {
            // Navigating up
            newPath = path.slice(0, path.length - 1)
            newList = this.getList(newPath)
            newPosition = POSITION_RIGHT
            panels.push(panels.shift())
        } else {
            // Navigating to new panel
            newPath = path.concat(index)
            newList = this.getList(newPath)
            newPosition = POSITION_LEFT

            // If the new panel won't have any children, don't show it
            if (!newList || !newList.items) {
                return
            }

            panels.unshift(panels.pop())
        }

        // Update the current path and panels and title
        this.setState({
            path: newPath,
            panels: panels.map(({position, path}) => {
                return {
                    path: this.getPath(position, path, index),
                    position,
                    transition: this.getPanelStyle(position, index)
                }
            }),
            title: {
                text: title.text,
                position: newPosition,
                transition: `transform ${duration / 2}ms ease-in-out`
            }
        })
    }

    updateTitle() {
        const {path, title} = this.state
        const {duration} = this.props

        if (title.position === POSITION_CENTER) {
            return
        }

        const list = this.getList(path)

        // Move the title section into it's pre-animation position,
        // ensuring the transition is off.
        this.setState({
            title: {
                position: title.position === POSITION_LEFT ? POSITION_RIGHT : POSITION_LEFT,
                transition: 'none'
            }
        })

        // Animate the title into it's new position.
        setTimeout(() => {
            this.setState({
                title: {
                    text: list.title,
                    position: POSITION_CENTER,
                    transition: `transform ${duration / 2}ms ease-in-out`
                }
            })
        }, 0)
    }

    onPreviousHandler() {
        // Don't do anything if we are at the root
        const isRoot = !this.state.path.length

        if (isRoot) {
            return
        }

        // Navigate to the parent of the current list
        this.navigate(-1)
    }

    onNextHandler(index) {
        // Navigate to the list at the given index of the current list.
        this.navigate(index)
    }

    render() {
        const {title, panels, path} = this.state
        const {className, header} = this.props
        const previousActionProps = {
            onClick: this.onPreviousHandler
        }

        const classes = classNames('pw-nested-navigation c-nested-navigation', className)
        const headerClassName = classNames(
            'pw-nested-navigation__header c-nested-navigation__header',
            {
                'pw--is-root c--is-root': !path.length
            }
        )
        const prevActionClass = classNames(
            'pw-nested-navigation__prev-action c-nested-navigation__prev-action',
            {
                'pw--is-root c--is-root': !path.length
            }
        )
        const titleContentClass = `pw-nested-navigation__title-content c-nested-navigation__title-content pw--${title.position} c--${title.position}`

        return (
            <div className={classes}>
                {header && (
                    <div className={headerClassName}>
                        <div className="pw-nested-navigation__actions c-nested-navigation__actions">
                            {/* If the user wants to use their oun back button, clone it with the default actions,
                                otherwise use a button as the default. */}
                            <div className={prevActionClass}>
                                {header.previousAction ? (
                                    React.cloneElement(header.previousAction, previousActionProps)
                                ) : (
                                    <Button {...previousActionProps}>Back</Button>
                                )}
                            </div>

                            {/* Add any other user provided actions, wrapping them in our action container. */}
                            {header.startActions &&
                                header.startActions.map((action, index) => (
                                    <div
                                        className="pw-nested-navigation__action c-nested-navigation__action"
                                        key={index}
                                    >
                                        {action}
                                    </div>
                                ))}
                        </div>

                        <div className="pw-nested-navigation__title c-nested-navigation__title">
                            <div
                                className={titleContentClass}
                                onTransitionEnd={this.updateTitle}
                                style={prefixAll({
                                    transition: title.transition
                                })}
                            >
                                {title.text}
                            </div>
                        </div>

                        <div className="pw-nested-navigation__actions c-nested-navigation__actions">
                            {header.endActions &&
                                header.endActions.map((action, index) => (
                                    <div
                                        className="pw-nested-navigation__action c-nested-navigation__action"
                                        key={index}
                                    >
                                        {action}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                <div className={`pw-nested-navigation__container c-nested-navigation__container`}>
                    {panels.map((panel, index) => (
                        <div
                            className={`pw-nested-navigation__panel c-nested-navigation__panel pw--${panel.position} c--${panel.position}`}
                            key={index}
                            style={prefixAll({transition: panel.transition})}
                        >
                            {this.buildList(panel.path)}
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

NestedNavigation.propTypes = {
    /**
     * Data is the nested navigation json
     */
    data: PropTypes.object.isRequired,
    /**
     * The CSS class/classes to be applied to the root element
     */
    className: PropTypes.string,
    /**
     * The component to render for each item.
     * By default, ListTiles will be rendered
     */
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    /**
     * Number in milliseconds for the slide animation
     */
    duration: PropTypes.number,
    /**
     * The header configuration for this component.
     * Options include previousAction (element), startActions (element array) and
     * endActions (element array)
     */
    header: PropTypes.shape({
        previousAction: PropTypes.element,
        startActions: PropTypes.arrayOf(PropTypes.element),
        endActions: PropTypes.arrayOf(PropTypes.element)
    })
}

NestedNavigation.defaultProps = {
    data: {},
    duration: 250,
    header: {}
}

export default NestedNavigation
