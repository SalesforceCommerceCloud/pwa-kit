/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import Share from './index.jsx'
import ShareSheetContent from './partials/share-sheet-content'

const shareSheetContentClassName = '.pw-share__sheet-content'

// Mock `requestAnimationFrame` for tests run using jsDOM
global.requestAnimationFrame =
    global.window.requestAnimationFrame ||
    function(fn) {
        return setTimeout(fn, 0)
    }

window.sandy = {
    instance: {
        getClientID: () => {
            return 'ABC123'
        }
    }
}

const testEmailShareUrls = (shareConfig, resultUrl) => {
    const props = {
        ...Share.defaultProps,
        shareContent: shareConfig,
        onDismiss: jest.fn(),
        onSuccess: jest.fn()
    }
    const wrapper = mount(
        <ShareSheetContent
            optionsPerCol={props.optionsPerCol}
            optionsPerRow={props.optionsPerRow}
            shareContent={props.shareContent}
            onDismiss={props.onDismiss}
            onFail={props.onFail}
            onSuccess={props.onSuccess}
        />
    )

    wrapper.find('.js-share__email-option').simulate('click')

    expect(JSON.stringify(props.onSuccess.mock.calls[0][0])).toBe(
        JSON.stringify({
            ...shareConfig,
            shareOption: 'email',
            url: resultUrl
        })
    )
}

