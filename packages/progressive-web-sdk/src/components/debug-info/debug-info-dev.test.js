/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
/* eslint-env jest */
import React from 'react'
import Sheet from '../sheet'

import DebugPartial from './partial/debug-partial'
import {clearOrigin} from '../../asset-utils.js'

const addMobifyTagScript = () => {
    const script = global.document.createElement('script')
    script.src = '//cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.js'
    script.id = 'mobify-v8-tag'
    global.document.body.appendChild(script)
}

const setupWindowMobify = (isPreview = true) => {
    global.Mobify = {}
    global.Mobify.isPreview = isPreview
}

const removeMobifyTagScript = () => {
    const scripts = Array.from(document.getElementsByTagName('script'))
    scripts.forEach((script) => script.parentElement.removeChild(script))
}
let DebugInfo

describe('Testing DebugInfo in dev environment', () => {
    beforeAll(() => {
        addMobifyTagScript()
        DebugInfo = require('./index').default
    })

    beforeEach(() => {
        setupWindowMobify()
        global.Progressive = {}
        const mockFetchPromise = Promise.resolve({
            headers: {
                get: () => {
                    return '100'
                },
                has: () => {
                    return true
                }
            },
            ok: true
        })
        global.fetch = jest.fn()
        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)
    })

    afterAll(() => {
        clearOrigin()
        removeMobifyTagScript()
        global.fetch.mockClear()
        global.Progressive = {}
    })

    test('DebugInfo renders without errors', () => {
        const wrapper = shallow(<DebugInfo />)
        expect(wrapper.length).toBe(1)
    })

    test('DebugInfo should not render', () => {
        const wrapper = mount(
            <DebugInfo
                shouldRender={() => {
                    return false
                }}
            />
        )
        expect(wrapper.length).toBe(1)
        expect(wrapper.find('Sheet').length).toBe(0)
    })

    test('DebugInfo renders DebugToggle button and DebugPartial check for mock data', () => {
        const wrapper = shallow(<DebugInfo />)
        expect(wrapper.find(Sheet).length).toBe(1)
        expect(wrapper.find('DebugPartial').length).toBe(1)
        expect(wrapper.find('Button').length).toBe(1)
        expect(wrapper.find('DebugPartial').prop('target')).toBe('company-xyz-production')
        expect(wrapper.find('DebugPartial').prop('isPreview')).toBe(true)
    })

    test('DebugInfo has correct bundle number', (done) => {
        const wrapper = mount(<DebugInfo />)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        process.nextTick(() => {
            expect(wrapper.state().bundleId).toBe('100')
            global.fetch.mockClear()
            done()
        })
    })

    test('DebugInfo does not have target, project, or cloudURL', () => {
        removeMobifyTagScript()
        clearOrigin()
        const wrapper = shallow(<DebugInfo />)
        expect(wrapper.find('DebugPartial').length).toBe(1)
        expect(wrapper.find('DebugPartial').prop('target')).toBeFalsy()
        expect(wrapper.find('DebugPartial').prop('projectId')).toBeFalsy()
        expect(wrapper.find('DebugPartial').prop('cloudURL')).toBeFalsy()
        addMobifyTagScript()
    })

    test('DebugInfo gets bundleId from window object', (done) => {
        global.Progressive = {ssrOptions: {bundleId: '100'}}
        const wrapper = mount(<DebugInfo />)
        expect(global.fetch).not.toHaveBeenCalled()
        process.nextTick(() => {
            expect(wrapper.state().bundleId).toBe('100')
            done()
        })
        global.Progressive = {}
    })

    test('Sheet is shown when isDebugOpen is true', () => {
        const wrapper = mount(<DebugInfo />)
        let sheet = wrapper.find(Sheet)
        expect(sheet.props().open).toBe(false)
        wrapper.setState({isDebugOpen: true}, () => {
            expect(wrapper.instance().state.isDebugOpen).toBe(true)
        })
        wrapper.update()
        sheet = wrapper.find(Sheet)
        expect(sheet.props().open).toBe(true)
    })

    test('clicking on the Debug button calls toggleModal', () => {
        const props = {
            ...DebugInfo.defaultProps,
            toggleModal: jest.fn()
        }
        const wrapper = mount(<DebugInfo {...props} />)

        expect(wrapper.find('.pw-debug-info__button.pw--toggle').length).toBe(1)
        expect(wrapper.state('isDebugOpen')).toEqual(false)
        wrapper.find('.pw-debug-info__button.pw--toggle').simulate('click')
        expect(wrapper.state('isDebugOpen')).toEqual(true)
    })

    test('clicking on the close calls toggleModal', () => {
        const props = {
            ...DebugInfo.defaultProps,
            toggleModal: jest.fn()
        }
        const wrapper = mount(<DebugInfo {...props} />)

        expect(wrapper.find('.pw-debug-info__header-actions-start').length).toBe(0)
        expect(wrapper.state('isDebugOpen')).toEqual(false)
        wrapper.find('.pw-debug-info__button.pw--toggle').simulate('click')
        expect(wrapper.state('isDebugOpen')).toEqual(true)

        expect(wrapper.find('.pw-debug-info__header-actions-start').length).toBe(1)
        wrapper
            .find('.pw-debug-info__header-actions-start .pw-debug-info__button')
            .simulate('click')
        expect(wrapper.state('isDebugOpen')).toEqual(false)
    })
})

