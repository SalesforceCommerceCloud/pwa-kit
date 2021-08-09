/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Image from './index'
import Ratio from '../ratio'

jest.useFakeTimers()

/* eslint-disable newline-per-chained-call */
/* eslint-disable jsx-a11y/img-has-alt */

test('Image renders without errors', () => {
    const wrapper = mount(<Image />)
    expect(wrapper.length).toBe(1)
})

test('Image renders a skeleton for invalid images', () => {
    const wrapper = mount(<Image src="http://www.url.com/does-not-exist.jpg" />)
    const skeleton = wrapper.find('.pw-skeleton-block.pw--image')
    expect(skeleton.length).toBe(1)
})

test('Image does not render a skeleton for valid images', () => {
    const wrapper = mount(<Image />)
    const rawImage = wrapper.find('.pw-image__tag')

    rawImage.prop('onLoad')() // Simulate a successful image loaded event
    jest.runAllTimers() // Let load event play out
    wrapper.update()

    const skeleton = wrapper.find('.pw-skeleton-block.pw--image')
    expect(skeleton.length).toBe(0)
})

test('Image does not render a skeleton on the server side', () => {
    window.Progressive = {isServerSide: true}
    const wrapper = mount(<Image />)

    const skeleton = wrapper.find('.pw-skeleton-block.pw--image')
    expect(skeleton.length).toBe(0)

    delete window.Progressive
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Image />)

    expect(wrapper.hasClass('pw-image')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Image />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Image className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('Image renders a skeleton when image URL changes', () => {
    const wrapper = mount(<Image />)
    wrapper.setProps({src: 'http://www.url.com/does-not-exist.jpg'})
    expect(wrapper.find('.pw-skeleton-block.pw--image').length).toBe(1)
    expect(wrapper.find('.pw-image__tag.pw--is-transitioning').length).toBe(0)
})

describe('Image correctly changes behaviour for IE 11', () => {
    beforeAll(() => {
        window.MSInputMethodContext = true
        document.documentMode = true
    })
    afterAll(() => {
        delete window.MSInputMethodContext
        delete document.documentMode
    })
    test('Image does not render a skeleton when browser is IE 11', () => {
        const wrapper = mount(<Image src="http://www.url.com/does-not-exist.jpg" />)

        expect(wrapper.find('.pw-skeleton-block.pw--image').length).toBe(0)
        expect(wrapper.find('.pw-image__tag').length).toBe(1)
    })
})

describe('Image correctly changes behaviour for data URLs', () => {
    test('Image does not render a skeleton when src is a data url', () => {
        const wrapper = mount(
            <Image src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
        )

        expect(wrapper.find('.pw-skeleton-block.pw--image').length).toBe(0)
        expect(wrapper.find('.pw-image__tag').length).toBe(1)
    })
})

test('Image enters transition mode when image URL changes if useLoaderDuringTransitions is false', () => {
    const wrapper = mount(<Image useLoaderDuringTransitions={false} />)
    wrapper.setProps({src: 'http://www.url.com/does-not-exist.jpg'})

    const images = wrapper.find('.pw-image__tag')
    expect(images.length).toBe(2)
    expect(wrapper.find('.pw-image__tag.pw--is-transitioning').length).toBe(1)

    images.forEach((image) => {
        if (!image.hasClass('pw--is-transitioning')) {
            image.prop('onLoad')() // Simulate a successful image loaded event
        }
    })
    jest.runAllTimers() // Let load event play out
    wrapper.update()

    expect(wrapper.find('.pw-image__tag').length).toBe(1)
    expect(wrapper.find('.pw-image__tag.pw--is-transitioning').length).toBe(0)
})

test('Image renders a loadingIndicator when passed', () => {
    const wrapper = mount(
        <Image
            src="http://www.url.com/does-not-exist.jpg"
            loadingIndicator={<div className="pw-test" />}
        />
    )

    expect(wrapper.find('.pw-test').length).toBe(1)
})

test('Image renders without the skeleton when hidePlaceholder is true', () => {
    const wrapper = mount(
        <Image src="http://www.url.com/does-not-exist.jpg" hidePlaceholder={true} />
    )

    expect(wrapper.find('.pw-skeleton-block.pw--image').length).toBe(0)
})

test('Image switches the loaded state back if the src changes', () => {
    const wrapper = mount(<Image src="test.png" />)
    const rawImage = wrapper.find('.pw-image__tag')
    rawImage.prop('onLoad')() // Simulate a successful image loaded event
    jest.runAllTimers() // Let load event play out
    expect(wrapper.state('loaded')).toBe(true)
    wrapper.setProps({src: 'tester.png'}) // Swap image src
    expect(wrapper.state('loaded')).toBe(false) // image should still be loading
})

test("Image does not switch the loaded state back if the src doesn't change", () => {
    const wrapper = mount(<Image src="test.png" />)
    const rawImage = wrapper.find('.pw-image__tag')
    rawImage.prop('onLoad')() // Simulate a successful image loaded event
    jest.runAllTimers() // Let load event play out
    expect(wrapper.state('loaded')).toBe(true)
    wrapper.setProps({className: 'test'})
    expect(wrapper.state('loaded')).toBe(true)
})

test('Image renders a Ratio if ratio parameters are passed', () => {
    const wrapper = shallow(<Image src="test.png" ratio={{aspect: '16:9'}} />)

    const ratio = wrapper.find(Ratio)
    expect(ratio.length).toBe(1)
    expect(ratio.prop('aspect')).toBe('16:9')
    expect(ratio.find('img').length).toBe(1)
    expect(ratio.find('img').prop('src')).toBe('test.png')
})

test('Image disables dragging correctly', () => {
    const wrapper = mount(<Image src="test.png" draggable={'false'} />)
    const rawImage = wrapper.find('.pw-image__tag')
    expect(rawImage.prop('draggable')).toBe('false')
})

describe('Image correctly clears its loading timeout', () => {
    // Jest's mock timers have already been called by this point,
    // so we need to replace them with new mocked functions
    const _setTimeout = window.setTimeout
    const _clearTimeout = window.clearTimeout

    beforeEach(() => {
        // setTimeout needs to return something in order for clearTimeout to be called
        window.setTimeout = jest.fn().mockReturnValueOnce(1)
        window.clearTimeout = jest.fn()
    })

    afterAll(() => {
        // Restore Jest's mocks
        window.setTimeout = _setTimeout
        window.clearTimeout = _clearTimeout
    })

    test('Image clears its loading timeout on unmount', () => {
        const wrapper = shallow(<Image src="test.png" />)
        const rawImage = wrapper.find('.pw-image__tag')

        expect(window.setTimeout).not.toBeCalled()
        expect(window.clearTimeout).not.toBeCalled()

        rawImage.prop('onLoad')() // Simulate a successful image loaded event

        expect(window.setTimeout).toBeCalled()
        expect(window.clearTimeout).not.toBeCalled()

        wrapper.unmount()

        expect(window.clearTimeout).toBeCalled()
    })

    test('Image does not clear its loading timeout if the image does not load', () => {
        const wrapper = shallow(<Image src="test.png" />)

        expect(window.setTimeout).not.toBeCalled()
        expect(window.clearTimeout).not.toBeCalled()

        wrapper.unmount()

        expect(window.clearTimeout).not.toBeCalled()
    })
})

describe('Image correctly renders srcSet and sizes props', () => {
    const SRC_SET = ['small.png 320w', 'medium.png 500w', 'large.png 1000w']
    const SIZES = ['(min-width: 36em) 33.3vw', '100vw']

    test('Image adds srcSet props correctly if they are supplied', () => {
        const wrapper = shallow(<Image src="small.png" srcSet={SRC_SET} sizes={SIZES} />)

        expect(wrapper.find('img').prop('srcSet')).toEqual(SRC_SET)
        expect(wrapper.find('img').prop('sizes')).toEqual(SIZES)
    })

    test('Image does not add srcSet and sizes props if they are not set', () => {
        const wrapper = shallow(<Image src="small.png" />)

        expect(wrapper.find('img').prop('srcSet')).toEqual(undefined)
        expect(wrapper.find('img').prop('sizes')).toEqual(undefined)
    })
})

test('onImageError fires if image fails to load', () => {
    const mockOnError = jest.fn()
    const wrapper = mount(<Image src="unknown" onImageError={mockOnError} />)
    const rawImage = wrapper.find('.pw-image__tag')

    // jsdom does not trigger image onerror, so we have to manually call this
    rawImage.prop('onError')()

    expect(mockOnError).toBeCalled()
})

test('Loaded image has loaded state set to true on mount', () => {
    Object.defineProperty(global.Image.prototype, 'complete', {
        get() {
            return true
        }
    })
    const wrapper = mount(<Image src="unknown" />)

    expect(wrapper.state('loaded')).toBe(true)
})

describe('Setting shouldLazyLoad to true', () => {
    let innerHeight
    let innerWidth
    let getBoundingClientRect
    let removeEventListener

    beforeEach(() => {
        innerHeight = window.innerHeight
        innerWidth = window.innerWidth
        getBoundingClientRect = Element.prototype.getBoundingClientRect
        removeEventListener = window.removeEventListener
    })

    afterEach(() => {
        window.innerHeight = innerHeight
        window.innerWidth = innerWidth
        Element.prototype.getBoundingClientRect = getBoundingClientRect
        window.removeEventListener = removeEventListener
    })

    test('initialy renders an image without a src', () => {
        const wrapper = shallow(<Image src="small.png" shouldLazyLoad={true} />)

        expect(wrapper.find('img').prop('src')).toEqual(undefined)
    })

    test('Offscreen images are not visible', () => {
        window.innerHeight = 10
        Element.prototype.getBoundingClientRect = () => {
            return {
                right: 5,
                left: 5,
                top: 20
            }
        }
        const wrapper = mount(
            <Image src="small.png" shouldLazyLoad={true} width="100" height="100" />
        )

        expect(wrapper.state('isVisible')).toBeFalsy()

        expect(wrapper.find('img').prop('src')).toEqual(undefined)
    })

    test('Offscreen images are visible when scrolled into view', () => {
        window.innerHeight = 10
        Element.prototype.getBoundingClientRect = () => {
            return {
                right: 5,
                left: 5,
                top: 15
            }
        }
        const wrapper = mount(
            <Image src="small.png" shouldLazyLoad={true} width="100" height="100" />
        )

        window.innerHeight = 20
        wrapper.instance().checkIfVisible()
        expect(wrapper.state('isVisible')).toBe(true)
    })

    test('Event Handlers are removed when hidden image unmounts', () => {
        window.removeEventListener = jest.fn(removeEventListener)
        window.innerHeight = 10
        const elementPosition = {
            right: 5,
            left: 5,
            top: 20
        }
        Element.prototype.getBoundingClientRect = () => {
            return elementPosition
        }

        const wrapper = mount(
            <Image src="small.png" shouldLazyLoad={true} width="100" height="100" />
        )

        const instance = wrapper.instance()
        jest.spyOn(instance, 'checkIfVisible')
        const scrollHandler = instance.handleBrowserScroll
        scrollHandler()
        wrapper.unmount()

        expect(window.removeEventListener).toHaveBeenCalledWith('scroll', scrollHandler)
        expect(window.removeEventListener).toHaveBeenCalledWith('resize', scrollHandler)
        expect(instance.checkIfVisible).toHaveBeenCalled()
    })

    test('Event Handlers are removed from visible images', () => {
        window.removeEventListener = jest.fn(removeEventListener)

        const wrapper = mount(
            <Image src="small.png" shouldLazyLoad={true} width="100" height="100" />
        )

        const scrollHandler = wrapper.instance().handleBrowserScroll

        expect(window.removeEventListener).toHaveBeenCalledWith('scroll', scrollHandler)
        expect(window.removeEventListener).toHaveBeenCalledWith('resize', scrollHandler)
    })

    test('checkIfVisible exits early if image is visible already', () => {
        const wrapper = mount(
            <Image src="small.png" shouldLazyLoad={true} width="100" height="100" />
        )
        const instance = wrapper.instance()
        instance.isVisible = jest.fn()

        instance.checkIfVisible()

        expect(wrapper.instance().isVisible).not.toHaveBeenCalled()
    })
})
