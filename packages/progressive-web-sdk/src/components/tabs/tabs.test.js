/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import {Tabs, TabsPanel} from './index.js'
import TabsStrip from './tabs-strip'

jest.mock('lodash.throttle')
import throttle from 'lodash.throttle'
throttle.mockImplementation((fn) => fn)

describe('TabsPanel', () => {
    test('TabsPanel renders without errors', () => {
        const wrapper = mount(<TabsPanel />)
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<TabsPanel />)
        expect(wrapper.hasClass('pw-tabs__panel')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<TabsPanel />)
        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<TabsPanel className={name} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })
})

describe('TabsStrip', () => {
    test('renders without errors', () => {
        const wrapper = mount(<TabsStrip />)

        expect(wrapper.length).toBe(1)
    })

    test('renders a tab strip with one entry per panel', () => {
        const wrapper = mount(
            <TabsStrip>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </TabsStrip>
        )

        expect(wrapper.find('.pw-tabs__tab').length).toBe(2)
        const anchors = wrapper.find('.pw-tabs__tab a')
        expect(anchors.at(0).text()).toBe('one')
        expect(anchors.at(1).text()).toBe('two')
    })

    test('selects the activeIndex prop tab by default', () => {
        const wrapper = mount(
            <TabsStrip activeIndex={1}>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </TabsStrip>
        )

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('two')
    })

    test('adds resize event listener on mount if isScrollable', () => {
        const addEventListener = window.addEventListener
        window.addEventListener = jest.fn(addEventListener)

        const wrapper = mount(<TabsStrip isScrollable />)
        expect(window.addEventListener).toHaveBeenCalledWith(
            'resize',
            wrapper.instance().checkOverflow
        )

        window.addEventListener = addEventListener
    })

    test('removes resize event listener on unmount if isScrollable', () => {
        const removeEventListener = window.removeEventListener
        window.removeEventListener = jest.fn(removeEventListener)

        const wrapper = mount(<TabsStrip isScrollable />)
        const handler = wrapper.instance().checkOverflow
        expect(window.removeEventListener).not.toHaveBeenCalledWith('resize', handler)

        wrapper.unmount()
        expect(window.removeEventListener).toHaveBeenCalledWith('resize', handler)

        window.removeEventListener = removeEventListener
    })

    test('checkOverflow sets no overflow if no overflow is necessary', () => {
        const wrapper = mount(<TabsStrip isScrollable />)

        wrapper.instance()._tabStrip = {
            scrollWidth: 100,
            clientWidth: 150
        }

        wrapper.instance().checkOverflow()

        expect(wrapper.state('overflowLeft')).toBe(false)
        expect(wrapper.state('overflowRight')).toBe(false)
    })

    test('checkOverflow sets overflow width if necessary', () => {
        const wrapper = mount(<TabsStrip isScrollable />)

        wrapper.instance()._tabStrip = {
            scrollWidth: 150,
            clientWidth: 100
        }

        wrapper.instance().checkOverflow()

        expect(wrapper.state('overflowLeft')).toBe(false)
        expect(wrapper.state('overflowRight')).toBe(true)
        expect(wrapper.state('overflowWidth')).toBe(50)
    })

    test('handleScroll sets the left overflow if the scroll position is not at zero', () => {
        const wrapper = mount(<TabsStrip isScrollable />)

        wrapper.instance()._tabStrip = {
            scrollLeft: 5
        }

        wrapper.instance().handleScroll()

        expect(wrapper.state('overflowLeft')).toBe(true)
    })

    test('handleScroll clears the left overflow if the scroll position is at zero', () => {
        const wrapper = mount(<TabsStrip isScrollable />)

        wrapper.setState({overflowLeft: true})

        wrapper.instance()._tabStrip = {
            scrollLeft: 0
        }

        wrapper.instance().handleScroll()

        expect(wrapper.state('overflowLeft')).toBe(false)
    })

    test('handleScroll sets the right overflow if the scroll position is not at maximum', () => {
        const wrapper = mount(<TabsStrip isScrollable />)

        wrapper.setState({overflowWidth: 10, overflowLeft: true})

        wrapper.instance()._tabStrip = {
            scrollLeft: 5
        }

        wrapper.instance().handleScroll()

        expect(wrapper.state('overflowRight')).toBe(true)
    })

    test('handleScroll clears the right overflow if the scroll position is at maximum', () => {
        const wrapper = mount(<TabsStrip isScrollable />)

        wrapper.setState({overflowRight: true, overflowWidth: 10})

        wrapper.instance()._tabStrip = {
            scrollLeft: 10
        }

        wrapper.instance().handleScroll()

        expect(wrapper.state('overflowRight')).toBe(false)
    })
})

