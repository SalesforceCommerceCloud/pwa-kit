/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable jsx-a11y/img-has-alt */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Link from '../link'

import Carousel from './index.jsx'
import CarouselItem from './carousel-item.jsx'

/* eslint-disable newline-per-chained-call, max-nested-callbacks */

describe('Carousel', () => {
    test('renders properly', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem caption="Item 1">
                    <img src="/img1.jpg" />
                </CarouselItem>
                <CarouselItem caption="Item 2">
                    <img src="/img2.jpg" />
                </CarouselItem>
                <CarouselItem caption="Item 3">
                    <img src="/img3.jpg" />
                </CarouselItem>
            </Carousel>
        )

        const carouselItems = wrapper.find('.pw-carousel__item')
        expect(carouselItems.length).toBe(3)

        const middleItem = carouselItems.at(1)

        const middleItemClassName = middleItem.prop('className')
        expect(middleItemClassName.includes('pw--active')).toBe(true)

        expect(middleItem.find('img').prop('src')).toBe('/img1.jpg')
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )

        expect(wrapper.hasClass('pw-carousel')).toBe(true)
    })

    test('only one carouselItems if there is only one item', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem caption="Item 1">
                    <img src="/img1.jpg" />
                </CarouselItem>
            </Carousel>
        )

        const carouselItems = wrapper.find(CarouselItem)
        expect(carouselItems.length).toBe(1)
    })

    test('three carouselItems if there are only two items', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem caption="Item 1">
                    <img src="/img1.jpg" />
                </CarouselItem>
                <CarouselItem caption="Item 2">
                    <img src="/img2.jpg" />
                </CarouselItem>
            </Carousel>
        )

        const carouselItems = wrapper.find(CarouselItem)
        expect(carouselItems.length).toBe(3)
    })

    test('adjusts cur/prev/next indices when carouselItems length changes', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )
        expect(wrapper.state('currentIndex')).toBe(0)
        expect(wrapper.state('prevIndex')).toBe(0)
        expect(wrapper.state('nextIndex')).toBe(0)
        ;[2, 3, 4, 5].forEach((childCount) => {
            const children = new Array(childCount)
                .fill(0)
                .map((_, idx) => <CarouselItem key={idx} />)
            wrapper.setProps({children})

            expect(wrapper.state('currentIndex')).toBe(0)
            expect(wrapper.state('prevIndex')).toBe(childCount - 1)
            expect(wrapper.state('nextIndex')).toBe(1)
        })
    })

    test('does not adjust current/prev/next indices when carouselItems length does not change', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )
        expect(wrapper.state('currentIndex')).toBe(0)
        expect(wrapper.state('prevIndex')).toBe(2)
        expect(wrapper.state('nextIndex')).toBe(1)

        wrapper.setProps({previousIcon: 'plus'})

        expect(wrapper.state('currentIndex')).toBe(0)
        expect(wrapper.state('prevIndex')).toBe(2)
        expect(wrapper.state('nextIndex')).toBe(1)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(
                <Carousel className={name}>
                    <CarouselItem />
                </Carousel>
            )

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('renders nothing with no children', () => {
        const wrapper = shallow(<Carousel />)

        expect(wrapper.type()).toBe(null)
    })

    test('renders controls by default', () => {
        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )

        expect(wrapper.find('.pw-carousel__controls').length).toBe(1)
    })

    test('does not render controls if showControls and showPips is false', () => {
        const wrapper = shallow(
            <Carousel showControls={false} showPips={false}>
                <CarouselItem />
            </Carousel>
        )

        expect(wrapper.find('.pw-carousel__controls').length).toBe(0)
    })

    test('renders pips if showPips is true', () => {
        ;[true, false].forEach((showControls) => {
            const wrapper = shallow(
                <Carousel showControls={showControls} showPips={true}>
                    <CarouselItem />
                </Carousel>
            )
            expect(wrapper.find('.pw-carousel__pips').length).toBe(1)
        })
    })

    test('renders a pip for each child', () => {
        ;[2, 3, 4, 5, 6].forEach((childCount) => {
            const children = new Array(childCount)
                .fill(0)
                .map((_, idx) => <CarouselItem key={idx} />)
            const wrapper = shallow(<Carousel>{children}</Carousel>)
            expect(wrapper.find('CarouselPip').length).toBe(childCount)
        })
    })

    test('renders no caption by default', () => {
        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )

        expect(wrapper.find('.pw-carousel__caption').length).toBe(0)
    })

    test('renders the caption if showCaption is true', () => {
        const wrapper = shallow(
            <Carousel showCaption>
                <CarouselItem />
            </Carousel>
        )

        expect(wrapper.find('.pw-carousel__caption').length).toBe(1)
    })

    test('mousedown and touchstart event listeners are added to the inner wrapper on mount', () => {
        const mockInnerWrapper = {
            current: {
                addEventListener: jest.fn()
            }
        }

        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>,
            {disableLifecycleMethods: true}
        )
        const instance = wrapper.instance()
        instance._innerWrapper = mockInnerWrapper

        instance.componentDidMount()

        expect(mockInnerWrapper.current.addEventListener).toHaveBeenCalledWith(
            'mousedown',
            expect.any(Function)
        )
        expect(mockInnerWrapper.current.addEventListener).toHaveBeenCalledWith(
            'touchstart',
            expect.any(Function),
            {passive: false}
        )
    })

    test('mousedown and touchstart event listeners are removed from the inner wrapper on unmount', () => {
        const mockInnerWrapper = {
            current: {
                removeEventListener: jest.fn()
            }
        }

        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>,
            {disableLifecycleMethods: true}
        )
        const instance = wrapper.instance()
        instance._innerWrapper = mockInnerWrapper

        instance.componentWillUnmount()

        expect(mockInnerWrapper.current.removeEventListener).toHaveBeenCalledWith(
            'mousedown',
            expect.any(Function)
        )
        expect(mockInnerWrapper.current.removeEventListener).toHaveBeenCalledWith(
            'touchstart',
            expect.any(Function),
            {passive: false}
        )
    })

    test('onDownHandler does nothing if the animate flag is set', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )
        const mockEvent = {preventDefault: jest.fn()}

        wrapper.setState({animate: true})
        const previousState = {...wrapper.state()}
        wrapper.instance().onDownHandler(mockEvent)
        expect(wrapper.state()).toEqual(previousState)
        expect(mockEvent.preventDefault).toBeCalled()
    })

    test('onDownHandler does not set the dragging flag and start position in the state', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )
        const mockEvent = {clientX: 50, clientY: 100}

        wrapper.instance().onDownHandler(mockEvent)
        expect(wrapper.state('dragging')).toBe(false)
        expect(wrapper.state('dragStartX')).toBe(50)
    })

    test('onDownHandler calls addEventListeners', () => {
        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )
        const instance = wrapper.instance()
        instance.addEventListeners = jest.fn()

        instance.onDownHandler({})

        expect(instance.addEventListeners).toHaveBeenCalled()
    })

    test('onUpHandler clears the dragging flag if deltaX is zero or undefined', () => {
        ;[0, undefined].forEach((deltaX) => {
            const wrapper = mount(
                <Carousel>
                    <CarouselItem />
                </Carousel>
            )

            wrapper.setState({deltaX, dragging: true})
            wrapper.instance().onUpHandler()
            expect(wrapper.state('dragging')).toBe(false)
        })
    })

    test('onUpHandler calls removeEventListeners', () => {
        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )
        const instance = wrapper.instance()
        instance.removeEventListeners = jest.fn()

        instance.onUpHandler()

        expect(instance.removeEventListeners).toHaveBeenCalled()
    })

    test('onUpHandler clears dragging and sets animate if abs(deltaX) is under the moveThreshold', () => {
        ;[-10, 10].forEach((deltaX) => {
            const wrapper = mount(
                <Carousel moveThreshold={20}>
                    <CarouselItem />
                </Carousel>
            )

            wrapper.setState({deltaX, dragging: true})
            wrapper.instance().onUpHandler()
            expect(wrapper.state('dragging')).toBe(false)
            expect(wrapper.state('animate')).toBe(true)
            expect(wrapper.state('deltaX')).toBe(0)
        })
    })

    test('onUpHandler clears the dragging flag and animates when deltaX exceeds the moveThreshold', () => {
        ;[1, -1].forEach((sign) => {
            const wrapper = mount(
                <Carousel moveThreshold={20}>
                    <CarouselItem />
                </Carousel>
            )

            wrapper.setState({deltaX: 30 * sign, dragging: true, itemWidth: 200})
            wrapper.instance().onUpHandler()
            expect(wrapper.state('dragging')).toBe(false)
            expect(wrapper.state('animate')).toBe(true)
            expect(wrapper.state('deltaX')).toBe(200 * sign)
        })
    })

    test('onUpHandler sends analytics data', () => {
        ;[1, -1].forEach((sign) => {
            window.Progressive = {
                analytics: {
                    send: jest.fn()
                }
            }

            const wrapper = mount(
                <Carousel moveThreshold={20}>
                    <CarouselItem />
                </Carousel>
            )
            wrapper.setState({deltaX: 30 * sign, dragging: true, itemWidth: 200})
            wrapper.instance().onUpHandler()

            expect(window.Progressive.analytics.send.mock.calls.length).toBe(1)

            // cleanup
            delete window.Progressive
        })
    })

    test('onMoveHandler does nothing if the user is scrolling past (not dragging)', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )

        wrapper.setState({dragging: false, isScrollingPast: true})
        const previousState = {...wrapper.state()}
        wrapper.instance().onMoveHandler({})
        expect(wrapper.state()).toEqual(previousState)
    })

    test('onMoveHandler does nothing if the deltaX is under threshold', () => {
        ;[-1, 1].forEach((sign) => {
            const mockEvent = {
                clientX: 10 * sign,
                preventDefault: jest.fn()
            }

            const wrapper = mount(
                <Carousel dragThreshold={20}>
                    <CarouselItem />
                </Carousel>
            )

            wrapper.setState({dragging: true, dragStartX: 0})
            const previousState = {...wrapper.state()}
            wrapper.instance().onMoveHandler(mockEvent)
            expect(wrapper.state()).toEqual(previousState)
        })
    })

    test('onMoveHandler does nothing if the end of the carousel is reached', () => {
        ;[-1, 1].forEach((sign) => {
            const mockEvent = {
                clientX: 30 * sign,
                preventDefault: jest.fn()
            }

            const wrapper = mount(
                <Carousel dragThreshold={20}>
                    <CarouselItem />
                    <CarouselItem />
                </Carousel>
            )
            const instance = wrapper.instance()
            // We need to calculate all indices, not just currentIndex
            // Or the carousel items won't have unique keys
            const indices = instance.calculateIndexes(sign > 0 ? 0 : 1)

            wrapper.setState({
                dragging: true,
                dragStartX: 0,
                ...indices
            })

            const previousState = {...wrapper.state()}
            instance.onMoveHandler(mockEvent)
            expect(wrapper.state()).toEqual(previousState)
        })
    })

    test('onMoveHandler sets the deltaX if the end of the carousel is not reached', () => {
        ;[-1, 1].forEach((sign) => {
            const mockEvent = {
                clientX: 30 * sign,
                preventDefault: jest.fn()
            }

            const wrapper = mount(
                <Carousel dragThreshold={20}>
                    <CarouselItem />
                    <CarouselItem />
                </Carousel>
            )
            const instance = wrapper.instance()
            const indices = instance.calculateIndexes(sign < 0 ? 0 : 1)

            wrapper.setState({
                dragging: true,
                dragStartX: 0,
                ...indices
            })
            instance.onMoveHandler(mockEvent)
            expect(wrapper.state('deltaX')).toEqual(10 * sign)
        })
    })

    test('onMoveHandler calls preventDefault() on the event', () => {
        const mockEvent = {
            clientX: 30,
            preventDefault: jest.fn()
        }

        const wrapper = mount(
            <Carousel dragThreshold={20}>
                <CarouselItem />
            </Carousel>
        )

        wrapper.instance().onMoveHandler(mockEvent)

        expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    test('onLeaveHandler does nothing if no drag is in progress', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )

        expect(wrapper.state('dragging')).toBe(false)
        const previousState = {...wrapper.state()}
        wrapper.instance().onLeaveHandler()
        expect(wrapper.state()).toEqual(previousState)
    })

    test('onLeaveHandler generates a mouse up if a drag is in progress', () => {
        const mockHandler = jest.fn()
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
            </Carousel>
        )

        wrapper.setState({dragging: true})
        wrapper.instance().onUpHandler = mockHandler
        wrapper.instance().onLeaveHandler()
        expect(mockHandler).toBeCalled()
    })

    test('clicking on the previous button sets the animate flag and deltaX', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )
        const instance = wrapper.instance()
        const indices = instance.calculateIndexes(1)

        wrapper.setState({itemWidth: 100, ...indices})
        wrapper.find('.pw-carousel__previous button').simulate('click')
        expect(wrapper.state('animate')).toBe(true)
        expect(wrapper.state('deltaX')).toBe(100)
    })

    test('clicking on the next button sets the animate flag and deltaX', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )
        const instance = wrapper.instance()
        const indices = instance.calculateIndexes(0)

        wrapper.setState({itemWidth: 100, indices})
        wrapper.find('.pw-carousel__next button').simulate('click')
        expect(wrapper.state('animate')).toBe(true)
        expect(wrapper.state('deltaX')).toBe(-100)
    })

    test('moveComplete only clears the animate flag if deltaX is 0 or undefined', () => {
        ;[0, undefined].forEach((deltaX) => {
            const wrapper = mount(
                <Carousel>
                    <CarouselItem />
                    <CarouselItem />
                    <CarouselItem />
                </Carousel>
            )

            wrapper.setState({
                deltaX,
                animate: true,
                currentIndex: 0,
                nextIndex: 1,
                prevIndex: 2
            })
            wrapper.instance().moveComplete()
            expect(wrapper.state('animate')).toBe(false)
            expect(wrapper.state('currentIndex')).toBe(0)
            expect(wrapper.state('nextIndex')).toBe(1)
            expect(wrapper.state('prevIndex')).toBe(2)
        })
    })

    test('moveComplete advances the indices if deltaX is negative', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )

        wrapper.setState({
            deltaX: -100,
            animate: true,
            currentIndex: 0,
            nextIndex: 1,
            prevIndex: 2
        })
        wrapper.instance().moveComplete()
        expect(wrapper.state('animate')).toBe(false)
        expect(wrapper.state('currentIndex')).toBe(1)
        expect(wrapper.state('nextIndex')).toBe(2)
        expect(wrapper.state('prevIndex')).toBe(0)
        expect(wrapper.state('deltaX')).toBe(0)
    })

    test('moveComplete reduces the indices if deltaX is positive', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )

        wrapper.setState({
            deltaX: 100,
            animate: true,
            currentIndex: 1,
            nextIndex: 2,
            prevIndex: 0
        })
        wrapper.instance().moveComplete()
        expect(wrapper.state('animate')).toBe(false)
        expect(wrapper.state('currentIndex')).toBe(0)
        expect(wrapper.state('nextIndex')).toBe(1)
        expect(wrapper.state('prevIndex')).toBe(2)
        expect(wrapper.state('deltaX')).toBe(0)
    })

    test('Pip click moves carousel positive direction', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem key={0} />
                <CarouselItem key={1} />
                <CarouselItem key={2} />
                <CarouselItem key={3} />
            </Carousel>
        )

        expect(wrapper.find('CarouselPip').length).toBe(4)
        wrapper.setState({
            currentIndex: 0,
            nextIndex: 1,
            prevIndex: 3
        })
        expect(wrapper.find('.pw-carousel__pip.pw--active').length).toBe(1)
        wrapper
            .find('CarouselPip')
            .last()
            .simulate('click')
        expect(wrapper.state('currentIndex')).toBe(3)
        expect(wrapper.state('nextIndex')).toBe(0)
        expect(wrapper.state('prevIndex')).toBe(2)
        expect(
            wrapper
                .find('CarouselPip')
                .last()
                .prop('isCurrentPip')
        ).toBe(true)
    })

    test('Pip click moves carousel negative direction', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem key={0} />
                <CarouselItem key={1} />
                <CarouselItem key={2} />
                <CarouselItem key={3} />
            </Carousel>
        )

        expect(wrapper.find('CarouselPip').length).toBe(4)
        wrapper.setState({
            currentIndex: 3,
            nextIndex: 2,
            prevIndex: 0
        })
        expect(wrapper.find('.pw-carousel__pip.pw--active').length).toBe(1)
        wrapper
            .find('CarouselPip')
            .first()
            .simulate('click')
        expect(wrapper.state('currentIndex')).toBe(0)
        expect(wrapper.state('nextIndex')).toBe(1)
        expect(wrapper.state('prevIndex')).toBe(3)
        expect(
            wrapper
                .find('CarouselPip')
                .first()
                .prop('isCurrentPip')
        ).toBe(true)
    })

    test('Setting the value of currentSlide also changes currentIndex to the same value', () => {
        const wrapper = mount(
            <Carousel currentSlide={0}>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )

        wrapper.setProps({currentSlide: 2})
        wrapper.setState({
            deltaX: -200
        })
        wrapper.instance().moveComplete()
        expect(wrapper.state('currentIndex')).toBe(2)
    })

    test('moveComplete should call onSlideMove, passing it the the currentIndex', () => {
        const wrapper = mount(
            <Carousel currentSlide={0} onSlideMove={jest.fn()}>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )
        const targetSlide = 1

        wrapper.setProps({currentSlide: targetSlide})
        wrapper.setState({
            deltaX: -200
        })
        expect(wrapper.prop('onSlideMove')).not.toBeCalled()
        wrapper.instance().moveComplete()
        expect(wrapper.prop('onSlideMove')).toBeCalledWith(targetSlide)
    })

    test('removes resize event listener on unmount', () => {
        const removeEventListener = window.removeEventListener
        window.removeEventListener = jest.fn(removeEventListener)

        const wrapper = mount(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )
        const handler = wrapper.instance().updateItemWidth
        expect(window.removeEventListener).not.toHaveBeenCalledWith('resize', handler)

        wrapper.unmount()
        expect(window.removeEventListener).toHaveBeenCalledWith('resize', handler)

        window.removeEventListener = removeEventListener
    })

    test('calls removeEventListeners on unmount', () => {
        const wrapper = mount(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )
        const instance = wrapper.instance()
        instance._innerWrapper = {}
        instance.removeEventListeners = jest.fn()

        instance.componentWillUnmount()

        expect(instance.removeEventListeners).toHaveBeenCalled()
    })

    test('addEventListeners adds mouse and touch event listeners', () => {
        const addEventListener = window.addEventListener
        window.addEventListener = jest.fn()

        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )

        wrapper.instance().addEventListeners()

        expect(window.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
        expect(window.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function))
        expect(window.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function))
        expect(window.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
        expect(window.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function))
        expect(window.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), {
            passive: false
        })

        window.addEventListener = addEventListener
    })

    test('removeEventListeners removes mouse and touch event listeners', () => {
        const removeEventListener = window.removeEventListener
        window.removeEventListener = jest.fn()

        const wrapper = shallow(
            <Carousel>
                <CarouselItem />
                <CarouselItem />
                <CarouselItem />
            </Carousel>
        )

        wrapper.instance().removeEventListeners()

        expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
        expect(window.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function))
        expect(window.removeEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function))
        expect(window.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
        expect(window.removeEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function))
        expect(window.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), {
            passive: false
        })

        window.removeEventListener = removeEventListener
    })

    describe('touch support', () => {
        test('onDownHandler reads the touch values rather than direct values', () => {
            const wrapper = mount(
                <Carousel>
                    <CarouselItem />
                </Carousel>
            )
            const mockEvent = {
                clientX: 50,
                clientY: 100,
                touches: [{clientX: 200, clientY: 150}]
            }

            wrapper.instance().onDownHandler(mockEvent)
            expect(wrapper.state('dragStartX')).toBe(200)
        })

        test('onMoveHandler sets isScrollingPast only if user scrolls down, not sideways', () => {
            const wrapper1 = mount(
                <Carousel dragThreshold={0}>
                    <CarouselItem />
                </Carousel>
            )
            wrapper1.instance().onMoveHandler({
                touches: [{clientX: 100, clientY: 0}],
                preventDefault: jest.fn()
            })
            expect(wrapper1.state('isScrollingPast')).toBeFalsy()

            const wrapper2 = mount(
                <Carousel dragThreshold={0}>
                    <CarouselItem />
                </Carousel>
            )
            wrapper2.instance().onMoveHandler({
                touches: [{clientX: 0, clientY: 100}],
                preventDefault: jest.fn()
            })
            expect(wrapper2.state('isScrollingPast')).toBeTruthy()
        })
    })
})