describe('Testing the bad promises', () => {
    beforeEach(() => {
        setupWindowMobify()
        addMobifyTagScript()
    })

    test('DebugInfo fetch is null promise reject', (done) => {
        const mockFetchPromise = Promise.reject(null)
        global.fetch = jest.fn()
        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)

        const wrapper = shallow(<DebugInfo />)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        process.nextTick(() => {
            // DebugInfo is a wrapped in the connect component
            // Need to find it to get its state
            expect(wrapper.state('bundleId')).toBe('0')
            global.fetch.mockClear()
            done()
        })
    })

    test('DebugInfo fetch is null promise resolve', (done) => {
        const mockFetchPromise = Promise.resolve({ok: false})
        global.fetch = jest.fn()
        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)

        const wrapper = shallow(<DebugInfo />)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        process.nextTick(() => {
            expect(wrapper.state('bundleId')).toBe('0')
            global.fetch.mockClear()
            done()
        })
    })

    test("DebugInfo fetch doesn't have x-amz-meta-bundle header", (done) => {
        const mockFetchPromise = Promise.resolve({has: () => false})
        global.fetch = jest.fn()
        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)

        const wrapper = shallow(<DebugInfo />)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        process.nextTick(() => {
            expect(wrapper.state('bundleId')).toBe('0')
            global.fetch.mockClear()
            done()
        })
    })
})

describe('Testing DebugPartial', () => {
    beforeEach(() => {
        setupWindowMobify()
        addMobifyTagScript()
    })
    test('BundleId isnt rendered when null', () => {
        const wrapper = mount(
            <DebugPartial
                bundleId={null}
                isPreview={true}
                target={'company-xyz-production'}
                projectId={'companyxyz-mobile'}
                buildOriginUrl={
                    'cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.min.js'
                }
            />
        )
        expect(wrapper.find('p').length).toBe(4)
        expect(wrapper.find({prop: 'buildId'}).length).toBe(0)
    })

    test('Preview isnt rendered when false', () => {
        const wrapper = mount(
            <DebugPartial
                bundleId={'100'}
                isPreview={false}
                target={'company-xyz-production'}
                projectId={'companyxyz-mobile'}
                buildOriginUrl={
                    'cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.min.js'
                }
            />
        )
        expect(wrapper.find('p').length).toBe(4)
        expect(wrapper.find({prop: 'isPreview'}).length).toBe(0)
    })

    test('target isnt rendered when null', () => {
        const wrapper = mount(
            <DebugPartial
                bundleId={'100'}
                isPreview={true}
                target={null}
                projectId={'companyxyz-mobile'}
                buildOriginUrl={
                    'cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.min.js'
                }
            />
        )
        expect(wrapper.find('p').length).toBe(4)
        expect(wrapper.find({prop: 'target'}).length).toBe(0)
    })

    test('projectId isnt rendered when null', () => {
        const wrapper = mount(
            <DebugPartial
                bundleId={'100'}
                isPreview={true}
                target={'company-xyz-production'}
                projectId={null}
                buildOriginUrl={
                    'cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.min.js'
                }
            />
        )
        expect(wrapper.find('p').length).toBe(4)
        expect(wrapper.find({prop: 'projectId'}).length).toBe(0)
    })

    test('buildOriginUrl isnt rendered when null', () => {
        const wrapper = mount(
            <DebugPartial
                bundleId={'100'}
                isPreview={true}
                target={'company-xyz-production'}
                projectId={'companyxyz-mobile'}
                buildOriginUrl={null}
            />
        )
        expect(wrapper.find('p').length).toBe(4)
        expect(wrapper.find({prop: 'buildOriginUrl'}).length).toBe(0)
    })

    test('SSR Timing isnt render when null', () => {
        const wrapper = mount(
            <DebugPartial
                bundleId={'100'}
                isPreview={true}
                target={'company-xyz-production'}
                projectId={'companyxyz-mobile'}
                buildOriginUrl={
                    'cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.min.js'
                }
                ssrTiming={null}
            />
        )
        expect(wrapper.find('p').length).toBe(5)
        expect(wrapper.find({prop: 'ssrTiming'}).length).toBe(0)
    })
    test('test SSR Timing toggle', () => {
        const mockSsrTiming = [
            {
                name: 'call-request-hook',
                duration: 0.301577
            },
            {
                name: 'ssr-setup-1',
                duration: 0.358367
            },
            {
                name: 'ssr-jsdom-setup',
                duration: 46.450514
            },
            {
                name: 'ssr-compilation-browser-source-map-support.js',
                duration: 2.154632
            }
        ]
        const wrapper = mount(
            <DebugPartial
                bundleId={'100'}
                isPreview={true}
                target={'company-xyz-production'}
                projectId={'companyxyz-mobile'}
                ssrTiming={mockSsrTiming}
            />
        )
        expect(wrapper.find('p').length).toBe(4)
        expect(wrapper.find('table').length).toBe(1)
        expect(wrapper.find('tr').length).toBe(4)
    })
})
