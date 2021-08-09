/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import LazyLoader from './index.jsx'

const emptyPromise = () => new Promise((resolve) => resolve())

test('LazyLoader renders without errors', () => {
    const wrapper = mount(
        <LazyLoader currentItemCount={1} fetchItems={emptyPromise}>
            test
        </LazyLoader>
    )
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(
        <LazyLoader currentItemCount={1} fetchItems={emptyPromise}>
            test
        </LazyLoader>
    )

    expect(wrapper.hasClass('pw-lazy-loader')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(
        <LazyLoader currentItemCount={1} fetchItems={emptyPromise}>
            test
        </LazyLoader>
    )

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(
            <LazyLoader currentItemCount={1} className={name} fetchItems={emptyPromise}>
                test
            </LazyLoader>
        )

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('adds scroll event listener on mount', () => {
    const addEventListener = window.addEventListener
    window.addEventListener = jest.fn(addEventListener)

    const wrapper = mount(
        <LazyLoader currentItemCount={1} className={name} fetchItems={emptyPromise}>
            test
        </LazyLoader>
    )
    const handler = wrapper.instance().handleScroll
    expect(window.addEventListener).toHaveBeenCalledWith('scroll', handler)

    window.addEventListener = addEventListener
})

test('removes scroll event listener on unmount', () => {
    const removeEventListener = window.removeEventListener
    window.removeEventListener = jest.fn(removeEventListener)

    const wrapper = mount(
        <LazyLoader currentItemCount={1} className={name} fetchItems={emptyPromise}>
            test
        </LazyLoader>
    )
    const handler = wrapper.instance().handleScroll
    expect(window.removeEventListener).not.toHaveBeenCalledWith('scroll', handler)

    wrapper.unmount()
    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', handler)

    window.removeEventListener = removeEventListener
})

test('if not all items have been loaded, calls fetch items', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 3,
        fetchItems: jest.fn().mockReturnValue(emptyPromise())
    }

    const wrapper = shallow(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()
    expect(props.fetchItems).not.toBeCalled()
    instance.loadNext()
    expect(props.fetchItems).toBeCalled()
})

test('calls fetchItems with the correct props', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 4,
        itemsPerPage: 2,
        fetchItems: jest.fn().mockReturnValue(emptyPromise())
    }

    const wrapper = shallow(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()
    instance.loadNext()
    expect(props.fetchItems).toBeCalledWith({
        startPosition: props.currentItemCount,
        lastPosition: props.currentItemCount + props.itemsPerPage
    })
})

test('state.loading is set to true while waiting for the promise to resolve', () => {
    let resolvePromise

    const promise = new Promise((resolve) => {
        resolvePromise = resolve
    })

    const props = {
        currentItemCount: 1,
        itemTotal: 3,
        fetchItems: jest.fn().mockReturnValue(promise)
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()

    expect(wrapper.state().loading).toBe(false)
    instance.loadNext()
    expect(wrapper.state().loading).toBe(true)

    promise.then(() => {
        expect(wrapper.state().loading).toBe(false)
    })

    resolvePromise()
})

test('state.done = true, state.loading = false when all items have been loaded', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 1,
        fetchItems: emptyPromise
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)

    expect(wrapper.state().done).toBe(true)
    expect(wrapper.state().loading).toBe(false)
})

test('checks if all items have been loaded when receiving new props', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 2,
        fetchItems: emptyPromise
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()
    instance.checkIfDone = jest.fn()

    expect(instance.checkIfDone).not.toHaveBeenCalled()
    wrapper.setProps({
        ...props,
        currentItemCount: 2
    })
    expect(instance.checkIfDone).toHaveBeenCalled()
})

test('shows the loading indicator if loading', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 3,
        // This promise should never resolve, so we'll definitely be in the loading state
        fetchItems: () => new Promise(() => {}),
        loadingIndicator: 'Loading...'
    }

    const wrapper = shallow(<LazyLoader {...props}>test</LazyLoader>)
    wrapper.instance().loadNext()
    wrapper.update()

    const indicatorContainer = wrapper.find('.pw-lazy-loader__indicator')
    expect(indicatorContainer.text()).toBe(props.loadingIndicator)
})

