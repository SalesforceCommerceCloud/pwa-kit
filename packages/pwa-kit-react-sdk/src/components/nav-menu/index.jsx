/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import NavSlider from '../nav-slider'
import Nav from '../nav'
import NavItem from '../nav-item'
import NonExpandedItems from './non-expanded-items'
import TransitionGroup from 'react-transition-group/TransitionGroup'
import classNames from 'classnames'

/**
 * Related components:
 *
 * * [Nav](#!/Nav)
 * * [NavHeader](#!/NavHeader)
 * * [NavItem](#!/NavItem)
 * * [NavMenu](#!/NavMenu)
 * * [NavSlider](#!/NavSlider)
 *
 * `NavMenu` is responsible for rendering the pages of `NavItem`s as a user
 * traverses the navigation tree (see the [`Nav` component's](#!/Nav) `root`
 * prop).
 *
 * For example, the `NavMenu` could render all of the root level
 * items from which the user could click through into a second level of items,
 * at which point the `NavMenu` would animated out the previous level then
 * animate in the next level.
 *
 * `NavMenu` cannot be used by itself. It must be inserted into a `Nav`
 * component.
 *
 * @example ./DESIGN.md
 */

class NavMenu extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            rerenderNonExpandedItems: false
        }
    }

    render() {
        const {className, itemFactory, animationProperties, getRealPath, prerender} = this.props
        const {selected, expanded, expandedPath, goToPath, root} = this.context
        const classes = classNames('pw-nav-menu', className)
        const sliderClasses = classNames('pw-nav-menu__slider', {
            'pw--has-custom-menu-animation': Object.keys(animationProperties).length > 0,
            [animationProperties.className]: animationProperties.className
        })

        return (
            <TransitionGroup component="div" className={classes}>
                <NavSlider
                    {...animationProperties}
                    className={sliderClasses}
                    key={expandedPath}
                    onEnterComplete={() => {
                        requestAnimationFrame(() => {
                            this.setState({rerenderNonExpandedItems: true})
                        })
                    }}
                >
                    <div className="pw-nav-menu__panel">
                        {(expanded.children || []).map((child, idx) => {
                            const props = {
                                key: idx,
                                navigate: goToPath.bind(undefined, child.path),
                                selected: child === selected,
                                hasChild: (child.children || []).length > 0,
                                title: child.title,
                                path: child.path,
                                options: child.options
                            }
                            return itemFactory(child.type, props)
                        })}
                    </div>
                </NavSlider>

                {prerender && (
                    <NonExpandedItems
                        allowRerender={this.state.rerenderNonExpandedItems}
                        root={root}
                        expanded={expanded}
                        getRealPath={getRealPath}
                        onRenderComplete={() => {
                            this.setState({rerenderNonExpandedItems: false})
                        }}
                    />
                )}
            </TransitionGroup>
        )
    }
}

const defaultItemFactory = (type, props) => {
    return <NavItem {...props} />
}

NavMenu.contextTypes = Nav.childContextTypes

NavMenu.defaultProps = {
    itemFactory: defaultItemFactory,
    animationProperties: {},
    getRealPath: (path) => path,
    prerender: true
}

NavMenu.propTypes = {
    /**
     * Animation properties for customizing the NavMenu's animation.
     * These properties are passed down to the internal NavSlider
     * component as props.
     */
    animationProperties: PropTypes.shape({
        /**
         * Adds values to the `class` attribute to the
         * internal NavSlider.
         */
        className: PropTypes.string,
        /**
         * Duration of the animation in milliseconds.
         */
        duration: PropTypes.number,
        /**
         * Easing function for the animation.
         */
        easing: PropTypes.string,
        /**
         * Id given to the internal NavSlider.
         */
        id: PropTypes.string
    }),

    /**
     * Extra classes for the element.
     */
    className: PropTypes.string,

    /**
     * This function will be passed the path of an item in the navigation
     * It should return the appropriate URL for that path
     * This was included to work around the issue where the Navigation requires unique paths
     * And uses the number of /s in the path to infer which direction to slide when animating
     */
    getRealPath: PropTypes.func,

    /**
     * Factory function to render menu items for display.
     */
    itemFactory: PropTypes.func,

    /**
     * Determines if the NavMenu should also render parts of the nav
     * that aren't currently expanded
     * This can be helpful for SEO, as it allows all links
     * in the Navigation to be present in the DOM
     */
    prerender: PropTypes.bool
}

export default NavMenu