describe('CarouselItem', () => {
    test('renders without errors', () => {
        const wrapper = mount(<CarouselItem />)

        expect(wrapper.length).toBe(1)
    })

    test('renders a link if an href is passed', () => {
        const wrapper = shallow(<CarouselItem href="http://google.com/">Test</CarouselItem>)

        expect(wrapper.type()).toBe(Link)
        expect(wrapper.prop('href')).toBe('http://google.com/')
    })

    test('renders a div if no href is passed', () => {
        const wrapper = shallow(<CarouselItem>Test</CarouselItem>)

        expect(wrapper.type()).toBe('div')
    })

    test('onClick and openInNewTab passed through to child link', () => {
        const clickHandler = () => {}
        const wrapper = shallow(
            <CarouselItem openInNewTab={true} onClick={clickHandler} href="http://google.com/">
                Test
            </CarouselItem>
        )

        expect(wrapper.prop('openInNewTab')).toBe(true)
        expect(wrapper.prop('onClick')).toBe(clickHandler)
    })

    test('onClick passed through to child div', () => {
        const clickHandler = () => {}
        const wrapper = shallow(<CarouselItem onClick={clickHandler}>Test</CarouselItem>)

        expect(wrapper.prop('onClick')).toBe(clickHandler)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<CarouselItem />)

        expect(wrapper.hasClass('pw-carousel__item')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<CarouselItem />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<CarouselItem className={name} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    describe('moveTo', () => {
        test('calling moveTo with animate=false sets the correct indices', () => {
            const wrapper = mount(
                <Carousel>
                    <CarouselItem />
                    <CarouselItem />
                    <CarouselItem />
                </Carousel>
            )
            const instance = wrapper.instance()

            instance.moveTo(2, false)
            expect(wrapper.state('currentIndex')).toBe(2)
            expect(wrapper.state('nextIndex')).toBe(0)
            expect(wrapper.state('prevIndex')).toBe(1)
        })

        test('calling moveTo with a position outside of the carousel does nothing', () => {
            const wrapper = mount(
                <Carousel>
                    <CarouselItem />
                    <CarouselItem />
                    <CarouselItem />
                </Carousel>
            )
            const instance = wrapper.instance()
            instance.move = jest.fn()

            instance.moveTo(10)
            expect(wrapper.state('currentIndex')).toBe(0)
        })
    })
})