describe('Share', () => {
    test('Share renders without errors', () => {
        const wrapper = mount(<Share />)
        expect(wrapper.length).toBe(1)
    })

    /* eslint-disable newline-per-chained-call */
    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<Share />)

        expect(wrapper.hasClass('pw-share')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<Share />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<Share className={name} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('renders triggerElement', () => {
        const wrapper = shallow(<Share />)

        expect(wrapper.find('.pw-share__trigger').length).toBe(1)
    })

    test('renders trigger element if triggerElement is passed', () => {
        const customTriggerElement = <button />
        const wrapper = shallow(<Share triggerElement={customTriggerElement} />)

        expect(wrapper.find('.pw-share__trigger').length).toBe(1)
    })

    test('existing trigger class names are present if triggerElement is passed', () => {
        const customTriggerElement = <button className="test-trigger-element" />
        const wrapper = shallow(<Share triggerElement={customTriggerElement} />)

        expect(wrapper.find('.pw-share__trigger.test-trigger-element').length).toBe(1)
    })

    test('clicking on the triggerElement calls onShow', () => {
        const props = {
            ...Share.defaultProps,
            onShow: jest.fn()
        }
        const wrapper = mount(<Share {...props} />)

        expect(wrapper.find('.pw-share__trigger').length).toBe(1)
        expect(props.onShow).not.toBeCalled()
        wrapper.find('.pw-share__trigger').simulate('click')
        expect(props.onShow).toBeCalled()
    })

    test('clicking on the mask calls onDismiss', () => {
        const props = {
            ...Share.defaultProps,
            open: true,
            onDismiss: jest.fn()
        }
        const wrapper = mount(<Share {...props} />)

        expect(wrapper.find('.pw-sheet__mask').length).toBe(1)
        expect(props.onDismiss).not.toBeCalled()
        wrapper.find('.pw-sheet__mask').simulate('click')
        expect(props.onDismiss).toBeCalled()
    })

    test('does not render ShareSheetContent when closed', () => {
        const wrapper = mount(<Share open={false} />)

        expect(wrapper.find(shareSheetContentClassName).length).toBe(0)
    })

    test('renders ShareSheetContent when open', () => {
        const wrapper = mount(<Share open={true} />)

        expect(wrapper.find(shareSheetContentClassName).length).toBe(1)
    })

    test('supports transition lifecycle methods', () => {
        // JSOM 11 doesn't support transition events. But does still have dom elements with
        // defined property value for 'transition'. We coincidentally use this property in
        // our components to determine if there is support for transition events. Lets
        // temporarity remove this property value so we can set our components.
        Object.defineProperty(document.body.style, 'transition', {
            value: undefined,
            writable: true
        })

        const duration = 5
        const timeOut = duration * 100
        const didDismiss = jest.fn()
        const didShow = jest.fn()
        const willDismiss = jest.fn()
        const willShow = jest.fn()

        const wrapper = mount(
            <Share
                duration={duration}
                open={false}
                didDismiss={didDismiss}
                didShow={didShow}
                willDismiss={willDismiss}
                willShow={willShow}
            />
        )

        // Sanity check - rendered, but closed initially
        expect(willShow).not.toBeCalled()
        expect(didShow).not.toBeCalled()
        expect(willDismiss).not.toBeCalled()
        expect(didDismiss).not.toBeCalled()

        const doShow = () => {
            return Promise.resolve()
                .then(() => new Promise((resolve) => wrapper.setProps({open: true}, resolve)))
                .then(
                    () =>
                        new Promise((resolve) => {
                            expect(willShow).toHaveBeenCalledTimes(1)
                            expect(didShow).not.toBeCalled()
                            setTimeout(resolve, timeOut)
                        })
                )
        }

        const afterShow = () => {
            expect(willShow).toHaveBeenCalledTimes(1)
            expect(didShow).toHaveBeenCalledTimes(1)
            expect(willDismiss).not.toBeCalled()
            expect(didDismiss).not.toBeCalled()
        }

        const doDismiss = () => {
            return Promise.resolve()
                .then(() => new Promise((resolve) => wrapper.setProps({open: false}, resolve)))
                .then(
                    () =>
                        new Promise((resolve) => {
                            expect(willDismiss).toHaveBeenCalledTimes(1)
                            expect(didDismiss).not.toBeCalled()
                            setTimeout(resolve, timeOut)
                        })
                )
        }

        const afterDismiss = () => {
            expect(willShow).toHaveBeenCalledTimes(1)
            expect(didShow).toHaveBeenCalledTimes(1)
            expect(willDismiss).toHaveBeenCalledTimes(1)
            expect(didDismiss).toHaveBeenCalledTimes(1)
        }

        return doShow()
            .then(afterShow)
            .then(doDismiss)
            .then(afterDismiss)
            .then(() => {
                // Revert the body style trasition value to it's original.
                Object.defineProperty(document.body.style, 'transition', {
                    value: '',
                    writable: false
                })
            })
    })

    test('uses WebShare API when available', () => {
        const share = navigator.share
        const mockShareFn = jest.fn().mockReturnValue(Promise.resolve(true))
        navigator.share = mockShareFn

        const wrapper = shallow(<Share />)
        expect(wrapper.find('.pw-share__trigger').length).toBe(1)
        wrapper.find('.pw-share__trigger').simulate('click')
        expect(mockShareFn).toBeCalled()

        navigator.share = share
    })

    test('WebShare API calls onFail if it encounters an error', () => {
        const share = navigator.share
        const mockShareFn = jest.fn().mockReturnValue(Promise.reject('error testing'))
        navigator.share = mockShareFn

        const props = {
            ...Share.defaultProps,
            onFail: jest.fn().mockReturnValue(console.log('fail called'))
        }
        const wrapper = mount(<Share {...props} />)
        expect(props.onFail).not.toBeCalled()

        expect(wrapper.find('.pw-share__trigger').length).toBe(1)
        wrapper.find('.pw-share__trigger').simulate('click')
        expect(mockShareFn).toBeCalled()

        // Wait for resolve
        setTimeout(() => {
            expect(props.onFail).toBeCalled()
        }, 100)

        navigator.share = share
    })
})

