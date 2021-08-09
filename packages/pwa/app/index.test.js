import React from 'react'
import {MetaData, OfflineBanner, App} from './index.jsx'
import {shallow} from 'enzyme'

describe('MetaData component is rendered appropriately', () => {
    test('MetaData without any props', () => {
        const wrapper = shallow(<MetaData />)
        expect(wrapper.length).toBe(1)
        expect(wrapper.find('html').length).toBe(1)
        expect(wrapper.find('meta').length).toBe(5)
        expect(wrapper.find('link').length).toBe(3)
        expect(wrapper.find('title').length).toBe(0)
    })

    test('MetaData with title prop', () => {
        const wrapper = shallow(<MetaData title="<title> Title </title>" />)
        expect(wrapper.length).toBe(1)
        expect(wrapper.find('html').length).toBe(1)
        expect(wrapper.find('meta').length).toBe(5)
        expect(wrapper.find('link').length).toBe(3)
        expect(wrapper.find('title').length).toBe(1)
    })

    test('MetaData with all props', () => {
        const wrapper = shallow(
            <MetaData
                title="<title> Title </title>"
                description="Description"
                keywords="some keyword"
            />
        )
        expect(wrapper.length).toBe(1)
        expect(wrapper.find('html').length).toBe(1)
        expect(wrapper.find('meta').length).toBe(7)
        expect(wrapper.find('link').length).toBe(3)
        expect(wrapper.find('title').length).toBe(1)
    })
})

test('OfflineBanner component is rendered appropriately', () => {
    const wrapper = shallow(<OfflineBanner />)
    expect(wrapper.length).toBe(1)
    expect(wrapper.html()).toBe(
        '<header class="t-app__offline-banner"><p>You are currently offline</p></header>'
    )
})

test('App component is rendered appropriately', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.length).toBe(1)
    expect(wrapper.find('MetaData').length).toBe(1)
    expect(wrapper.find('OfflineBanner').length).toBe(1)
    expect(wrapper.find('main').length).toBe(1)
    expect(wrapper.find('Footer').length).toBe(1)
    expect(wrapper.find('SkipLinks').length).toBe(1)
})