test('handleScroll calls load next if not loading, not done, and we have scrolled to the bottom', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 3,
        fetchItems: emptyPromise
    }

    // getBoundingClientRect().bottom will always be 0
    // So if the innerHeight is > 0, we have scrolled the bottom of the LazyLoader component into view
    const innerHeight = window.innerHeight
    window.innerHeight = 100

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()

    instance.loadNext = jest.fn()

    instance.handleScroll()

    expect(instance.loadNext).toHaveBeenCalled()

    window.innerHeight = innerHeight
})

test('does not call loadNext if already loading', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 3,
        // This promise should never resolve, so we'll definitely be in the loading state
        fetchItems: () => new Promise(() => {})
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()

    // Call loadNext once to set the state to loading
    instance.loadNext()
    instance.loadNext = jest.fn()

    instance.handleScroll()

    expect(instance.loadNext).not.toHaveBeenCalled()
})

test('does not call loadNext if done', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 1,
        fetchItems: emptyPromise
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()

    // Call loadNext once to set the state to done
    instance.loadNext()
    instance.loadNext = jest.fn()

    instance.handleScroll()

    expect(instance.loadNext).not.toHaveBeenCalled()
})

test('does not call loadNext if we have not scrolled to the bottom', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 3,
        fetchItems: emptyPromise
    }

    // getBoundingClientRect().bottom will always be 0
    // So if innerHeight is < 0, we haven't scrolled the bottom of the component into view yet
    const innerHeight = window.innerHeight
    window.innerHeight = -1

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()

    instance.loadNext = jest.fn()

    instance.handleScroll()

    expect(instance.loadNext).not.toHaveBeenCalled()

    window.innerHeight = innerHeight
})

test('reset resets the loading state', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 3,
        // This promise should never resolve, so we'll definitely be in the loading state
        fetchItems: () => new Promise(() => {})
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()

    // Call loadNext once to set the state to loading
    instance.loadNext()

    expect(wrapper.state().loading).toBe(true)

    instance.reset()

    expect(wrapper.state().loading).toBe(false)
})

test('reset resets the done state', () => {
    const props = {
        currentItemCount: 1,
        itemTotal: 1,
        fetchItems: emptyPromise
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const instance = wrapper.instance()

    // Call loadNext once to set the state to done
    instance.loadNext()

    expect(wrapper.state().done).toBe(true)

    instance.reset()

    expect(wrapper.state().done).toBe(false)
})

test('does not render the load more button by default', () => {
    const props = {
        fetchItems: emptyPromise,
        currentItemCount: 1
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    expect(wrapper.find('.pw-lazy-loader__load-more').length).toBe(0)
})

test('renders the load more button if useLoadMoreButton is true', () => {
    const props = {
        useLoadMoreButton: true,
        fetchItems: emptyPromise,
        currentItemCount: 1
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    expect(wrapper.find('button.pw-lazy-loader__load-more').length).toBe(1)
})

test('shows loadMoreItemsMessage is not all items are loaded', () => {
    const props = {
        useLoadMoreButton: true,
        fetchItems: emptyPromise,
        currentItemCount: 1,
        itemTotal: 3,
        loadMoreItemsMessage: 'load more'
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const loadMoreButton = wrapper.find('button.pw-lazy-loader__load-more')
    expect(loadMoreButton.text()).toBe(props.loadMoreItemsMessage)
})

test('shows the allItemsLoadedMessage if all items are loaded', () => {
    const props = {
        useLoadMoreButton: true,
        fetchItems: emptyPromise,
        currentItemCount: 1,
        itemTotal: 1,
        allItemsLoadedMessage: 'loaded'
    }

    const wrapper = mount(<LazyLoader {...props}>test</LazyLoader>)
    const loadMoreButton = wrapper.find('button.pw-lazy-loader__load-more')
    expect(loadMoreButton.text()).toBe(props.allItemsLoadedMessage)
})