describe('ShareSheetContent', () => {
    test('ShareSheetContent renders without errors', () => {
        const props = Share.defaultProps
        const wrapper = mount(
            <ShareSheetContent
                optionsPerCol={props.optionsPerCol}
                optionsPerRow={props.optionsPerRow}
                shareContent={props.shareContent}
                onDismiss={props.onDismiss}
                onFail={props.onFail}
                onSuccess={props.onSuccess}
            />
        )
        expect(wrapper.length).toBe(1)
    })

    test('calls onFail when an error occurs while copying', () => {
        const props = {
            ...Share.defaultProps,
            onFail: jest.fn()
        }
        const wrapper = mount(
            <ShareSheetContent
                optionsPerCol={props.optionsPerCol}
                optionsPerRow={props.optionsPerRow}
                shareContent={props.shareContent}
                onDismiss={props.onDismiss}
                onFail={props.onFail}
                onSuccess={props.onSuccess}
            />
        )

        const execCommand = document.execCommand
        document.execCommand = undefined
        expect(wrapper.find('.js-share__copy-option').length).toBe(1)
        expect(props.onFail).not.toBeCalled()
        wrapper.find('.js-share__copy-option').simulate('click')
        expect(props.onFail).toBeCalled()
        document.execCommand = execCommand
    })

    test('calls onFail when an error occurs while sharing or emailing', () => {
        const props = {
            ...Share.defaultProps,
            onFail: jest.fn(),
            shareContent: {title: document.title, url: window.location.href}
        }
        const wrapper = mount(
            <ShareSheetContent
                optionsPerCol={props.optionsPerCol}
                optionsPerRow={props.optionsPerRow}
                shareContent={props.shareContent}
                onDismiss={props.onDismiss}
                onFail={props.onFail}
                onSuccess={props.onSuccess}
            />
        )

        const open = window.open
        window.open = undefined

        // Social sharing failure
        const numDefaultSocialOptions = 2
        const socialOptions = wrapper.find('.js-share__social-option')
        expect(socialOptions.length).toBe(numDefaultSocialOptions)
        expect(props.onFail).not.toBeCalled()
        socialOptions.forEach((option) => {
            option.simulate('click')
        })
        expect(props.onFail).toHaveBeenCalledTimes(numDefaultSocialOptions)

        // Email failure
        expect(wrapper.find('.js-share__email-option').length).toBe(1)
        wrapper.find('.js-share__email-option').simulate('click')
        expect(props.onFail).toHaveBeenCalledTimes(numDefaultSocialOptions + 1)

        window.open = open
    })

    test('calls onFail when an error occurs while printing', () => {
        const props = {
            ...Share.defaultProps,
            onFail: jest.fn()
        }
        const wrapper = mount(
            <ShareSheetContent
                optionsPerCol={props.optionsPerCol}
                optionsPerRow={props.optionsPerRow}
                shareContent={props.shareContent}
                onDismiss={props.onDismiss}
                onFail={props.onFail}
                onSuccess={props.onSuccess}
            />
        )

        const print = window.print
        window.print = undefined
        expect(wrapper.find('.js-share__print-option').length).toBe(1)
        expect(props.onFail).not.toBeCalled()
        wrapper.find('.js-share__print-option').simulate('click')
        expect(props.onFail).toBeCalled()
        window.print = print
    })

    test('calls onSuccess & onDismiss when copying succeeds', () => {
        const props = {
            ...Share.defaultProps,
            shareContent: {
                title: 'test title',
                url: 'test.com',
                text: 'test text',
                shareOption: 'copy'
            },
            onDismiss: jest.fn(),
            onSuccess: jest.fn()
        }
        const wrapper = mount(
            <ShareSheetContent
                optionsPerCol={props.optionsPerCol}
                optionsPerRow={props.optionsPerRow}
                shareContent={props.shareContent}
                onDismiss={props.onDismiss}
                onFail={props.onFail}
                onSuccess={props.onSuccess}
            />
        )

        const execCommand = document.execCommand
        document.execCommand = jest.fn().mockReturnValue(true)
        expect(wrapper.find('.js-share__copy-option').length).toBe(1)
        expect(props.onDismiss).not.toBeCalled()
        expect(props.onSuccess).not.toBeCalled()

        wrapper.find('.js-share__copy-option').simulate('click')
        expect(props.onDismiss).toBeCalled()
        expect(props.onSuccess).toBeCalled()
        expect(JSON.stringify(props.onSuccess.mock.calls[0][0])).toBe(
            JSON.stringify({
                ...props.shareContent,
                url: 'test.com?share_mobify_id=ABC123&share_medium=copy'
            })
        )
        document.execCommand = execCommand
    })

    test('calls onSuccess & onDismiss when emailing and sharing succeeds', () => {
        const props = {
            ...Share.defaultProps,
            shareContent: {title: 'test title', url: 'test.com', text: 'test text'},
            onDismiss: jest.fn(),
            onSuccess: jest.fn()
        }
        const wrapper = mount(
            <ShareSheetContent
                optionsPerCol={props.optionsPerCol}
                optionsPerRow={props.optionsPerRow}
                shareContent={props.shareContent}
                onDismiss={props.onDismiss}
                onFail={props.onFail}
                onSuccess={props.onSuccess}
            />
        )

        const open = window.open
        window.open = jest.fn()

        // Sanity Check
        expect(props.onSuccess).not.toBeCalled()
        expect(props.onDismiss).not.toBeCalled()

        // Facebook Option
        expect(wrapper.find('.js-share__social-option.js--facebook-option').length).toBe(1)
        wrapper.find('.js-share__social-option.js--facebook-option').simulate('click')
        expect(props.onSuccess).toHaveBeenCalledTimes(1)
        expect(props.onDismiss).toHaveBeenCalledTimes(1)

        const fbShare = {
            title: 'test title',
            url: 'test.com',
            text: 'test text',
            shareOption: 'facebook'
        }
        expect(JSON.stringify(props.onSuccess.mock.calls[0][0])).toBe(
            JSON.stringify({
                ...fbShare,
                url: 'test.com?share_mobify_id=ABC123&share_medium=facebook'
            })
        )

        // Twitter Option
        expect(wrapper.find('.js-share__social-option.js--twitter-option').length).toBe(1)
        wrapper.find('.js-share__social-option.js--twitter-option').simulate('click')
        expect(props.onSuccess).toHaveBeenCalledTimes(2)
        expect(props.onDismiss).toHaveBeenCalledTimes(2)

        const twShare = {
            title: 'test title',
            url: 'test.com',
            text: 'test text',
            shareOption: 'twitter'
        }
        expect(JSON.stringify(props.onSuccess.mock.calls[1][0])).toBe(
            JSON.stringify({
                ...twShare,
                url: 'test.com?share_mobify_id=ABC123&share_medium=twitter'
            })
        )

        // Email Option
        expect(wrapper.find('.js-share__email-option').length).toBe(1)
        wrapper.find('.js-share__email-option').simulate('click')
        expect(props.onSuccess).toHaveBeenCalledTimes(3)
        expect(props.onDismiss).toHaveBeenCalledTimes(3)

        const emailShare = {
            title: 'test title',
            url: 'test.com',
            text: 'test text',
            shareOption: 'email'
        }
        expect(JSON.stringify(props.onSuccess.mock.calls[2][0])).toBe(
            JSON.stringify({
                ...emailShare,
                url: 'test.com?share_mobify_id=ABC123&share_medium=email'
            })
        )

        window.open = open
    })

    test('calls onSuccess & onDismiss when printing succeeds', () => {
        const props = {
            ...Share.defaultProps,
            onDismiss: jest.fn(),
            onSuccess: jest.fn(),
            shareContent: {title: document.title, url: window.location.href}
        }
        const wrapper = mount(
            <ShareSheetContent
                optionsPerCol={props.optionsPerCol}
                optionsPerRow={props.optionsPerRow}
                shareContent={props.shareContent}
                onDismiss={props.onDismiss}
                onFail={props.onFail}
                onSuccess={props.onSuccess}
            />
        )

        const print = window.print
        window.print = jest.fn()
        expect(wrapper.find('.js-share__print-option').length).toBe(1)
        expect(props.onDismiss).not.toBeCalled()
        expect(props.onSuccess).not.toBeCalled()

        wrapper.find('.js-share__print-option').simulate('click')
        expect(props.onDismiss).toBeCalled()
        expect(props.onSuccess).toBeCalled()
        window.print = print
    })

    test('returns correct share-able urls with analytics parameters', () => {
        testEmailShareUrls(
            {
                title: 'test title',
                url: 'test.com?test=test'
            },
            'test.com?test=test&share_mobify_id=ABC123&share_medium=email'
        )
        testEmailShareUrls(
            {
                title: 'test title',
                url: 'test.com#test',
                text: 'test text'
            },
            'test.com?share_mobify_id=ABC123&share_medium=email#test'
        )
        testEmailShareUrls(
            {
                title: 'test title',
                url: 'test.com?test=test#test',
                text: 'test text'
            },
            'test.com?test=test&share_mobify_id=ABC123&share_medium=email#test'
        )
    })
})
