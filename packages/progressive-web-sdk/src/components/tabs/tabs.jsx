/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {childIndexProp} from '../../prop-type-utils'
import {noop} from '../../utils/utils'

import TabsStrip from './tabs-strip'

/**
 * Related component:
 *
 * * [TabsPanel](#!/TabsPanel)
 *
 * This component is used to display tabbed navigation.
 * User can select a tab to view its related content.
 *
 * @example ./DESIGN.md
 */

class Tabs extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            activeTabIndex: props.activeIndex
        }

        // Bind class functions to object
        this.setIndex = this.setIndex.bind(this)
    }

    setIndex(index) {
        const {activeTabIndex} = this.state

        // This is an optimization and does not need testing
        /* istanbul ignore if */
        if (index === activeTabIndex) {
            return
        }

        this.setState({
            activeTabIndex: index
        })

        this.props.onChange(index)
    }

    componentWillReceiveProps(newProps) {
        if (newProps.activeIndex !== this.props.activeIndex) {
            this.setState({
                activeTabIndex: newProps.activeIndex
            })
        }
    }

    render() {
        const {activeTabIndex} = this.state
        const {children, className, isScrollable} = this.props
        const classes = classNames('pw-tabs', className)

        return (
            <div className={classes} data-selected-index={activeTabIndex}>
                <TabsStrip
                    activeIndex={activeTabIndex}
                    setIndex={this.setIndex}
                    isScrollable={isScrollable}
                >
                    {children}
                </TabsStrip>

                {/* TabsPanel Container */}
                <div className="pw-tabs__panels">
                    {/* Clone children passing in prop values. */}
                    {React.Children.map(children, (child, idx) => {
                        return React.cloneElement(child, {
                            isActive: activeTabIndex === idx,
                            key: idx
                        })
                    })}
                </div>
            </div>
        )
    }
}

Tabs.defaultProps = {
    activeIndex: 0,
    onChange: noop
}

Tabs.propTypes = {
    /**
     * Nodes to be used as tab panels, can be a combination of markup and/or
     * React components. There should be more than 1 child panel.
     */
    children: PropTypes.node.isRequired,

    /**
     * ActiveIndex defines the active panel(selected).
     */
    activeIndex: childIndexProp,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Indicates whether the tab links are scrollable or not.
     */
    isScrollable: PropTypes.bool,

    /**
     * This function is called whenever the tab is changed.
     */
    onChange: PropTypes.func
}

export default Tabs
