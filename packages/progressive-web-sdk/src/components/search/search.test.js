/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'
import Tile from '../tile'
import ListTile from '../list-tile'

import Search from './index.jsx'
import SearchWrapper from './partials/search-wrapper.jsx'

// Mock `requestAnimationFrame` for tests run using jsDOM
global.requestAnimationFrame =
    global.window.requestAnimationFrame ||
    function(fn) {
        return setTimeout(fn, 0)
    }

test('renders without errors', () => {
    const wrapper = mount(<Search />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Search />)

    expect(wrapper.hasClass('pw-search')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Search />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Search className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('has "pw--is-overlay" class when isOverlay is true', () => {
    const wrapper = shallow(<Search isOverlay />)

    expect(wrapper.hasClass('pw--is-overlay')).toBe(true)
})

test('has "pw--is-active" class when isOpen is true', () => {
    const wrapper = mount(<Search />)
    wrapper.setProps({isOpen: true})

    setTimeout(() => {
        expect(wrapper.hasClass('pw--is-active')).toBe(true)
    }, 0)
})

test('clicking on the close button (when Search is NOT active) does not call onClose', () => {
    const props = {
        onClose: jest.fn()
    }
    const wrapper = mount(<Search isOverlay {...props} />)
    const button = wrapper.find('.pw-search__button-close .pw-button')

    expect(button.length).toBe(1)
    expect(props.onClose).not.toBeCalled()
    button.simulate('click')
    expect(props.onClose).not.toBeCalled()
})

test('clicking on the close button (when Search is active) calls onClose', () => {
    const props = {
        onClose: jest.fn()
    }
    const wrapper = mount(<Search isOverlay {...props} />)
    const button = wrapper.find('.pw-search__button-close .pw-button')

    // set to active first
    wrapper.setState({isActive: true})

    expect(button.length).toBe(1)
    expect(props.onClose).not.toBeCalled()
    button.simulate('click')
    expect(props.onClose).toBeCalled()
})

test('clicking on the close button set isActive state to false', () => {
    const wrapper = mount(<Search isOverlay />)
    const button = wrapper.find('.pw-search__button-close .pw-button')

    expect(button.length).toBe(1)
    button.simulate('click')
    expect(wrapper.state('isActive')).toBe(false)
})

test('clicking on the overlay (when Search is not active) does not call onClose', () => {
    const props = {
        onClose: jest.fn()
    }
    const wrapper = mount(<Search isOverlay {...props} />)
    const overlay = wrapper.find('.pw-search__shade')

    expect(overlay.length).toBe(1)
    expect(props.onClose).not.toBeCalled()
    overlay.simulate('click')
    expect(props.onClose).not.toBeCalled()
})

test('clicking on the overlay calls onClose', () => {
    const props = {
        onClose: jest.fn()
    }
    const wrapper = mount(<Search isOverlay {...props} />)
    const overlay = wrapper.find('.pw-search__shade')

    // set to active first
    wrapper.setState({isActive: true})

    expect(overlay.length).toBe(1)
    expect(props.onClose).not.toBeCalled()
    overlay.simulate('click')
    expect(props.onClose).toBeCalled()
})

test('submitting the form calls onSubmit', () => {
    const props = {
        onSubmit: jest.fn()
    }
    const wrapper = mount(<Search {...props} />)
    const form = wrapper.find('.pw-search__form')

    expect(form.length).toBe(1)
    expect(props.onSubmit).not.toBeCalled()
    form.simulate('submit')
    expect(props.onSubmit).toBeCalled()
})

test('clicking on the submit button calls onSubmit', () => {
    const props = {
        onSubmit: jest.fn()
    }
    const wrapper = mount(<Search {...props} />)
    const button = wrapper.find('.pw-search__button-submit .pw-button')

    expect(button.length).toBe(1)
    expect(props.onSubmit).not.toBeCalled()
    wrapper.find('.pw-search__input').simulate('change', {target: {value: 'test'}})
    button.simulate('submit')
    expect(props.onSubmit).toBeCalled()
})

test('state.searchValue is equal to the text that is entered into the input', () => {
    const wrapper = mount(<Search />)
    const input = wrapper.find('.pw-search__input')

    expect(input.length).toBe(1)
    input.simulate('change', {target: {value: 'test'}})
    expect(wrapper.state('searchValue')).toBe('test')
})

test('changing input calls onChange', () => {
    const props = {
        onChange: jest.fn()
    }

    const wrapper = mount(<Search {...props} />)
    expect(wrapper.find('.pw-search__form').length).toBe(1)
    expect(props.onChange).not.toBeCalled()
    wrapper.find('.pw-search__input').simulate('change', {target: {value: 'test'}})
    expect(props.onChange).toBeCalled()
})

test('there is no close button in inline search', () => {
    const wrapper = shallow(<Search />)

    expect(wrapper.find('.pw-search__button-close').length).toBe(0)
})

test('focusInput() is called when search overlay is opened', () => {
    const wrapper = mount(<Search isOverlay />)
    const instance = wrapper.instance()
    const mockFocus = jest.fn(instance.focusInput)

    wrapper.setProps({isOpen: true})

    setTimeout(() => {
        expect(mockFocus).toHaveBeenCalled()
        expect(wrapper.state('isActive')).toBe(true)
    }, 0)
})

test('set searchValue state to empty string when search is closed', () => {
    const props = {
        onChange: jest.fn()
    }

    const wrapper = mount(<Search isOpen {...props} />)
    wrapper.find('.pw-search__input').simulate('change', {target: {value: 'test'}})
    expect(wrapper.state('searchValue')).toBe('test')
    wrapper.setProps({isOpen: false})
    expect(wrapper.state('searchValue')).toBe('')
})

test('set isActive state to true when input is focused', () => {
    const wrapper = mount(<Search />)

    expect(wrapper.state('isActive')).toBe(false)
    wrapper.find('.pw-search__input').simulate('focus')
    expect(wrapper.state('isActive')).toBe(true)
})

test('set searchValue to empty string when isActive is false', () => {
    const wrapper = mount(<Search />)

    wrapper.find('.pw-search__input').simulate('focus')
    wrapper.find('.pw-search__input').simulate('change', {target: {value: 'test'}})
    wrapper.find('.pw-search__shade').simulate('click')
    expect(wrapper.state('searchValue')).toBe('')
})

test('href is passed to the ListTile if href prop is passed to term suggestions', () => {
    const termSuggestions = [
        {
            children: 'test',
            href: 'http://www.mobify.com'
        }
    ]
    const wrapper = mount(<Search termSuggestions={termSuggestions} />)
    const term = wrapper.find('.pw-search__term-suggestions')

    expect(term.length).toBe(1)
    expect(term.find(ListTile).prop('href')).toBe('http://www.mobify.com')
})

test('href is passed to the Tile if href prop is passed to product suggestions', () => {
    const productSuggestions = [
        {
            title: 'test',
            href: 'http://www.mobify.com'
        }
    ]
    const wrapper = mount(<Search productSuggestions={productSuggestions} />)
    const product = wrapper.find('.pw-search__product-suggestions')

    expect(product.find(Tile).prop('href')).toBe('http://www.mobify.com')
})

test('clicking on the term search suggestion calls onClickSuggestion', () => {
    const props = {
        onClickSuggestion: jest.fn(),
        termSuggestions: [
            {
                children: 'test'
            }
        ]
    }
    const wrapper = mount(<Search {...props} />)
    const listPrimary = wrapper.find('.pw-list-tile__primary')

    expect(listPrimary.length).toBe(1)
    expect(props.onClickSuggestion).not.toBeCalled()
    listPrimary.simulate('click')
    expect(props.onClickSuggestion).toBeCalled()
})

test('clicking on product suggestion calls onClickSuggestion', () => {
    const props = {
        onClickSuggestion: jest.fn(),
        productSuggestions: [
            {
                title: 'test'
            }
        ]
    }
    const wrapper = mount(<Search {...props} />)
    const tilePrimary = wrapper.find('.pw-tile__primary').first()

    expect(tilePrimary.length).toBe(1)
    expect(props.onClickSuggestion).not.toBeCalled()
    tilePrimary.simulate('click')
    expect(props.onClickSuggestion).toBeCalled()
})

test("Clear search query button appears when there's text input", () => {
    const wrapper = mount(<Search />)
    const input = wrapper.find('.pw-search__input')
    const clearButton = wrapper.find('.pw-search__button-clear .pw-button')

    expect(input.length).toBe(1)
    expect(clearButton.length).toBe(0)
    input.simulate('change', {target: {value: 'test'}})
    setTimeout(() => {
        expect(clearButton.length).toBe(1)
    }, 0)
})

test('Clear search input when clear button is clicked', () => {
    const wrapper = mount(<Search />)
    const input = wrapper.find('.pw-search__input')
    const clearButton = wrapper.find('.pw-search__button-clear .pw-button')

    expect(wrapper.state('searchValue')).toBe('')
    input.simulate('change', {target: {value: 'test'}})
    expect(wrapper.state('searchValue')).toBe('test')
    setTimeout(() => {
        clearButton.simulate('click')
        expect(wrapper.state('searchValue')).toBe('')
        expect(clearButton.length).toBe(0)
    }, 0)
})

test('resetInput is called when clear search input button is clicked', () => {
    const props = {
        onClear: jest.fn()
    }
    const wrapper = mount(<Search {...props} />)
    const instance = wrapper.instance()
    const mockReset = jest.fn(instance.resetInput)
    const mockClear = jest.fn(instance.clearInput)

    instance.clearInput = mockClear
    instance.resetInput = mockReset

    wrapper.setState({
        searchValue: 'test'
    })

    const clearButton = wrapper.find('.pw-search__button-clear .pw-button')

    expect(mockClear).not.toHaveBeenCalled()
    expect(mockReset).not.toHaveBeenCalled()
    expect(props.onClear).not.toBeCalled()
    clearButton.simulate('click')
    expect(mockClear).toHaveBeenCalled()
    expect(mockReset).toHaveBeenCalled()
    expect(props.onClear).toBeCalled()
})

test('Search component does not include shade when allowPageInteractions is true', () => {
    const wrapper = mount(<Search allowPageInteractions={true} />)

    expect(wrapper.find('.pw-search__shade').length).toBe(0)
})

test('Clicking outside the component closes the suggestions when allowPageInteractions is true', () => {
    const props = {
        onClose: jest.fn(),
        termSuggestions: [
            {
                children: 'test'
            }
        ],
        productSuggestions: [
            {
                title: 'test'
            }
        ]
    }
    const wrapper = mount(<Search allowPageInteractions={true} {...props} />)
    wrapper.find('input').simulate('focus')

    document.dispatchEvent(new Event('mousedown'))

    expect(props.onClose).toBeCalled()
})

test('Setting replaceSearchWithClose to true replaces the search icon with the back icon when overlay is open', () => {
    const props = {
        replaceSearchWithClose: true,
        closeButtonProps: {
            icon: 'caret-left'
        },
        isOverlay: true
    }
    const wrapper = mount(<Search {...props} />)

    expect(wrapper.find('.pw-search__icon-content').length).toBe(0)
    expect(wrapper.find('.pw-search__icon .pw-button.pw--icon-only').length).toBe(1)
})

test('SearchWrapper calls handleBlur on blur', () => {
    jest.useFakeTimers()

    const wrapper = mount(<SearchWrapper onClickOutside={() => {}} />).find('SearchWrapper')
    const handler = jest.fn(wrapper.instance().handleBlur)

    wrapper.instance().handleBlur = handler
    wrapper.instance().forceUpdate()

    expect(handler).not.toBeCalled()

    wrapper
        .find('.pw-search__inner')
        .simulate('focus')
        .simulate('blur')

    setTimeout(() => {
        expect(handler).toBeCalled()
    }, 0)
    jest.runAllTimers()
})
