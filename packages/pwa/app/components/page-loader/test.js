import React from 'react'
import {shallow} from 'enzyme'
import sinon from 'sinon'

import {PageLoader} from './index'
import OfflineSplash from './partials/offline-splash'
import SkeletonBlock from 'progressive-web-sdk/dist/components/skeleton-block'

describe('PageLoader', () => {
    test('renders a Skeleton', () => {
        const wrapper = shallow(<PageLoader />)
        expect(wrapper.length).toBe(1)
        expect(wrapper.find(SkeletonBlock).length).toBe(1)
    })

    test('renders OfflineSplash', () => {
        const wrapper = shallow(<PageLoader error={new Error('offline')} />)
        expect(wrapper.length).toBe(1)
        expect(wrapper.find(SkeletonBlock).length).toBe(0)
        expect(wrapper.find(OfflineSplash).length).toBe(1)
    })

    test('retries to load component on failure', () => {
        const retry = sinon.stub().returns(Promise.resolve())
        const wrapper = shallow(
            <PageLoader error={new Error('offline')} retry={retry} offlineModeStartTime={123} />
        )

        expect(retry.called).toBe(false)
        wrapper.setProps({offlineModeStartTime: null})
        expect(retry.called).toBe(true)
    })
})

describe('OfflineSplash', () => {
    test('renders without errors', () => {
        const wrapper = shallow(<OfflineSplash />)
        expect(wrapper.length).toBe(1)
    })

    test('retry button calls prop function on click', () => {
        const mockRetry = jest.fn()
        const wrapper = shallow(<OfflineSplash retry={mockRetry} />)

        const button = wrapper.find('.c-page-loader__offline-button').first()
        button.simulate('click')

        expect(mockRetry).toHaveBeenCalled()
    })
})
