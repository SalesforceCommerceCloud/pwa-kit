/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'
import TransitionGroup from 'react-transition-group/TransitionGroup'
import {createTouchEventObject} from '../../test-utils'

import Sheet from './index'
import SheetContent from './sheet-content'

const sheetClassName = '.pw-sheet'
const wrapperClassName = '.pw-sheet__wrapper'
const prerenderClassName = '.pw-sheet__prerendered-children'

// Mock `requestAnimationFrame` for tests run using jsDOM
global.requestAnimationFrame =
    global.window.requestAnimationFrame ||
    function(fn) {
        return setTimeout(fn, 0)
    }

/* eslint-disable newline-per-chained-call */

describe('SheetContent', () => {
    test('renders without errors', () => {
        const wrapper = mount(<SheetContent {...Sheet.defaultProps} />)
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<SheetContent {...Sheet.defaultProps} />)

        expect(wrapper.hasClass('pw-sheet')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<SheetContent {...Sheet.defaultProps} />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<SheetContent {...Sheet.defaultProps} className={name} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('renders the header content if passed', () => {
        const props = {
            ...Sheet.defaultProps,
            headerContent: <div id="test">Test</div>
        }
        const wrapper = shallow(<SheetContent {...props} />)

        expect(
            wrapper
                .find('.pw-sheet__inner')
                .childAt(0)
                .hasClass('pw-sheet__header')
        ).toBe(true)
        expect(wrapper.find('.pw-sheet__header').length).toBe(1)
        expect(wrapper.find('.pw-sheet__header > #test').length).toBe(1)
        expect(wrapper.find('#test').text()).toBe('Test')
    })

    test('renders the title if passed', () => {
        const props = {
            ...Sheet.defaultProps,
            title: 'SheetContent Title'
        }
        const wrapper = shallow(<SheetContent {...props} />)

        expect(wrapper.find('.pw-sheet__header').length).toBe(1)
        expect(wrapper.find('.pw-sheet__header > h1').text()).toBe(props.title)
    })

    test('renders the footer content if passed', () => {
        const props = {
            ...Sheet.defaultProps,
            footerContent: <div id="test">Test</div>
        }
        const wrapper = shallow(<SheetContent {...props} />)

        expect(
            wrapper
                .find('.pw-sheet__inner')
                .childAt(1)
                .hasClass('pw-sheet__footer')
        ).toBe(true)
        expect(wrapper.find('.pw-sheet__footer').length).toBe(1)
        expect(wrapper.find('.pw-sheet__footer > #test').length).toBe(1)
        expect(wrapper.find('#test').text()).toBe('Test')
    })

    test('clicking on the mask calls onDismiss', () => {
        const props = {
            ...Sheet.defaultProps,
            onDismiss: jest.fn()
        }
        const wrapper = mount(<SheetContent {...props} />)

        expect(wrapper.find('.pw-sheet__mask').length).toBe(1)
        expect(props.onDismiss).not.toBeCalled()
        wrapper.find('.pw-sheet__mask').simulate('click')
        expect(props.onDismiss).toBeCalled()
    })

    test('clicking directly on the wrapper calls onDismiss', () => {
        const props = {
            ...Sheet.defaultProps,
            onDismiss: jest.fn()
        }
        const wrapper = mount(<SheetContent {...props} />)

        expect(wrapper.find('.pw-sheet__wrapper').length).toBe(1)
        expect(props.onDismiss).not.toBeCalled()
        wrapper.find('.pw-sheet__wrapper').simulate('click')
        expect(props.onDismiss).toBeCalled()
    })

    test('clicking on the inner content does not call onDismiss', () => {
        const props = {
            ...Sheet.defaultProps,
            onDismiss: jest.fn()
        }
        const wrapper = mount(<SheetContent {...props} />)

        expect(wrapper.find('.pw-sheet__inner').length).toBe(1)
        expect(props.onDismiss).not.toBeCalled()
        wrapper.find('.pw-sheet__inner').simulate('click')
        expect(props.onDismiss).not.toBeCalled()
    })

    test('renders in center of screen if effect is modal-center', () => {
        const props = {
            ...Sheet.defaultProps,
            effect: 'modal-center'
        }
        const wrapper = mount(<SheetContent {...props} />)
        let style = wrapper.find(wrapperClassName).prop('style')
        expect(style.top).toBe('10%')
        expect(style.right).toBe('10%')
        expect(style.bottom).toBe('10%')
        expect(style.left).toBe('10%')
        expect(style.transform).toBe('scale(0)')
        wrapper.setState({phase: 'enterActive'})
        wrapper.update()
        style = wrapper.find(wrapperClassName).prop('style')
        expect(style.transform).toBe('scale(1)')
    })

    test('calls onOpen when component appears', () => {
        const props = {
            ...Sheet.defaultProps,
            onOpen: jest.fn()
        }
        const wrapper = mount(<SheetContent {...props} />)

        wrapper.instance().componentDidAppear()

        expect(props.onOpen).toHaveBeenCalled()
    })

    describe('touch events', () => {
        let wrapper
        let instance

        const mockTouchStartEvent = createTouchEventObject({x: 10, y: 20})

        beforeEach(() => {
            wrapper = mount(<SheetContent {...Sheet.defaultProps} />)
            instance = wrapper.instance()
            instance.isIOS = true

            // Mock the event target DOM node's closest method
            mockTouchStartEvent.target = {
                closest: () => instance.innerEl
            }
        })

        test('should scroll down 1px when touch starts, if scroll is at the top', () => {
            const startingScrollPosition = 0
            instance.innerEl.scrollTop = startingScrollPosition // We're at the "top" of the scroll position
            instance.onTouchStart(mockTouchStartEvent)
            expect(instance.innerEl.scrollTop).toBe(startingScrollPosition + 1)
        })

        test('should scroll up 1px when touch starts, if scroll is at the bottom', () => {
            const startingScrollPosition = 10
            instance.innerEl.scrollTop = startingScrollPosition // We're at the "bottom" of the scroll position
            instance.onTouchStart(mockTouchStartEvent)
            expect(instance.innerEl.scrollTop).toBe(startingScrollPosition - 1)
        })

        test('should NOT scroll up 1px when touch starts, if on non-iOS', () => {
            instance.isIOS = false

            // Same steps as "should scroll down 1px when touch starts"
            const startingScrollPosition = 0
            instance.innerEl.scrollTop = startingScrollPosition // We're at the "top" of the scroll position
            instance.onTouchStart(mockTouchStartEvent)
            expect(instance.innerEl.scrollTop).toBe(startingScrollPosition)
        })

        test('should NOT scroll up 1px when touch starts, if on non-iOS', () => {
            instance.isIOS = false

            // Same steps as "should scroll up 1px when touch starts"
            const startingScrollPosition = 10
            instance.innerEl.scrollTop = startingScrollPosition // We're at the "bottom" of the scroll position
            instance.onTouchStart(mockTouchStartEvent)
            expect(instance.innerEl.scrollTop).toBe(startingScrollPosition)
        })
    })
})

describe('Sheet', () => {
    test('renders without errors', () => {
        const wrapper = mount(<Sheet />)
        expect(wrapper.length).toBe(1)
    })

    test('renders to portal element without errors', () => {
        const portalId = 'sheets-root'

        // add a div with #sheets-root id to the global body
        const sheetsRoot = global.document.createElement('div')
        sheetsRoot.setAttribute('id', portalId)
        const body = global.document.querySelector('body')
        body.appendChild(sheetsRoot)

        const wrapper = mount(<Sheet open={true} portalId={portalId} />)

        expect(wrapper.find(`#${portalId} ${sheetClassName}`).exists())
    })

    test('does not render children when closed', () => {
        const children = (
            <div>
                <p>This is child</p>
            </div>
        )
        const wrapper = mount(<Sheet open={false}>{children}</Sheet>)
        const sheetContents = wrapper.find(sheetClassName)
        expect(sheetContents.length).toBe(0)
        expect(wrapper.contains(children)).toBe(false)
    })

    test('renders children when open', () => {
        const children = (
            <div>
                <p>This is child</p>
            </div>
        )
        const wrapper = mount(<Sheet open={true}>{children}</Sheet>)

        const sheetContents = wrapper.find(sheetClassName)
        expect(sheetContents.length).toBe(1)

        const sheetContent = sheetContents.first()
        expect(sheetContent.contains(children)).toBe(true)
    })

    test('render children when closed and prerender is true', () => {
        const children = (
            <div>
                <p>This is a pre-rendered child</p>
            </div>
        )
        const wrapper = mount(
            <Sheet prerender={true} open={false}>
                {children}
            </Sheet>
        )

        const prerenderedWrapper = wrapper.find(prerenderClassName)
        expect(prerenderedWrapper.length).toBe(1)

        const prerenderedChildren = prerenderedWrapper.first()
        expect(prerenderedChildren.contains(children)).toBe(true)
    })

    test('the element that contains the Sheet creates a new compositing layer', () => {
        const wrapper = mount(<Sheet />)
        const container = wrapper.find(TransitionGroup)
        const {style} = container.props()

        expect(style.width).toBe('100%')
        expect(style.height).toBe('100%')
        expect(style.willChange).toBe('transform')
        expect(style.pointerEvents).toBe('none')
    })

    // TODO: Re-add the test after May-ple Syrup Release
    // test('supports callbacks signalling opening/closing transitions', () => {
    //     const duration = 50
    //     const timeOut = duration * 3

    //     const onBeforeOpen = jest.fn()
    //     const onOpen = jest.fn()
    //     const onBeforeClose = jest.fn()
    //     const onClose = jest.fn()

    //     const wrapper = mount(
    //         <Sheet
    //             onBeforeOpen={onBeforeOpen}
    //             onOpen={onOpen}
    //             onBeforeClose={onBeforeClose}
    //             onClose={onClose}
    //             open={false}
    //             duration={duration}
    //         />
    //     )

    //     // Sanity check - rendered, but closed initially
    //     expect(onBeforeOpen).not.toBeCalled()
    //     expect(onOpen).not.toBeCalled()
    //     expect(onBeforeClose).not.toBeCalled()
    //     expect(onClose).not.toBeCalled()

    //     const doOpen = () => {
    //         return new Promise((resolve) => {
    //             wrapper.setProps({open: true})

    //             expect(onBeforeOpen).toHaveBeenCalledTimes(1)
    //             expect(onOpen).not.toBeCalled()

    //             setTimeout(resolve, timeOut)
    //         })
    //     }

    //     const afterOpen = () => {
    //         expect(onBeforeOpen).toHaveBeenCalledTimes(1)
    //         expect(onOpen).toHaveBeenCalledTimes(1)
    //         expect(onBeforeClose).not.toBeCalled()
    //         expect(onClose).not.toBeCalled()
    //     }

    //     const doClose = () => {
    //         return new Promise((resolve) => {
    //             wrapper.setProps({open: false})

    //             expect(onBeforeClose).toHaveBeenCalledTimes(1)
    //             expect(onClose).not.toBeCalled()

    //             setTimeout(resolve, timeOut)
    //         })
    //     }

    //     const afterClose = () => {
    //         expect(onBeforeOpen).toHaveBeenCalledTimes(1)
    //         expect(onOpen).toHaveBeenCalledTimes(1)
    //         expect(onBeforeClose).toHaveBeenCalledTimes(1)
    //         expect(onClose).toHaveBeenCalledTimes(1)
    //     }

    //     return doOpen()
    //         .then(afterOpen)
    //         .then(doClose)
    //         .then(afterClose)

    // })
})