describe('Tabs', () => {
    test('renders without errors', () => {
        const wrapper = mount(
            <Tabs>
                <TabsPanel>Test</TabsPanel>
                <TabsPanel>Test</TabsPanel>
            </Tabs>
        )
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(
            <Tabs>
                <TabsPanel>Test</TabsPanel>
                <TabsPanel>Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.hasClass('pw-tabs')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(
            <Tabs>
                <TabsPanel>Test</TabsPanel>
                <TabsPanel>Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(
                <Tabs className={name}>
                    <TabsPanel>Test</TabsPanel>
                    <TabsPanel>Test</TabsPanel>
                </Tabs>
            )

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('has the class pw--is-scrollable if isScrollable prop is set to true', () => {
        const wrapper = mount(
            <Tabs isScrollable>
                <TabsPanel>Test</TabsPanel>
                <TabsPanel>Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.find('.pw-tabs__strip-container').hasClass('pw--is-scrollable')).toBe(true)
    })

    test('sets the state to the initial activeIndex', () => {
        const wrapper = mount(
            <Tabs activeIndex={1}>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.state('activeTabIndex')).toBe(1)
    })

    test('changes the active tab when setIndex is called', () => {
        const wrapper = mount(
            <Tabs>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('one')
        expect(wrapper.state('activeTabIndex')).toBe(0)

        wrapper.instance().setIndex(1)
        wrapper.update()

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('two')
        expect(wrapper.state('activeTabIndex')).toBe(1)
    })

    test('clicking on the tab link changes the active tab', () => {
        const wrapper = mount(
            <Tabs>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('one')
        expect(wrapper.state('activeTabIndex')).toBe(0)

        wrapper
            .find('.pw-tabs__tab a')
            .at(1)
            .simulate('click')

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('two')
        expect(wrapper.state('activeTabIndex')).toBe(1)
    })

    test('changes the active tab when the activeIndex prop is changed', () => {
        const wrapper = mount(
            <Tabs activeIndex={0}>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('one')
        expect(wrapper.state('activeTabIndex')).toBe(0)

        wrapper.setProps({activeIndex: 1})

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('two')
        expect(wrapper.state('activeTabIndex')).toBe(1)
    })

    test('does not change the active tab when non-activeIndex props are changed', () => {
        const wrapper = mount(
            <Tabs activeIndex={1}>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('two')
        expect(wrapper.state('activeTabIndex')).toBe(1)

        wrapper.setProps({className: 'test'})

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('two')
        expect(wrapper.state('activeTabIndex')).toBe(1)
    })

    test('calls onChange function', () => {
        const props = {
            onChange: jest.fn()
        }

        const wrapper = mount(
            <Tabs {...props}>
                <TabsPanel title="one">Test</TabsPanel>
                <TabsPanel title="two">Test</TabsPanel>
            </Tabs>
        )

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('one')
        expect(wrapper.state('activeTabIndex')).toBe(0)
        expect(props.onChange).not.toBeCalled()

        wrapper
            .find('.pw-tabs__tab a')
            .at(1)
            .simulate('click')

        expect(wrapper.find('.pw-tabs__tab.pw--is-active').text()).toBe('two')
        expect(wrapper.state('activeTabIndex')).toBe(1)
        expect(props.onChange).toBeCalledWith(1)
    })
})
